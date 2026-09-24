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

        // Find all verified delivery partners (excluding unapproved or banned ones)
        const deliveryBoys = await User.find({ 
            role: "deliveryBoy", 
            isApproved: true, 
            isBanned: { $ne: true } 
        })
            .select("name email mobile isOnline lastActive image location")
            .sort({ isOnline: -1, name: 1 });

        return NextResponse.json(deliveryBoys, { status: 200 });
    } catch (err: any) {
        return NextResponse.json({ message: err.message }, { status: 500 });
    }
}