import { NextRequest, NextResponse } from "next/server";
import Razorpay from "razorpay";
import { auth } from "@/auth";

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || "",
    key_secret: process.env.RAZORPAY_KEY_SECRET || ""
});

export async function POST(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const { amount } = await req.json();

        // Amount in paise (₹1 = 100 paise)
        const options = {
            amount: Math.round(Number(amount) * 100),
            currency: "INR",
            receipt: `rcpt_${Date.now()}`
        };

        const razorpayOrder = await razorpay.orders.create(options);

        return NextResponse.json(razorpayOrder, { status: 200 });
    } catch (error: any) {
        console.error("Razorpay order error:", error);
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}