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
    const [session] = await Promise.all([
        auth(),
        connectDb()
    ])

    if (!session || (session.user as any)?.role !== "admin") {
        redirect("/login")
    }

    // Parallel fetch with .lean() for 5-10x faster query execution without Mongoose hydration overhead
    const [orders, deliveryBoys] = await Promise.all([
        Order.find({})
            .populate("user", "name email mobile")
            .populate("assignedDeliveryBoy", "name mobile isOnline")
            .sort({ createdAt: -1 })
            .lean(),
        User.find({ 
            role: "deliveryBoy",
            isApproved: true,
            isBanned: { $ne: true }
        })
            .select("name email mobile isOnline")
            .sort({ isOnline: -1, name: 1 })
            .lean()
    ])

    const plainOrders = JSON.parse(JSON.stringify(orders))
    const plainDeliveryBoys = JSON.parse(JSON.stringify(deliveryBoys))

    return (
        <ManageOrdersClient 
            initialOrders={plainOrders} 
            deliveryBoys={plainDeliveryBoys} 
        />
    )
}