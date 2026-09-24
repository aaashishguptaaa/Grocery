import connectDb from "@/lib/db";
import Message from "@/models/message.model";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    try {
        await connectDb();
        const { searchParams } = new URL(req.url);
        const roomId = searchParams.get("roomId");
        const senderRole = searchParams.get("senderRole") || "admin";

        if (!roomId) {
            return NextResponse.json({ unreadCount: 0 });
        }

        const cleanId = String(roomId).replace(/^order_/, '');
        const queryRooms = Array.from(new Set([String(roomId), cleanId, `order_${cleanId}`]));

        const count = await Message.countDocuments({
            roomId: { $in: queryRooms },
            senderRole: senderRole,
            isRead: false
        });

        return NextResponse.json({ unreadCount: count }, { status: 200 });
    } catch (error: any) {
        console.error("Get unread chat count error:", error);
        return NextResponse.json({ unreadCount: 0 }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        await connectDb();
        const { roomId, senderRole } = await req.json().catch(() => ({}));

        if (!roomId) {
            return NextResponse.json({ success: false, message: "roomId is required" }, { status: 400 });
        }

        const role = senderRole || "admin";
        const cleanId = String(roomId).replace(/^order_/, '');
        const queryRooms = Array.from(new Set([String(roomId), cleanId, `order_${cleanId}`]));

        const result = await Message.updateMany(
            { roomId: { $in: queryRooms }, senderRole: role, isRead: false },
            { $set: { isRead: true } }
        );

        return NextResponse.json({ success: true, modifiedCount: result.modifiedCount }, { status: 200 });
    } catch (error: any) {
        console.error("Mark unread chat error:", error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
