import connectDb from "@/lib/db";
import Message from "@/models/message.model";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    try {
        await connectDb();
        const { senderId, text, roomId, time, senderName, senderRole } = await req.json();

        if (!roomId || !text) {
            return NextResponse.json({ message: "roomId and text are required" }, { status: 400 });
        }

        const role = senderRole || "user";

        // If admin replies, mark all previous customer messages in this room as read
        if (role === "admin") {
            await Message.updateMany(
                { roomId: String(roomId), senderRole: { $ne: "admin" } },
                { $set: { isRead: true } }
            );
        }

        const message = await Message.create({
            senderId: senderId || null,
            text: String(text).trim(),
            roomId: String(roomId),
            senderName: senderName || (role === "admin" ? "Snapcart Store Support" : "User"),
            senderRole: role,
            time: time || new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            isRead: role === "admin" // admin messages don't count as unread customer messages
        });

        return NextResponse.json(message, { status: 200 });
    } catch (error: any) {
        console.error("Save message error:", error);
        return NextResponse.json({ message: `save message error ${error?.message || error}` }, { status: 500 });
    }
}