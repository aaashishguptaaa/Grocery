import connectDb from "@/lib/db";
import Order from "@/models/order.model";
import User from "@/models/user.model";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

export async function POST(req: NextRequest) {
    try {
        await connectDb();
        const session = await auth();
        const userId = session?.user?.id || (session?.user as any)?._id;

        if (!userId) {
            return NextResponse.json({ message: "Unauthorized. Please log in." }, { status: 401 });
        }

        const body = await req.json();
        const { orderId, rating, feedback } = body;

        if (!orderId || typeof rating !== "number" || rating < 1 || rating > 5) {
            return NextResponse.json({ message: "Valid Order ID and rating between 1 and 5 are required." }, { status: 400 });
        }

        const order = await Order.findById(orderId);
        if (!order) {
            return NextResponse.json({ message: "Order not found." }, { status: 404 });
        }

        if (order.status !== "delivered") {
            return NextResponse.json({ message: "You can only rate completed, delivered orders." }, { status: 400 });
        }

        // Save rating to order
        order.deliveryRating = {
            rating,
            feedback: feedback?.trim() || "",
            ratedAt: new Date()
        };
        await order.save();

        // If delivery boy is assigned, update their aggregate rating
        if (order.assignedDeliveryBoy) {
            const allRatedOrders = await Order.find({
                assignedDeliveryBoy: order.assignedDeliveryBoy,
                "deliveryRating.rating": { $exists: true, $ne: null }
            }).select("deliveryRating");

            if (allRatedOrders.length > 0) {
                const totalStars = allRatedOrders.reduce((sum, o) => sum + (o.deliveryRating?.rating || 0), 0);
                const avgRating = Math.round((totalStars / allRatedOrders.length) * 10) / 10;

                await User.findByIdAndUpdate(order.assignedDeliveryBoy, {
                    $set: {
                        "rating.average": avgRating,
                        "rating.count": allRatedOrders.length
                    }
                });
            }
        }

        return NextResponse.json({
            message: "Thank you for rating your delivery partner!",
            deliveryRating: order.deliveryRating
        }, { status: 200 });
    } catch (err: any) {
        console.error("Rate delivery error:", err);
        return NextResponse.json({ message: err.message || "Failed to submit rating" }, { status: 500 });
    }
}
