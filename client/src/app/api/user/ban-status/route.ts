import { auth } from "@/auth";
import connectDb from "@/lib/db";
import User from "@/models/user.model";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
    try {
        await connectDb();
        const session = await auth();
        if (!session || !session.user) {
            return NextResponse.json({ authenticated: false, isBanned: false }, { status: 200 });
        }

        const userId = session.user.id || (session.user as any)._id;
        let user = null;
        if (userId) {
            user = await User.findById(userId).select("isBanned banReason bannedAt role name email");
        } else if (session.user.email) {
            user = await User.findOne({ email: session.user.email }).select("isBanned banReason bannedAt role name email");
        }

        if (!user) {
            return NextResponse.json({ authenticated: false, isBanned: false }, { status: 200 });
        }

        return NextResponse.json({
            authenticated: true,
            userId: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            isBanned: Boolean(user.isBanned),
            banReason: user.banReason || "",
            bannedAt: user.bannedAt || null
        }, { status: 200 });
    } catch (error: any) {
        console.error("Check ban status error:", error);
        return NextResponse.json({ isBanned: false, error: error.message }, { status: 500 });
    }
}
