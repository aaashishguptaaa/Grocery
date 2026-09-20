import { auth } from "@/auth";
import connectDb from "@/lib/db";
import Order from "@/models/order.model";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req:NextRequest) {
    try {
        await connectDb()
        const session = await auth()
        if (!session || !session.user) {
            return NextResponse.json([], { status: 200 })
        }
        const userId = session.user.id || (session.user as any)._id
        const orders = await Order.find({
            $or: [
                { user: userId },
                { user: (session.user as any)?._id },
                { user: session.user?.id }
            ].filter(Boolean)
        }).populate("user assignedDeliveryBoy").sort({ createdAt: -1 })
        return NextResponse.json(orders || [], { status: 200 })
        
    } catch (error) {
        return NextResponse.json({message:`get all orders error:${error}`},{status:500})
    }
}