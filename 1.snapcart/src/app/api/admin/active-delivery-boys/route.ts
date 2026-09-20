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

        // Find all delivery partners including their live GPS coordinates
        const deliveryBoys = await User.find({ role: "deliveryBoy" })
            .select("name email mobile isOnline lastActive image location")
            .sort({ isOnline: -1, name: 1 });

        return NextResponse.json(deliveryBoys, { status: 200 });
    } catch (err: any) {
        return NextResponse.json({ message: err.message }, { status: 500 });
    }
}