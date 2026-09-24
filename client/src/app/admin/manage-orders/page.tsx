import { auth } from '@/auth'
import connectDb from '@/lib/db'
import Order from '@/models/order.model'
import User from '@/models/user.model'
import { redirect } from 'next/navigation'
import React from 'react'
import ManageOrdersClient from '@/components/ManageOrdersClient'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function ManageOrders() {
    await connectDb()
    const session = await auth()

    if (!session || (session.user as any)?.role !== "admin") {
        redirect("/login")
    }

    // Fetch all orders with full population
    const orders = await Order.find({})
        .populate("user", "name email mobile")
        .populate("assignedDeliveryBoy", "name mobile isOnline")
        .sort({ createdAt: -1 })

    // Fetch all verified delivery partners
    const deliveryBoys = await User.find({ 
        role: "deliveryBoy",
        isApproved: true,
        isBanned: { $ne: true }
    })
        .select("name email mobile isOnline")
        .sort({ isOnline: -1, name: 1 })

    const plainOrders = JSON.parse(JSON.stringify(orders))
    const plainDeliveryBoys = JSON.parse(JSON.stringify(deliveryBoys))

    return (
        <ManageOrdersClient 
            initialOrders={plainOrders} 
            deliveryBoys={plainDeliveryBoys} 
        />
    )
}