import connectDb from "@/lib/db";
import Order from "@/models/order.model";
import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

export async function POST(req: NextRequest) {
    try {
        await connectDb();
        const { orderId } = await req.json();

        const updatedOrder = await Order.findByIdAndUpdate(
            orderId,
            { 
                status: "delivered",
                deliveredAt: new Date(),
                isPaid: true
            },
            { new: true }
        );

        if (!updatedOrder) {
            return NextResponse.json({ message: "Order not found" }, { status: 404 });
        }

        // Notify socket server
        try {
            if (process.env.NEXT_PUBLIC_SOCKET_SERVER) {
                await axios.post(`${process.env.NEXT_PUBLIC_SOCKET_SERVER}/notify`, {
                    event: "order-status-update",
                    data: {
                        orderId: updatedOrder._id.toString(),
                        status: "delivered"
                    }
                });
            }
        } catch (socketErr) {
            console.log("Socket notification skipped:", socketErr);
        }

        return NextResponse.json(updatedOrder, { status: 200 });
    } catch (error: any) {
        return NextResponse.json({ message: `Error: ${error.message}` }, { status: 500 });
    }
}