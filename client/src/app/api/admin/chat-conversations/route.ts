import connectDb from "@/lib/db";
import Message from "@/models/message.model";
import User from "@/models/user.model";
import Order from "@/models/order.model";
import { auth } from "@/auth";
import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
    try {
        await connectDb();
        const session = await auth();
        if (!session || (session.user as any)?.role !== "admin") {
            return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
        }

        // Find all messages in store rooms
        const storeMessages = await Message.find({
            roomId: { $regex: /^store_/ }
        }).sort({ createdAt: -1 });

        // Group by roomId
        const roomMap = new Map<string, any[]>();
        for (const msg of storeMessages) {
            if (!roomMap.has(msg.roomId)) {
                roomMap.set(msg.roomId, []);
            }
            roomMap.get(msg.roomId)!.push(msg);
        }

        const conversations = [];

        for (const [roomId, msgs] of roomMap.entries()) {
            const lastMsg = msgs[0]; // index 0 is latest
            const totalMsgs = msgs.length;

            // Count unread customer messages (not from admin and not marked read)
            let unreadCount = 0;
            for (const m of msgs) {
                if (m.senderRole === "admin") break;
                if (!m.isRead) unreadCount++;
            }

            let customerInfo: any = null;
            let orderInfo: any = null;

            // Scenario 1: roomId is store_user_<userId>
            if (roomId.startsWith("store_user_")) {
                const userId = roomId.replace("store_user_", "");
                if (mongoose.Types.ObjectId.isValid(userId)) {
                    const u = await User.findById(userId).select("name email mobile image isBanned banReason role");
                    if (u) {
                        customerInfo = {
                            _id: u._id,
                            name: u.name,
                            email: u.email,
                            mobile: u.mobile,
                            image: u.image,
                            isBanned: Boolean(u.isBanned),
                            banReason: u.banReason || "",
                            role: u.role || "user"
                        };
                    }
                }
            } 
            // Scenario 2: roomId is store_<orderId>
            else if (roomId.startsWith("store_")) {
                const orderId = roomId.replace("store_", "");
                if (mongoose.Types.ObjectId.isValid(orderId)) {
                    const ord = await Order.findById(orderId).populate("user", "name email mobile image isBanned banReason role");
                    if (ord) {
                        orderInfo = {
                            _id: ord._id,
                            totalAmount: ord.totalAmount,
                            status: ord.status,
                            address: ord.address
                        };
                        if (ord.user) {
                            customerInfo = {
                                _id: (ord.user as any)._id,
                                name: (ord.user as any).name,
                                email: (ord.user as any).email,
                                mobile: (ord.user as any).mobile,
                                image: (ord.user as any).image,
                                isBanned: Boolean((ord.user as any).isBanned),
                                banReason: (ord.user as any).banReason || "",
                                role: (ord.user as any).role || "user"
                            };
                        }
                    }
                }
            } 

            // Fallback: If customerInfo is still null, look at the sender of the non-admin message
            if (!customerInfo) {
                const userMsg = msgs.find(m => m.senderRole !== "admin");
                if (userMsg && userMsg.senderId && mongoose.Types.ObjectId.isValid(userMsg.senderId)) {
                    const u = await User.findById(userMsg.senderId).select("name email mobile image isBanned banReason role");
                    if (u) {
                        customerInfo = {
                            _id: u._id,
                            name: u.name,
                            email: u.email,
                            mobile: u.mobile,
                            image: u.image,
                            isBanned: Boolean(u.isBanned),
                            banReason: u.banReason || "",
                            role: u.role || "user"
                        };
                    }
                }
                if (!customerInfo) {
                    customerInfo = {
                        _id: "unknown",
                        name: userMsg?.senderName || "Customer",
                        email: "",
                        mobile: ""
                    };
                }
            }

            conversations.push({
                roomId,
                customer: customerInfo,
                order: orderInfo,
                lastMessage: {
                    text: lastMsg.text,
                    time: lastMsg.time,
                    senderRole: lastMsg.senderRole,
                    senderName: lastMsg.senderName,
                    createdAt: lastMsg.createdAt
                },
                totalMsgs,
                unreadCount
            });
        }

        // Sort conversations by latest message createdAt desc
        conversations.sort((a, b) => {
            const timeA = new Date(a.lastMessage.createdAt || 0).getTime();
            const timeB = new Date(b.lastMessage.createdAt || 0).getTime();
            return timeB - timeA;
        });

        return NextResponse.json(conversations, { status: 200 });
    } catch (error: any) {
        return NextResponse.json({ message: "Failed to fetch conversations", error: error.message }, { status: 500 });
    }
}
