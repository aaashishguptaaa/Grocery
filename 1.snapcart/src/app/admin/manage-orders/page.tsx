import { auth } from '@/auth'
import connectDb from '@/lib/db'
import Order from '@/models/order.model'
import User from '@/models/user.model'
import { redirect } from 'next/navigation'
import React from 'react'
import AdminOrderCard from '@/components/AdminOrderCard'
import Link from 'next/link'
import { ArrowLeft, CalendarDays, CheckCircle2, Clock, MessageSquare, Package, TrendingUp, Truck } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function ManageOrders() {
    await connectDb()
    const session = await auth()

    if (!session || (session.user as any)?.role !== "admin") {
        redirect("/login")
    }

    // Fetch all orders
    const orders = await Order.find({})
        .populate("user", "name email mobile")
        .populate("assignedDeliveryBoy", "name mobile isOnline")
        .sort({ createdAt: -1 })

    // Fetch all delivery partners
    const deliveryBoys = await User.find({ role: "deliveryBoy" })
        .select("name email mobile isOnline")
        .sort({ isOnline: -1, name: 1 })

    const plainOrders = JSON.parse(JSON.stringify(orders))
    const plainDeliveryBoys = JSON.parse(JSON.stringify(deliveryBoys))

    const pending = plainOrders.filter((o: any) => o.status === 'pending').length
    const delivered = plainOrders.filter((o: any) => o.status === 'delivered').length
    const outForDelivery = plainOrders.filter((o: any) => o.status === 'out_for_delivery').length
    const totalRevenue = plainOrders
        .filter((o: any) => o.status === 'delivered')
        .reduce((sum: number, o: any) => sum + (Number(o.total) || 0), 0)

    return (
        <div className="min-h-screen bg-[#f8fafc] pt-24 sm:pt-28 pb-20">
            <div className="w-[94%] sm:w-[90%] max-w-7xl mx-auto space-y-6">
                {/* Back button */}
                <Link 
                    href="/" 
                    className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-gray-600 hover:text-green-700 bg-white px-3.5 py-2 rounded-xl border border-gray-200/80 shadow-xs transition"
                >
                    <ArrowLeft size={16} className="text-green-600" /> Back to Storefront
                </Link>

                {/* Page Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                    <div>
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-2xl bg-green-100 text-green-700 flex items-center justify-center font-bold">
                                <Package size={24} />
                            </div>
                            <div>
                                <div className="flex items-center gap-2.5">
                                    <h1 className="text-2xl sm:text-3xl font-black text-gray-800 tracking-tight">Manage Orders</h1>
                                    <span className="bg-green-600 text-white text-xs font-black px-2.5 py-1 rounded-full shadow-xs">
                                        {plainOrders.length} Live
                                    </span>
                                </div>
                                <p className="text-xs sm:text-sm text-gray-400 font-medium mt-0.5">
                                    Track, dispatch, and review live customer grocery requests in real time
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                        <Link
                            href="/admin/sales-records"
                            className="inline-flex items-center gap-2 bg-white border border-gray-200 hover:border-green-300 text-gray-700 hover:text-green-700 font-bold text-xs sm:text-sm px-4 py-2.5 rounded-2xl shadow-xs transition"
                        >
                            <CalendarDays size={16} className="text-green-600" /> Sales Calendar
                        </Link>
                        <Link
                            href="/admin/customer-chats"
                            className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm px-4 py-2.5 rounded-2xl shadow-sm transition"
                        >
                            <MessageSquare size={16} /> Customer Support Chats
                        </Link>
                    </div>
                </div>

                {/* 4 Metric Stats Summary */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                    <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-100 shadow-sm flex items-start gap-3.5">
                        <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-green-50 text-green-700 flex items-center justify-center shrink-0">
                            <Package size={20} />
                        </div>
                        <div>
                            <div className="text-xl sm:text-2xl font-black text-gray-800">{plainOrders.length}</div>
                            <div className="text-xs font-bold text-gray-500">Total Orders</div>
                            <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-md mt-1 inline-block">
                                All Recorded
                            </span>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-100 shadow-sm flex items-start gap-3.5">
                        <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
                            <Clock size={20} />
                        </div>
                        <div>
                            <div className="text-xl sm:text-2xl font-black text-gray-800">{pending}</div>
                            <div className="text-xs font-bold text-gray-500">Pending Dispatch</div>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md mt-1 inline-block ${
                                pending > 0 ? "bg-amber-100 text-amber-800 animate-pulse" : "bg-gray-100 text-gray-500"
                            }`}>
                                {pending > 0 ? "Needs Attention" : "All Clear"}
                            </span>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-100 shadow-sm flex items-start gap-3.5">
                        <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-purple-50 text-purple-700 flex items-center justify-center shrink-0">
                            <Truck size={20} />
                        </div>
                        <div>
                            <div className="text-xl sm:text-2xl font-black text-gray-800">{outForDelivery}</div>
                            <div className="text-xs font-bold text-gray-500">Out for Delivery</div>
                            <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md mt-1 inline-block">
                                On The Road
                            </span>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-100 shadow-sm flex items-start gap-3.5">
                        <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                            <CheckCircle2 size={20} />
                        </div>
                        <div>
                            <div className="text-xl sm:text-2xl font-black text-gray-800">{delivered}</div>
                            <div className="text-xs font-bold text-gray-500">Completed Orders</div>
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md mt-1 inline-block">
                                Fulfilled & Closed
                            </span>
                        </div>
                    </div>
                </div>

                {/* Orders Grid */}
                <div className="space-y-4">
                    {plainOrders.length > 0 ? (
                        plainOrders.map((order: any) => (
                            <AdminOrderCard
                                key={order._id}
                                order={order}
                                deliveryBoys={plainDeliveryBoys}
                                onUpdate={async () => {
                                    'use server'
                                }}
                            />
                        ))
                    ) : (
                        <div className="bg-white rounded-3xl p-14 text-center border border-gray-100 shadow-sm space-y-3">
                            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto text-gray-400">
                                <Package size={32} />
                            </div>
                            <h3 className="text-lg font-bold text-gray-700">No Orders Placed Yet</h3>
                            <p className="text-xs text-gray-400 max-w-sm mx-auto">
                                When customers place orders through Snapcart, they will appear here instantly with full dispatch management tools.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}