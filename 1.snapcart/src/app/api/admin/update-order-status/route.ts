import connectDb from "@/lib/db";
import Order from "@/models/order.model";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import axios from "axios";

// Non-blocking socket notification helper
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

        const userRole = (session?.user as any)?.role;
        if (!session || (userRole !== "admin" && userRole !== "deliveryBoy")) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { 
            orderId, 
            status, 
            assignedDeliveryBoy, 
            isPaid, 
            otp, 
            acceptDelivery,
            action,
            deliveryFee 
        } = body;

        if (!orderId) {
            return NextResponse.json({ message: "Order ID is required" }, { status: 400 });
        }

        const order = await Order.findById(orderId);
        if (!order) {
            return NextResponse.json({ message: "Order not found" }, { status: 404 });
        }

        const currentUserId = (session?.user as any)?._id || session?.user?.id;
        const updateFields: any = {};

        // 1. Delivery Boy claims/accepts an open broadcast order -> Moves to "assigned"
        if (acceptDelivery && userRole === "deliveryBoy") {
            if (order.assignedDeliveryBoy && order.assignedDeliveryBoy.toString() !== currentUserId.toString()) {
                return NextResponse.json({ message: "This order has already been accepted by another partner." }, { status: 400 });
            }
            updateFields.assignedDeliveryBoy = currentUserId;
            updateFields.status = "assigned";
            updateFields.riderArrivedAtMart = false;
            updateFields.handoverConfirmed = false;
        }

        // 2. Rider reached Mart pickup counter
        if (action === "rider_arrived_at_mart" && userRole === "deliveryBoy") {
            updateFields.riderArrivedAtMart = true;
            updateFields.riderArrivedAt = new Date();
            updateFields.status = "arrived_at_mart";
        }

        // 3. Admin confirms physical packet handover & dispatches order
        if (action === "admin_confirm_handover" && userRole === "admin") {
            updateFields.handoverConfirmed = true;
            updateFields.handoverConfirmedAt = new Date();
            updateFields.status = "out of delivery";
            if (!order.deliveryOtp) {
                updateFields.deliveryOtp = Math.floor(1000 + Math.random() * 9000).toString();
            }
        }

        // 4. Delivery Boy arrived at customer's doorstep
        if (action === 'rider_at_doorstep' && userRole === 'deliveryBoy') {
            // Don't change order status, just notify the customer
        }

        // General status changes
        if (status === "assigned") {
            updateFields.status = "assigned";
        } else if (status === "arrived_at_mart") {
            updateFields.status = "arrived_at_mart";
            updateFields.riderArrivedAtMart = true;
            updateFields.riderArrivedAt = new Date();
        } else if (status === "out of delivery") {
            updateFields.status = "out of delivery";
            updateFields.handoverConfirmed = true;
            if (!order.deliveryOtp) {
                updateFields.deliveryOtp = Math.floor(1000 + Math.random() * 9000).toString();
            }
        } else if (status === "delivered") {
            if (userRole === "deliveryBoy") {
                if (!otp || String(otp).trim() !== String(order.deliveryOtp).trim()) {
                    return NextResponse.json({ 
                        message: "Invalid OTP! Please enter the 4-digit OTP provided by the customer." 
                    }, { status: 400 });
                }
                if (!order.assignedDeliveryBoy) {
                    updateFields.assignedDeliveryBoy = currentUserId;
                }
            }
            updateFields.status = "delivered";
            updateFields.isPaid = true;
            if (!order.deliveredAt) {
                updateFields.deliveredAt = new Date();
            }
        } else if (status === "cancelled") {
            updateFields.status = "cancelled";
        }

        // If assignedDeliveryBoy is explicitly passed by Admin
        if (assignedDeliveryBoy !== undefined && !acceptDelivery && userRole === "admin") {
            if (assignedDeliveryBoy) {
                updateFields.assignedDeliveryBoy = assignedDeliveryBoy;
                if (!order.status || order.status === "pending") {
                    updateFields.status = "assigned";
                }
            } else if (status === "pending" || action === "unassign") {
                updateFields.assignedDeliveryBoy = null;
            }
            // NEVER wipe an existing assigned delivery boy on active/delivered orders!
        }

        if (typeof isPaid === "boolean") {
            updateFields.isPaid = isPaid;
        }

        if (deliveryFee !== undefined && deliveryFee !== null) {
            updateFields.deliveryFee = Number(deliveryFee);
        }

        const updatedOrder = await Order.findByIdAndUpdate(
            orderId,
            { $set: updateFields },
            { new: true }
        )
            .populate("user", "name email mobile")
            .populate("assignedDeliveryBoy", "name mobile isOnline");

        // Broadcast socket events so Admin, Rider and Customer UI update live
        if (action === "rider_arrived_at_mart") {
            await notifySocketServer("rider-arrived-at-mart", {
                orderId: order._id,
                orderNumber: order._id.toString().slice(-6).toUpperCase(),
                riderName: updatedOrder.assignedDeliveryBoy?.name || "Delivery Partner",
                arrivedAt: updateFields.riderArrivedAt
            });
        } else if (action === "admin_confirm_handover" || status === "out of delivery") {
            await notifySocketServer("order-dispatched", {
                orderId: order._id,
                status: "out of delivery",
                riderName: updatedOrder.assignedDeliveryBoy?.name || "Delivery Partner",
                deliveryOtp: updatedOrder.deliveryOtp
            });
        } else if (status === "assigned" || acceptDelivery) {
            if (!updatedOrder.assignedDeliveryBoy) {
                // Open broadcast to all online delivery partners
                await notifySocketServer("new-order-broadcast", {
                    orderId: order._id,
                    deliveryFee: updatedOrder.deliveryFee || 40,
                    city: updatedOrder.address?.city || ""
                });
            } else {
                await notifySocketServer("order-assigned", {
                    orderId: order._id,
                    status: "assigned",
                    assignedDeliveryBoyId: updatedOrder.assignedDeliveryBoy?._id || updatedOrder.assignedDeliveryBoy,
                    riderName: updatedOrder.assignedDeliveryBoy?.name || "Delivery Partner",
                    deliveryFee: updatedOrder.deliveryFee || 40
                });
            }
        } else if (status === 'delivered') {
            await notifySocketServer('order-delivered', {
                orderId: order._id,
                orderNumber: order._id.toString().slice(-6).toUpperCase(),
                riderName: updatedOrder.assignedDeliveryBoy?.name || 'Delivery Partner'
            });
        }
        
        if (action === 'rider_at_doorstep') {
            const riderName = updatedOrder.assignedDeliveryBoy?.name || 'Delivery Partner';
            const alertMsg = body.customMessage || "Delivery partner has reached your doorstep! Please go and receive your groceries.";
            await notifySocketServer('rider-at-doorstep', {
                orderId: order._id,
                riderName,
                customMessage: alertMsg,
                deliveryOtp: updatedOrder.deliveryOtp
            });

            // Also record a chat message into the order room
            try {
                const Message = (await import("@/models/message.model")).default;
                await Message.create({
                    roomId: `order_${order._id}`,
                    senderId: updatedOrder.assignedDeliveryBoy?._id || currentUserId,
                    senderName: riderName,
                    senderRole: "deliveryBoy",
                    text: `🔔 ${alertMsg}`,
                    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                });
            } catch (chatErr) {
                // non-blocking
            }
        }

        return NextResponse.json(updatedOrder, { status: 200 });
    } catch (err: any) {
        console.error("Update order error:", err);
        return NextResponse.json({ message: err.message || "Failed to update order" }, { status: 500 });
    }
}