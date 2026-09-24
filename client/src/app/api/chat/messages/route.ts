import connectDb from "@/lib/db";
import Message from "@/models/message.model";
import { auth } from "@/auth";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    try {
        await connectDb();
        const { roomId } = await req.json();
        if (!roomId) {
            return NextResponse.json({ message: "roomId is required" }, { status: 400 });
        }

        const cleanId = String(roomId).replace(/^order_/, '');
        const queryRooms = Array.from(new Set([String(roomId), cleanId, `order_${cleanId}`]));
        const messages = await Message.find({ roomId: { $in: queryRooms } }).sort({ createdAt: 1 });

        // Filter out accidental duplicates from DB (by unique clientMsgId or database _id)
        const deduplicated: any[] = [];
        const seenKeys = new Set<string>();
        for (const m of messages) {
            const key = m.clientMsgId ? `c_${m.clientMsgId}` : String(m._id);
            if (!seenKeys.has(key)) {
                seenKeys.add(key);
                deduplicated.push(m);
            }
        }

        return NextResponse.json(deduplicated, { status: 200 });
    } catch (error) {
        return NextResponse.json({ message: `get messages error ${error}` }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    try {
        await connectDb();
        const session = await auth();
        if (!session || (session.user as any)?.role !== "admin") {
            return NextResponse.json({ message: "Unauthorized as admin" }, { status: 403 });
        }

        const body = await req.json();
        const { messageId, roomId } = body;

        // Delete entire chat conversation by roomId
        if (roomId && !messageId) {
            await Message.deleteMany({ roomId: String(roomId) });
            return NextResponse.json({ success: true, message: "Entire chat deleted" }, { status: 200 });
        }

        // Delete single message by messageId
        if (messageId) {
            await Message.findByIdAndDelete(messageId);
            return NextResponse.json({ success: true, message: "Message deleted" }, { status: 200 });
        }

        return NextResponse.json({ message: "messageId or roomId is required" }, { status: 400 });
    } catch (error: any) {
        return NextResponse.json({ message: error.message || "Failed to delete" }, { status: 500 });
    }
}