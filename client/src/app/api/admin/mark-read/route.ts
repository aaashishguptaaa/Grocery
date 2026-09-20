import connectDb from "@/lib/db";
import Message from "@/models/message.model";
import { auth } from "@/auth";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    try {
        await connectDb();
        const session = await auth();
        if (!session || (session.user as any)?.role !== "admin") {
            return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
        }

        const { roomId, all } = await req.json().catch(() => ({}));

        let query: any = { senderRole: { $ne: "admin" } };
        if (roomId && !all) {
            query.roomId = String(roomId);
        }

        const result = await Message.updateMany(query, { $set: { isRead: true } });

        return NextResponse.json({ 
            success: true, 
            modifiedCount: result.modifiedCount 
        }, { status: 200 });
    } catch (error: any) {
        return NextResponse.json({ message: `mark read error: ${error.message}` }, { status: 500 });
    }
}
