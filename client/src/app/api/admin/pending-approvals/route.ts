import connectDb from "@/lib/db";
import User from "@/models/user.model";
import { NextResponse } from "next/server";
import { auth } from "@/auth";

export async function GET() {
    try {
        await connectDb();
        const session = await auth();

        if (!session || (session.user as any)?.role !== "admin") {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const pendingDeliveryBoys = await User.find({
            role: "deliveryBoy",
            isApproved: { $ne: true },
            isBanned: { $ne: true },
        })
            .select("name email mobile createdAt")
            .sort({ createdAt: -1 });

        return NextResponse.json({
            count: pendingDeliveryBoys.length,
            applicants: pendingDeliveryBoys,
        }, { status: 200 });

    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
