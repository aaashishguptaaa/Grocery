import connectDb from "@/lib/db";
import Order from "@/models/order.model";
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { auth } from "@/auth";

export async function POST(req: NextRequest) {
    try {
        await connectDb();
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            orderData
        } = body;

        // Verify cryptographic bank signature
        const secret = process.env.RAZORPAY_KEY_SECRET || "";
        const expectedSignature = crypto
            .createHmac("sha256", secret)
            .update(`${razorpay_order_id}|${razorpay_payment_id}`)
            .digest("hex");

        if (expectedSignature !== razorpay_signature) {
            return NextResponse.json({ message: "Invalid payment signature! Payment verification failed." }, { status: 400 });
        }

        // Signature is 100% Authentic -> Create verified paid order in MongoDB
        const newOrder = await Order.create({
            user: session.user.id,
            items: orderData.items,
            totalAmount: orderData.totalAmount,
            paymentMethod: "online",
            isPaid: true,
            status: "pending",
            transactionId: razorpay_payment_id,
            address: orderData.address
        });

        return NextResponse.json(newOrder, { status: 201 });
    } catch (error: any) {
        console.error("Payment verification error:", error);
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}