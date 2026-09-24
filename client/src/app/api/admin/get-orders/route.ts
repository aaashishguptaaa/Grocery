import connectDb from "@/lib/db";
import Order from "@/models/order.model";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: NextRequest) {
    try {
        await connectDb();
        const orders = await Order.find({})
            .populate("user", "name email mobile")
            .populate("assignedDeliveryBoy", "name mobile isOnline")
            .sort({ createdAt: -1 })
            .lean();
        return NextResponse.json(orders, { status: 200 });
    } catch (error) {
        return NextResponse.json(
            { message: `get orders error: ${error}` },
            { status: 500 }
        );
    }
}