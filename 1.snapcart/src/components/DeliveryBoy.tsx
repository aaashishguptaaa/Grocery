import React from 'react'
import connectDb from '@/lib/db'
import Order from '@/models/order.model'
import { auth } from '@/auth'
import DeliveryBoyDashboard from './DeliveryBoyDashboard'
import mongoose from 'mongoose'

async function DeliveryBoy() {
    await connectDb()
    const session = await auth()
    const currentBoyId = (session?.user as any)?._id || session?.user?.id

    const validObjId = currentBoyId && mongoose.Types.ObjectId.isValid(currentBoyId)
        ? new mongoose.Types.ObjectId(currentBoyId)
        : null

    const boyIdConditions: any[] = [
        { assignedDeliveryBoy: null },
        { assignedDeliveryBoy: { $exists: false } },
        { assignedDeliveryBoy: currentBoyId }
    ]
    if (validObjId) {
        boyIdConditions.push({ assignedDeliveryBoy: validObjId })
    }

    // Find orders ready for delivery:
    // 1. Broadcast to all (open pool)
    // 2. Assigned specifically to this delivery boy
    const orders = await Order.find({
        status: { $in: ["assigned", "arrived_at_mart", "out of delivery"] },
        $or: boyIdConditions
    })
    .populate("user", "name mobile")
    .populate("assignedDeliveryBoy", "name mobile")
    .sort({ createdAt: -1 })
    .lean()

    const plainOrders = JSON.parse(JSON.stringify(orders))
    const plainUser = JSON.parse(JSON.stringify(session?.user || {}))

    return (
        <DeliveryBoyDashboard initialOrders={plainOrders} user={plainUser} />
    )
}

export default DeliveryBoy