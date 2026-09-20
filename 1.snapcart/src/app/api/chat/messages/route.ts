import connectDb from "@/lib/db";
import Message from "@/models/message.model";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    try {
        await connectDb();
        const { roomId } = await req.json();
        if (!roomId) {
            return NextResponse.json({ message: "roomId is required" }, { status: 400 });
        }

        const messages = await Message.find({ roomId: String(roomId) }).sort({ createdAt: 1 });

        return NextResponse.json(messages, { status: 200 });
    } catch (error) {
        return NextResponse.json({ message: `get messages error ${error}` }, { status: 500 });
    }
}