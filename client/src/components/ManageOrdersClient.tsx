'use client'

import React, { useState, useEffect, useRef } from 'react'
import AdminOrderCard from '@/components/AdminOrderCard'
import Link from 'next/link'
import axios from 'axios'
import { getSocket } from '@/lib/socket'
import { ArrowLeft, CalendarDays, CheckCircle2, Clock, MessageSquare, Package, Search, Truck, RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'

interface ManageOrdersClientProps {
    initialOrders: any[]
    deliveryBoys: any[]
}

export default function ManageOrdersClient({
    initialOrders = [],
    deliveryBoys = []
}: ManageOrdersClientProps) {
    const [orders, setOrders] = useState<any[]>(initialOrders)
    const [searchQuery, setSearchQuery] = useState('')
    const [activeFilter, setActiveFilter] = useState<'all' | 'pending' | 'out_for_delivery' | 'delivered'>('all')
    const [isRefreshing, setIsRefreshing] = useState(false)
    const isFetchingRef = useRef(false)

    // Fetch freshest live orders from MongoDB
    const fetchLiveOrders = async (silent = false) => {
        if (isFetchingRef.current) return
        isFetchingRef.current = true
        if (!silent) setIsRefreshing(true)

        try {
            const res = await axios.get('/api/admin/get-orders')
            if (Array.isArray(res.data)) {
                setOrders(res.data)
            }
        } catch (err) {
            console.error('Failed to refresh orders:', err)
        } finally {
            isFetchingRef.current = false
            if (!silent) setIsRefreshing(false)
        }
    }

    // Background polling every 4 seconds to guarantee accuracy even across Vercel serverless / network drops
    useEffect(() => {
        const interval = setInterval(() => {
            fetchLiveOrders(true)
        }, 4000)
        return () => clearInterval(interval)
    }, [])

    // Real-time socket synchronization
    useEffect(() => {
        const socket = getSocket()
        if (!socket) return

        const handleOrderDelivered = (data: any) => {
            if (data?.orderId) {
                setOrders(prev => prev.map(o => {
                    if (String(o._id) === String(data.orderId)) {
                        return { ...o, status: 'delivered', isPaid: true, deliveredAt: new Date().toISOString() }
                    }
                    return o
                }))
                toast.success(`🎉 Order #${String(data.orderId).slice(-6).toUpperCase()} completed & delivered!`, {
                    duration: 5000,
                    icon: '✅'
                })
            }
            fetchLiveOrders(true)
        }

        const handleStatusUpdate = (data: any) => {
            if (data?.orderId && data?.status) {
                setOrders(prev => prev.map(o => {
                    if (String(o._id) === String(data.orderId)) {
                        return { ...o, status: data.status, isPaid: data.status === 'delivered' ? true : o.isPaid }
                    }
                    return o
                }))
            }
            fetchLiveOrders(true)
        }

        const handleNewOrder = (data: any) => {
            toast('🛒 New incoming order!', { icon: '🛒', duration: 4000 })
            fetchLiveOrders(true)
        }

        const handleRiderArrived = (data: any) => {
            if (data?.orderId) {
                setOrders(prev => prev.map(o => {
                    if (String(o._id) === String(data.orderId)) {
                        return { ...o, status: 'arrived_at_mart', riderArrivedAtMart: true }
                    }
                    return o
                }))
            }
        }

        const handleDispatched = (data: any) => {
            if (data?.orderId) {
                setOrders(prev => prev.map(o => {
                    if (String(o._id) === String(data.orderId)) {
                        return { ...o, status: 'out of delivery', handoverConfirmed: true }
                    }
                    return o
                }))
            }
        }

        socket.on('order-delivered', handleOrderDelivered)
        socket.on('order-status-update', handleStatusUpdate)
        socket.on('new-order', handleNewOrder)
        socket.on('rider-arrived-at-mart', handleRiderArrived)
        socket.on('order-dispatched', handleDispatched)

        return () => {
            socket.off('order-delivered', handleOrderDelivered)
            socket.off('order-status-update', handleStatusUpdate)
            socket.off('new-order', handleNewOrder)
            socket.off('rider-arrived-at-mart', handleRiderArrived)
            socket.off('order-dispatched', handleDispatched)
        }
    }, [])

    // Real-time calculated metrics
    const totalOrders = orders.length
    const pending = orders.filter(o => o.status === 'pending').length
    const outForDelivery = orders.filter(o => o.status === 'out of delivery' || o.status === 'out_for_delivery').length
    const delivered = orders.filter(o => o.status === 'delivered').length

    // Filtered & searched orders
    const filteredOrders = orders.filter(order => {
        // Tab filter
        if (activeFilter === 'pending' && order.status !== 'pending') return false
        if (activeFilter === 'out_for_delivery' && order.status !== 'out of delivery' && order.status !== 'out_for_delivery') return false
        if (activeFilter === 'delivered' && order.status !== 'delivered') return false

        // Search query
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase().trim()
            const shortId = String(order._id).slice(-6).toLowerCase()
            const fullId = String(order._id).toLowerCase()
            const customerName = String(order.user?.name || order.address?.fullName || '').toLowerCase()
            const customerPhone = String(order.user?.mobile || order.address?.mobile || '').toLowerCase()
            const riderName = String(order.assignedDeliveryBoy?.name || '').toLowerCase()

            return shortId.includes(q) || fullId.includes(q) || customerName.includes(q) || customerPhone.includes(q) || riderName.includes(q)
        }
        return true
    })

    return (
        <div className="min-h-screen bg-[#f8fafc] pt-24 sm:pt-28 pb-20">
            <div className="w-[94%] sm:w-[90%] max-w-7xl mx-auto space-y-6">
                {/* Back button & Live status */}
                <div className="flex items-center justify-between gap-3">
                    <Link 
                        href="/" 
                        className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-gray-600 hover:text-green-700 bg-white px-3.5 py-2 rounded-xl border border-gray-200/80 shadow-xs transition"
                    >
                        <ArrowLeft size={16} className="text-green-600" /> Back to Storefront
                    </Link>

                    <button
                        onClick={() => fetchLiveOrders(false)}
                        disabled={isRefreshing}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-green-700 bg-white px-3 py-1.5 rounded-xl border border-gray-200 shadow-xs transition cursor-pointer"
                        title="Force sync with database"
                    >
                        <RefreshCw size={13} className={isRefreshing ? "animate-spin text-green-600" : ""} />
                        <span>{isRefreshing ? 'Refreshing...' : 'Live Sync'}</span>
                    </button>
                </div>

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
                                        {totalOrders} Live
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
                    <div 
                        onClick={() => setActiveFilter('all')}
                        className={`bg-white rounded-2xl p-4 sm:p-5 border shadow-sm flex items-start gap-3.5 cursor-pointer transition ${
                            activeFilter === 'all' ? 'border-green-500 ring-2 ring-green-100' : 'border-gray-100 hover:border-gray-300'
                        }`}
                    >
                        <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-green-50 text-green-700 flex items-center justify-center shrink-0">
                            <Package size={20} />
                        </div>
                        <div>
                            <div className="text-xl sm:text-2xl font-black text-gray-800">{totalOrders}</div>
                            <div className="text-xs font-bold text-gray-500">Total Orders</div>
                            <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-md mt-1 inline-block">
                                All Recorded
                            </span>
                        </div>
                    </div>

                    <div 
                        onClick={() => setActiveFilter('pending')}
                        className={`bg-white rounded-2xl p-4 sm:p-5 border shadow-sm flex items-start gap-3.5 cursor-pointer transition ${
                            activeFilter === 'pending' ? 'border-amber-500 ring-2 ring-amber-100' : 'border-gray-100 hover:border-gray-300'
                        }`}
                    >
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

                    <div 
                        onClick={() => setActiveFilter('out_for_delivery')}
                        className={`bg-white rounded-2xl p-4 sm:p-5 border shadow-sm flex items-start gap-3.5 cursor-pointer transition ${
                            activeFilter === 'out_for_delivery' ? 'border-purple-500 ring-2 ring-purple-100' : 'border-gray-100 hover:border-gray-300'
                        }`}
                    >
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

                    <div 
                        onClick={() => setActiveFilter('delivered')}
                        className={`bg-white rounded-2xl p-4 sm:p-5 border shadow-sm flex items-start gap-3.5 cursor-pointer transition ${
                            activeFilter === 'delivered' ? 'border-emerald-500 ring-2 ring-emerald-100' : 'border-gray-100 hover:border-gray-300'
                        }`}
                    >
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

                {/* Filter and Search Bar */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-gray-100 shadow-xs">
                    <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
                        {[
                            { key: 'all', label: 'All Orders', count: totalOrders },
                            { key: 'pending', label: 'Pending', count: pending },
                            { key: 'out_for_delivery', label: 'Out for Delivery', count: outForDelivery },
                            { key: 'delivered', label: 'Delivered', count: delivered }
                        ].map(tab => (
                            <button
                                key={tab.key}
                                type="button"
                                onClick={() => setActiveFilter(tab.key as any)}
                                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
                                    activeFilter === tab.key 
                                        ? 'bg-green-600 text-white shadow-xs' 
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                            >
                                <span>{tab.label}</span>
                                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                                    activeFilter === tab.key ? 'bg-white/20 text-white' : 'bg-white text-gray-700'
                                }`}>
                                    {tab.count}
                                </span>
                            </button>
                        ))}
                    </div>

                    <div className="relative w-full sm:w-72">
                        <Search className="absolute left-3.5 top-2.5 text-gray-400 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Search Order ID, Customer, Rider..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-green-500 focus:bg-white transition"
                        />
                    </div>
                </div>

                {/* Orders List */}
                <div className="space-y-4">
                    {filteredOrders.length > 0 ? (
                        filteredOrders.map((order: any) => (
                            <AdminOrderCard
                                key={order._id}
                                order={order}
                                deliveryBoys={deliveryBoys}
                                onUpdate={() => fetchLiveOrders(true)}
                            />
                        ))
                    ) : (
                        <div className="bg-white rounded-3xl p-14 text-center border border-gray-100 shadow-sm space-y-3">
                            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto text-gray-400">
                                <Package size={32} />
                            </div>
                            <h3 className="text-lg font-bold text-gray-700">No Orders Found</h3>
                            <p className="text-xs text-gray-400 max-w-sm mx-auto">
                                {searchQuery.trim() 
                                    ? `No orders matching "${searchQuery}". Try searching a different keyword.` 
                                    : 'No orders match this status filter.'}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
