import connectDb from "@/lib/db";
import Message from "@/models/message.model";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    try {
        await connectDb();
        const { senderId, text, roomId, time, senderName, senderRole, clientMsgId } = await req.json();

        if (!roomId || !text) {
            return NextResponse.json({ message: "roomId and text are required" }, { status: 400 });
        }

        const role = senderRole || "user";

        // If admin replies, mark all previous customer messages in this room as read for admin
        if (role === "admin") {
            await Message.updateMany(
                { roomId: String(roomId), senderRole: { $ne: "admin" } },
                { $set: { isRead: true } }
            );
        } else if (role === "user") {
            // If customer sends a message, mark previous admin messages in this room as read
            await Message.updateMany(
                { roomId: String(roomId), senderRole: "admin" },
                { $set: { isRead: true } }
            );
        }

        // Deduplicate using unique clientMsgId (e.g. client and socketServer both saving the exact same message instance)
        if (clientMsgId) {
            const existing = await Message.findOne({ clientMsgId: String(clientMsgId) });
            if (existing) {
                return NextResponse.json(existing, { status: 200 });
            }
        }

        const trimmedText = String(text).trim();

        const message = await Message.create({
            clientMsgId: clientMsgId ? String(clientMsgId) : undefined,
            senderId: senderId || null,
            text: trimmedText,
            roomId: String(roomId),
            senderName: senderName || (role === "admin" ? "Grocery Store Support" : "User"),
            senderRole: role,
            time: time || new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            isRead: false
        });

        return NextResponse.json(message, { status: 200 });
    } catch (error: any) {
        console.error("Save message error:", error);
        return NextResponse.json({ message: `save message error ${error?.message || error}` }, { status: 500 });
    }
}