import connectDb from "@/lib/db";
import Order from "@/models/order.model";
import Grocery from "@/models/grocery.model";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

export async function POST(req: NextRequest) {
    try {
        await connectDb();
        const session = await auth();
        const userId = session?.user?.id || (session?.user as any)?._id;
        const userName = session?.user?.name || "Verified Customer";

        if (!userId) {
            return NextResponse.json({ message: "Unauthorized. Please log in." }, { status: 401 });
        }

        const body = await req.json();
        const { orderId, itemIndex, stars, review } = body;

        if (!orderId || typeof itemIndex !== "number" || typeof stars !== "number" || stars < 1 || stars > 5) {
            return NextResponse.json({ message: "Valid Order ID, item index, and rating between 1 and 5 are required." }, { status: 400 });
        }

        const order = await Order.findById(orderId);
        if (!order) {
            return NextResponse.json({ message: "Order not found." }, { status: 404 });
        }

        if (order.status !== "delivered") {
            return NextResponse.json({ message: "You can only rate products from delivered orders." }, { status: 400 });
        }

        if (!order.items || !order.items[itemIndex]) {
            return NextResponse.json({ message: "Item not found in this order." }, { status: 404 });
        }

        const targetItem = order.items[itemIndex];
        targetItem.rating = {
            stars,
            review: review?.trim() || "",
            ratedAt: new Date()
        };

        order.markModified("items");
        await order.save();

        // Also add or update review in Grocery catalog
        try {
            const grocery = await Grocery.findOne({ name: targetItem.name });
            if (grocery) {
                if (!grocery.reviews) grocery.reviews = [];
                
                grocery.reviews.push({
                    user: userId,
                    userName,
                    stars,
                    comment: review?.trim() || "",
                    createdAt: new Date()
                });

                const totalStars = grocery.reviews.reduce((sum: number, r: any) => sum + (r.stars || 0), 0);
                grocery.rating = {
                    average: Math.round((totalStars / grocery.reviews.length) * 10) / 10,
                    count: grocery.reviews.length
                };

                await grocery.save();
            }
        } catch (catErr) {
            console.error("Failed to update catalog review:", catErr);
        }

        return NextResponse.json({
            message: "Thank you for reviewing this product!",
            rating: targetItem.rating
        }, { status: 200 });
    } catch (err: any) {
        console.error("Rate product error:", err);
        return NextResponse.json({ message: err.message || "Failed to submit product review" }, { status: 500 });
    }
}
