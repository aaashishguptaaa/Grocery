import connectDb from "@/lib/db";
import Order from "@/models/order.model";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
    try {
        const [session] = await Promise.all([
            auth(),
            connectDb()
        ]);
        const userRole = (session?.user as any)?.role;

        if (!session || userRole !== "admin") {
            return NextResponse.json({ message: "Unauthorized: Admin access required" }, { status: 401 });
        }

        // Fetch all delivered orders with .lean()
        const deliveredOrders: any[] = await Order.find({ status: "delivered" })
            .populate("user", "name email mobile")
            .populate("assignedDeliveryBoy", "name mobile")
            .sort({ deliveredAt: -1, createdAt: -1 })
            .lean();

        const deliveredProducts: any[] = [];
        const dailySummaryMap: Record<string, {
            dateStr: string;
            dayOfWeek: string;
            formattedDate: string;
            orderCount: number;
            totalSales: number;
            totalItems: number;
            orderIds: string[];
        }> = {};

        let overallSales = 0;
        let overallItems = 0;

        for (const order of deliveredOrders) {
            const rawDate = order.deliveredAt || order.updatedAt || order.createdAt;
            const dateObj = new Date(rawDate);

            // Timezone-safe local formatting
            const year = dateObj.getFullYear();
            const month = String(dateObj.getMonth() + 1).padStart(2, "0");
            const day = String(dateObj.getDate()).padStart(2, "0");
            const dateKey = `${year}-${month}-${day}`;

            const dayOfWeek = dateObj.toLocaleDateString("en-US", { weekday: "long" });
            const formattedDate = dateObj.toLocaleDateString("en-US", {
                day: "numeric",
                month: "short",
                year: "numeric"
            });
            const formattedTime = dateObj.toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
                hour12: true
            });

            const orderAmount = Number(order.totalAmount) || 0;
            overallSales += orderAmount;

            if (!dailySummaryMap[dateKey]) {
                dailySummaryMap[dateKey] = {
                    dateStr: dateKey,
                    dayOfWeek,
                    formattedDate,
                    orderCount: 0,
                    totalSales: 0,
                    totalItems: 0,
                    orderIds: []
                };
            }

            dailySummaryMap[dateKey].orderCount += 1;
            dailySummaryMap[dateKey].totalSales += orderAmount;
            dailySummaryMap[dateKey].orderIds.push(order._id.toString());

            const customerName = (order.user as any)?.name || order.address?.fullName || "Guest Customer";
            const customerMobile = (order.user as any)?.mobile || order.address?.mobile || "N/A";
            const riderName = (order.assignedDeliveryBoy as any)?.name || "Self / Mart Pickup";
            const riderMobile = (order.assignedDeliveryBoy as any)?.mobile || "";

            const items = Array.isArray(order.items) ? order.items : [];
            for (const item of items) {
                const qty = Number(item.quantity) || 1;
                const price = Number(item.price) || 0;
                const itemTotal = price * qty;
                overallItems += qty;
                dailySummaryMap[dateKey].totalItems += qty;

                deliveredProducts.push({
                    id: `${order._id}_${item._id || item.name}`,
                    orderId: order._id.toString(),
                    orderShortCode: order._id.toString().slice(-6).toUpperCase(),
                    productName: item.name,
                    price: price,
                    quantity: qty,
                    unit: item.unit || "unit",
                    image: item.image || "",
                    totalPrice: itemTotal,
                    paymentMethod: order.paymentMethod || "cod",
                    isPaid: order.isPaid ?? true,
                    customerName,
                    customerMobile,
                    riderName,
                    riderMobile,
                    deliveryDate: dateKey,
                    deliveryDay: dayOfWeek,
                    deliveryTime: formattedTime,
                    timestamp: dateObj.getTime(),
                    addressText: order.address?.fullAddress || `${order.address?.city || ""}, ${order.address?.pincode || ""}`
                });
            }
        }

        return NextResponse.json({
            success: true,
            totalDeliveredOrders: deliveredOrders.length,
            totalDeliveredSales: overallSales,
            totalDeliveredItems: overallItems,
            dailySummary: dailySummaryMap,
            products: deliveredProducts,
            orders: deliveredOrders.map(o => {
                const rawDate = o.deliveredAt || o.updatedAt || o.createdAt;
                const d = new Date(rawDate);
                const year = d.getFullYear();
                const month = String(d.getMonth() + 1).padStart(2, "0");
                const day = String(d.getDate()).padStart(2, "0");
                return {
                    _id: o._id.toString(),
                    orderShortCode: o._id.toString().slice(-6).toUpperCase(),
                    totalAmount: o.totalAmount,
                    deliveryFee: o.deliveryFee,
                    paymentMethod: o.paymentMethod,
                    isPaid: o.isPaid,
                    dateStr: `${year}-${month}-${day}`,
                    dayOfWeek: d.toLocaleDateString("en-US", { weekday: "long" }),
                    formattedDate: d.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" }),
                    formattedTime: d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true }),
                    itemsCount: o.items?.length || 0,
                    customerName: (o.user as any)?.name || o.address?.fullName || "Guest Customer",
                    customerMobile: (o.user as any)?.mobile || o.address?.mobile || "N/A",
                    riderName: (o.assignedDeliveryBoy as any)?.name || "Self / Mart Pickup"
                };
            })
        }, { status: 200 });

    } catch (error: any) {
        console.error("Sales records API error:", error);
        return NextResponse.json({ message: `Failed to fetch sales records: ${error.message}` }, { status: 500 });
    }
}
