import connectDb from "@/lib/db";
import Order from "@/models/order.model";
import User from "@/models/user.model";
import Grocery from "@/models/grocery.model";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import axios from "axios";

async function notifySocketServer(event: string, data: any) {
    try {
        const socketUrl = process.env.NEXT_PUBLIC_SOCKET_SERVER || "http://localhost:4000";
        await axios.post(`${socketUrl}/notify`, { event, data }, { timeout: 1500 });
    } catch (e) {
        // socket server offline is non-blocking
    }
}

export async function POST(req: NextRequest) {
    try {
        await connectDb();
        const session = await auth();
        const body = await req.json();

        const { items, totalAmount, paymentMethod, address } = body;
        
        // Find user ID from body or session
        const userId = body.user || session?.user?.id;

        if (!userId) {
            return NextResponse.json({ message: "User not logged in or missing" }, { status: 400 });
        }

        if (!items || items.length === 0) {
            return NextResponse.json({ message: "Cart items are required" }, { status: 400 });
        }

        if (!address || !address.fullAddress) {
            return NextResponse.json({ message: "Delivery address is required" }, { status: 400 });
        }

        // Verify that none of the ordered items are out of stock
        const groceryIds = items.map((i: any) => i.grocery || i._id);
        const outOfStockGroceries = await Grocery.find({
            _id: { $in: groceryIds },
            inStock: false
        });

        if (outOfStockGroceries.length > 0) {
            return NextResponse.json({
                message: `"${outOfStockGroceries[0].name}" is currently out of stock. Please remove it from your cart.`
            }, { status: 400 });
        }

        // Format items properly to match Mongoose Order schema
        const formattedItems = items.map((item: any) => ({
            grocery: item.grocery || item._id,
            name: item.name,
            price: String(item.price),
            unit: item.unit || "unit",
            image: item.image || "",
            quantity: Number(item.quantity) || 1
        }));

        const newOrder = await Order.create({
            user: userId,
            items: formattedItems,
            totalAmount: Number(totalAmount),
            paymentMethod: paymentMethod || "cod",
            address: {
                fullName: address.fullName || "",
                mobile: address.mobile || "",
                city: address.city || "",
                state: address.state || "",
                pincode: address.pincode || "",
                fullAddress: address.fullAddress || "",
                latitude: Number(address.latitude) || 0,
                longitude: Number(address.longitude) || 0
            },
            isPaid: paymentMethod === "online",
            status: "pending"
        });

        // Notify admin about new order in real-time
        await notifySocketServer('new-order', {
            orderId: newOrder._id,
            orderNumber: newOrder._id.toString().slice(-6).toUpperCase(),
            customerName: address.fullName || 'Customer',
            totalAmount: Number(totalAmount),
            itemCount: items.length,
            city: address.city || ''
        });

        return NextResponse.json(newOrder, { status: 200 });
    } catch (error: any) {
        console.error("Order creation error:", error);
        return NextResponse.json({ message: `Order failed: ${error.message}` }, { status: 500 });
    }
}