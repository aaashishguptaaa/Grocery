import connectDb from "@/lib/db";
import User from "@/models/user.model";
import { NextResponse } from "next/server";
import { auth } from "@/auth";

export async function GET() {
    try {
        await connectDb();
        const session = await auth();
        const userId = session?.user?.id || (session?.user as any)?._id;

        if (!userId) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const user = await User.findById(userId).select("name email role isApproved deliveryApprovalStatus isBanned banReason approvalRequestedAt");
        if (!user) {
            return NextResponse.json({ message: "User not found" }, { status: 404 });
        }

        return NextResponse.json({
            userId: user._id,
            name: user.name,
            role: user.role,
            isApproved: Boolean(user.isApproved),
            deliveryApprovalStatus: user.deliveryApprovalStatus || (user.isApproved ? "approved" : "pending"),
            isBanned: Boolean(user.isBanned),
            banReason: user.banReason,
            approvalRequestedAt: user.approvalRequestedAt,
        }, { status: 200 });

    } catch (error: any) {
        return NextResponse.json({ message: `Status query error: ${error.message}` }, { status: 500 });
    }
}
