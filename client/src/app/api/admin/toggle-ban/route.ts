import { auth } from "@/auth";
import connectDb from "@/lib/db";
import User from "@/models/user.model";
import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

export async function POST(req: NextRequest) {
    try {
        const session = await auth();
        if (!session || (session.user as any)?.role !== "admin") {
            return NextResponse.json({ message: "Unauthorized. Admin privileges required." }, { status: 403 });
        }

        await connectDb();
        const { userId, isBanned, banReason } = await req.json();

        if (!userId) {
            return NextResponse.json({ message: "User ID is required." }, { status: 400 });
        }

        const targetUser = await User.findById(userId);
        if (!targetUser) {
            return NextResponse.json({ message: "User not found." }, { status: 404 });
        }

        // Prevent banning store administrators
        if (targetUser.role === "admin" && isBanned) {
            return NextResponse.json({ 
                message: "Cannot ban an administrator account directly. Demote them to customer or delivery partner first." 
            }, { status: 400 });
        }

        const bannedStatus = Boolean(isBanned);
        const reasonText = bannedStatus
            ? (String(banReason || "").trim() || "Account access restricted due to store safety or policy violation.")
            : "";

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            {
                $set: {
                    isBanned: bannedStatus,
                    banReason: reasonText,
                    bannedAt: bannedStatus ? new Date() : null,
                    ...(bannedStatus ? { isOnline: false } : {})
                }
            },
            { new: true }
        ).select("-password");

        // Broadcast ban status change via socket server (fire and forget)
        try {
            const socketUrl = process.env.NEXT_PUBLIC_SOCKET_SERVER_URL || "http://localhost:5000";
            await axios.post(`${socketUrl}/notify`, {
                event: "user-ban-status-changed",
                data: {
                    userId: String(userId),
                    isBanned: bannedStatus,
                    banReason: reasonText,
                    role: targetUser.role
                }
            }, { timeout: 2500 }).catch(() => {});
        } catch (e) {
            // Safe fallback
        }

        return NextResponse.json({
            success: true,
            message: bannedStatus 
                ? `Account for ${targetUser.name} has been suspended.`
                : `Account for ${targetUser.name} has been unbanned and restored.`,
            user: updatedUser
        }, { status: 200 });

    } catch (error: any) {
        console.error("Toggle ban error:", error);
        return NextResponse.json({ message: `Error updating account restriction: ${error.message}` }, { status: 500 });
    }
}
