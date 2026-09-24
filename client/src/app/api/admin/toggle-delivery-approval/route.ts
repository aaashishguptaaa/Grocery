import connectDb from "@/lib/db";
import User from "@/models/user.model";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import emitEventHandler from "@/lib/emitEventHandler";

export async function POST(req: NextRequest) {
    try {
        const session = await auth();
        if (!session || (session.user as any)?.role !== "admin") {
            return NextResponse.json({ message: "Unauthorized: Admin access required" }, { status: 401 });
        }

        await connectDb();
        const { userId, isApproved } = await req.json();

        if (!userId) {
            return NextResponse.json({ message: "Missing userId" }, { status: 400 });
        }

        const targetUser = await User.findById(userId);
        if (!targetUser) {
            return NextResponse.json({ message: "User not found" }, { status: 404 });
        }

        if (targetUser.role !== "deliveryBoy") {
            return NextResponse.json({ message: "User is not registered as a delivery partner" }, { status: 400 });
        }

        const approveStatus = Boolean(isApproved);
        const updateData: any = {
            isApproved: approveStatus,
            deliveryApprovalStatus: approveStatus ? "approved" : "rejected",
            approvedAt: approveStatus ? new Date() : null,
        };

        if (!approveStatus) {
            updateData.isOnline = false;
        }

        const updated = await User.findByIdAndUpdate(userId, updateData, { new: true }).select("-password");

        // Real-time notification to user
        try {
            await emitEventHandler("delivery-approval-status-changed", {
                userId,
                isApproved: approveStatus,
                status: approveStatus ? "approved" : "rejected",
            });
        } catch (socketErr) {
            console.error("Socket emission failed:", socketErr);
        }

        return NextResponse.json({
            message: approveStatus 
                ? `Delivery partner ${updated.name} has been verified and approved!`
                : `Delivery partner approval for ${updated.name} has been revoked.`,
            user: updated,
        }, { status: 200 });

    } catch (error: any) {
        console.error("toggle-delivery-approval error:", error);
        return NextResponse.json({ message: `Server error: ${error.message}` }, { status: 500 });
    }
}
