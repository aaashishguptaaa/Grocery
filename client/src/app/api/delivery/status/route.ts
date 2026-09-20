import connectDb from "@/lib/db";
import User from "@/models/user.model";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

// GET: Get current status
export async function GET() {
    try {
        await connectDb();
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }
        const user = await User.findById(session.user.id);
        return NextResponse.json({ isOnline: user?.isOnline ?? true }, { status: 200 });
    } catch (err: any) {
        return NextResponse.json({ message: err.message }, { status: 500 });
    }
}

// POST: Delivery partner toggles online / offline
export async function POST(req: NextRequest) {
    try {
        await connectDb();
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const { isOnline } = await req.json();
        const updated = await User.findByIdAndUpdate(
            session.user.id,
            { isOnline: Boolean(isOnline), lastActive: new Date() },
            { new: true }
        );

        return NextResponse.json({ isOnline: updated.isOnline }, { status: 200 });
    } catch (err: any) {
        return NextResponse.json({ message: err.message }, { status: 500 });
    }
}