import connectDb from "@/lib/db";
import Order from "@/models/order.model";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import mongoose from "mongoose";

export async function GET(req: NextRequest) {
    try {
        await connectDb();
        const session = await auth();
        const deliveryBoyId = session?.user?.id || (session?.user as any)?._id;

        if (!deliveryBoyId) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const now = new Date();
        const PAYOUT_PER_DELIVERY = 40; // Default payout per delivery

        // Build query to match both string ID and MongoDB ObjectId
        const validObjId = mongoose.Types.ObjectId.isValid(deliveryBoyId)
            ? new mongoose.Types.ObjectId(deliveryBoyId)
            : null;

        const idConditions: any[] = [{ assignedDeliveryBoy: deliveryBoyId }];
        if (validObjId) {
            idConditions.push({ assignedDeliveryBoy: validObjId });
        }

        // Query all delivered orders by this delivery partner
        const deliveredOrders = await Order.find({
            $or: idConditions,
            status: "delivered"
        })
            .populate("user", "name email mobile")
            .sort({ deliveredAt: -1, updatedAt: -1, createdAt: -1 })
            .lean();

        const getFee = (o: any) =>
            o.deliveryFee !== undefined && o.deliveryFee !== null
                ? Number(o.deliveryFee)
                : PAYOUT_PER_DELIVERY;

        const getOrderDate = (o: any) =>
            new Date(o.deliveredAt || o.updatedAt || o.createdAt);

        // 1. Today (midnight today to now)
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
        const todayDelivered = deliveredOrders.filter(o => getOrderDate(o) >= startOfToday);
        const todayEarnings = todayDelivered.reduce((sum, o) => sum + getFee(o), 0);

        // 2. Yesterday (midnight yesterday to end of yesterday)
        const startOfYesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 0, 0, 0, 0);
        const endOfYesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59, 999);
        const yesterdayDelivered = deliveredOrders.filter(o => {
            const d = getOrderDate(o);
            return d >= startOfYesterday && d <= endOfYesterday;
        });
        const yesterdayEarnings = yesterdayDelivered.reduce((sum, o) => sum + getFee(o), 0);

        // 3. This Week (Monday 00:00:00 to now)
        const dayOfWeek = now.getDay();
        const diffToMonday = (dayOfWeek + 6) % 7;
        const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - diffToMonday, 0, 0, 0, 0);
        const weekDelivered = deliveredOrders.filter(o => getOrderDate(o) >= startOfWeek);
        const weekEarnings = weekDelivered.reduce((sum, o) => sum + getFee(o), 0);

        // 4. This Month (1st of month 00:00:00 to now)
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
        const monthDelivered = deliveredOrders.filter(o => getOrderDate(o) >= startOfMonth);
        const monthEarnings = monthDelivered.reduce((sum, o) => sum + getFee(o), 0);

        // 5. This Year (Jan 1st 00:00:00 to now)
        const startOfYear = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
        const yearDelivered = deliveredOrders.filter(o => getOrderDate(o) >= startOfYear);
        const yearEarnings = yearDelivered.reduce((sum, o) => sum + getFee(o), 0);

        // 6. All Time
        const allTimeOrders = deliveredOrders.length;
        const allTimeEarnings = deliveredOrders.reduce((sum, o) => sum + getFee(o), 0);

        return NextResponse.json({
            today: {
                deliveries: todayDelivered.length,
                earnings: todayEarnings
            },
            yesterday: {
                deliveries: yesterdayDelivered.length,
                earnings: yesterdayEarnings
            },
            thisWeek: {
                deliveries: weekDelivered.length,
                earnings: weekEarnings
            },
            month: {
                deliveries: monthDelivered.length,
                earnings: monthEarnings
            },
            year: {
                deliveries: yearDelivered.length,
                earnings: yearEarnings
            },
            allTime: {
                deliveries: allTimeOrders,
                earnings: allTimeEarnings
            },
            history: deliveredOrders
        }, { status: 200 });
    } catch (err: any) {
        return NextResponse.json({ message: err.message }, { status: 500 });
    }
}