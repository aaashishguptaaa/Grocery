'use client'

import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { motion, AnimatePresence } from 'motion/react'
import { Bell, Bike, Calendar, CheckCircle2, ChevronDown, Compass, DollarSign, Lock, MessageSquare, MapPin, Navigation, Package, Phone, Power, QrCode, Radio, ShieldAlert, Store, TrendingUp, User, X } from 'lucide-react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { getSocket } from '@/lib/socket'
import toast from 'react-hot-toast'
import ChatModal from '@/components/ChatModal'

const LiveMap = dynamic(() => import('@/components/LiveMap'), {
    ssr: false,
    loading: () => <div className="w-full h-56 bg-gray-100 flex items-center justify-center text-xs text-gray-400 rounded-2xl">Loading Live Route Map...</div>
})



// Haversine distance calculator in KM
function getDistanceKm(coord1: [number, number], coord2: [number, number]): number {
    const R = 6371
    const dLat = (coord2[0] - coord1[0]) * Math.PI / 180
    const dLon = (coord2[1] - coord1[1]) * Math.PI / 180
    const a = 
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(coord1[0] * Math.PI / 180) * Math.cos(coord2[0] * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return Math.round(R * c * 10) / 10
}

interface IDeliveryOrder {
    _id: string;
    totalAmount: number;
    status: string;
    paymentMethod: string;
    isPaid?: boolean;
    deliveryOtp?: string;
    assignedDeliveryBoy?: any;
    riderArrivedAtMart?: boolean;
    riderArrivedAt?: string;
    handoverConfirmed?: boolean;
    handoverConfirmedAt?: string;
    deliveryFee?: number;
    deliveredAt?: string;
    deliveryRating?: { rating: number; feedback?: string };
    createdAt: string;
    updatedAt?: string;
    user?: {
        _id?: string;
        name?: string;
        mobile?: string;
        email?: string;
    };
    address?: {
        fullName?: string;
        mobile?: string;
        city?: string;
        fullAddress?: string;
        latitude?: number;
        longitude?: number;
    };
}

export default function DeliveryBoyDashboard({ 
    initialOrders = [], 
    user 
}: { 
    initialOrders: IDeliveryOrder[], 
    user: any 
}) {
    const [isOnline, setIsOnline] = useState<boolean>(user?.isOnline ?? true)
    const [activeOrders, setActiveOrders] = useState<IDeliveryOrder[]>(initialOrders || [])
    const [earningsFilter, setEarningsFilter] = useState<"today" | "yesterday" | "week" | "month" | "year" | "all">("today")
    const [showRecordDropdown, setShowRecordDropdown] = useState<boolean>(false)

    const getRecordLabel = (filter: string) => {
        switch (filter) {
            case "today": return "Today Record"
            case "yesterday": return "Yesterday Record"
            case "week": return "This Week Record"
            case "month": return "This Month Record"
            case "year": return "This Year Record"
            default: return "All Time Record"
        }
    }

    const getRecordDot = (filter: string) => {
        switch (filter) {
            case "today": return "bg-green-500 animate-pulse"
            case "yesterday": return "bg-gray-400"
            case "week": return "bg-blue-500"
            case "month": return "bg-purple-500"
            case "year": return "bg-indigo-500"
            default: return "bg-amber-500"
        }
    }
    
    // Live GPS Location
    const [currentCoords, setCurrentCoords] = useState<[number, number]>([25.4358, 81.8463])
    const [gpsActive, setGpsActive] = useState<boolean>(false)


    const [earningsData, setEarningsData] = useState<any>({
        today: { deliveries: 0, earnings: 0 },
        yesterday: { deliveries: 0, earnings: 0 },
        thisWeek: { deliveries: 0, earnings: 0 },
        month: { deliveries: 0, earnings: 0 },
        year: { deliveries: 0, earnings: 0 },
        allTime: { deliveries: 0, earnings: 0 },
        deliveriesToday: 0,
        deliveriesMonth: 0,
        deliveriesAllTime: 0,
        history: []
    })
    
    // Trip stages
    const [tripStages, setTripStages] = useState<{ [orderId: string]: "on_way_to_store" | "picked_up" | "arrived_customer" }>({})
    
    // Delivery OTP Confirmation Modal
    const [confirmModalOrder, setConfirmModalOrder] = useState<IDeliveryOrder | null>(null)
    const [enteredOtp, setEnteredOtp] = useState("")
    const [loadingAction, setLoadingAction] = useState<boolean>(false)

    // Doorstep QR Modal
    const [doorstepQrOrder, setDoorstepQrOrder] = useState<IDeliveryOrder | null>(null)

    // In-App Chat Modal with Customer
    const [chatOrder, setChatOrder] = useState<IDeliveryOrder | null>(null)

    // Doorstep Arrival Alert Modal
    const [doorstepModalOrder, setDoorstepModalOrder] = useState<IDeliveryOrder | null>(null)
    const [doorstepMessage, setDoorstepMessage] = useState<string>("🔔 I am outside your doorstep! Please come and receive your groceries.")

    // Dismissed on-path alerts
    const [dismissedAlerts, setDismissedAlerts] = useState<string[]>([])

    // Helper functions
    const getAmount = (val: any): number => {
        if (typeof val === 'number') return val
        if (typeof val === 'object' && val !== null) return Number(val.earnings) || 0
        return Number(val) || 0
    }

    const getDeliveriesCount = (val: any, fallback: number = 0): number => {
        if (typeof val === 'object' && val !== null && val.deliveries !== undefined) {
            return Number(val.deliveries) || 0
        }
        return Number(fallback) || 0
    }

    const fetchEarnings = async () => {
        try {
            const res = await axios.get('/api/delivery/earnings')
            if (res.data) {
                setEarningsData(res.data)
            }
        } catch (e) {
            console.log(e)
        }
    }

    // 📡 Live Location Watcher: Sends live GPS coordinates to backend as rider moves
    const sendLocationToBackend = async (lat: number, lng: number) => {
        try {
            await axios.post('/api/delivery/location', { latitude: lat, longitude: lng })
        } catch (e) {
            // silent fail
        }
    }

    // Handle Location Change from GPS or Map Click
    const handleLocationUpdate = (lat: number, lng: number) => {
        setCurrentCoords([lat, lng])
        setGpsActive(true)
        sendLocationToBackend(lat, lng)
    }

    useEffect(() => {
        fetchEarnings()

        let watchId: number | null = null
        if (typeof window !== "undefined" && navigator.geolocation) {
            watchId = navigator.geolocation.watchPosition(
                (pos) => {
                    const lat = pos.coords.latitude
                    const lng = pos.coords.longitude
                    handleLocationUpdate(lat, lng)
                },
                () => {
                    setGpsActive(false)
                },
                { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
            )
        }

        return () => {
            if (watchId !== null && navigator.geolocation) {
                navigator.geolocation.clearWatch(watchId)
            }
        }
    }, [])

    const toggleDuty = async () => {
        const nextState = !isOnline
        setIsOnline(nextState)
        try {
            await axios.post('/api/delivery/status', { isOnline: nextState })
        } catch (e) {
            console.log(e)
        }
    }

    // Accept an open broadcast order
    const handleAcceptBroadcastOrder = async (orderId: string) => {
        setLoadingAction(true)
        try {
            const res = await axios.post('/api/admin/update-order-status', {
                orderId,
                acceptDelivery: true
            })
            if (res.status === 200) {
                toast.success("🎉 Order accepted! It is now assigned to you.")
                setActiveOrders(prev => prev.map(o => o._id === orderId ? { ...o, assignedDeliveryBoy: user } : o))
            }
        } catch (e: any) {
            toast.error(e?.response?.data?.message || "This order could not be accepted.")
        } finally {
            setLoadingAction(false)
        }
    }

    // 📍 Rider marks arrival at Mart counter
    const handleArrivedAtMart = async (orderId: string) => {
        setLoadingAction(true)
        try {
            const res = await axios.post('/api/admin/update-order-status', {
                orderId,
                action: 'rider_arrived_at_mart'
            })
            if (res.status === 200) {
                setActiveOrders(prev => prev.map(o => o._id === orderId ? {
                    ...o,
                    status: 'arrived_at_mart',
                    riderArrivedAtMart: true
                } : o))
                toast.success("📍 Mart Staff Alerted! You have arrived. Please wait at the dispatch counter for packet handover.")
            }
        } catch (e: any) {
            toast.error(e?.response?.data?.message || "Failed to notify mart. Please try again.")
        } finally {
            setLoadingAction(false)
        }
    }

    // 🚀 Listen for real-time dispatch from Admin / Mart
    useEffect(() => {
        const socket = getSocket()
        if (!socket) return

        const handleDispatched = (data: any) => {
            if (data?.orderId) {
                setActiveOrders(prev => prev.map(o => o._id === data.orderId ? {
                    ...o,
                    status: "out of delivery",
                    handoverConfirmed: true,
                    deliveryOtp: data.deliveryOtp || o.deliveryOtp
                } : o))
            }
        }

        const handleAssigned = (data: any) => {
            if (data?.orderId) {
                const feeText = data?.deliveryFee ? ` • Payout: ₹${data.deliveryFee}` : ''
                toast.success(`🛵 New delivery assigned to you! Order #${data?.orderId?.toString().slice(-6).toUpperCase() || ''}${feeText}`, {
                    duration: 6000,
                    style: { background: '#eff6ff', border: '2px solid #3b82f6', color: '#1e40af', fontWeight: '700' }
                })
                // Refresh orders
                window.location.reload()
            }
        }

        const handleBroadcast = (data: any) => {
            const feeText = data?.deliveryFee ? ` • Payout: ₹${data.deliveryFee}` : ''
            toast(`📢 New delivery available nearby!${feeText} • Tap to accept`, {
                icon: '📢',
                duration: 8000,
                style: { background: '#fefce8', border: '2px solid #eab308', color: '#854d0e', fontWeight: '700' }
            })
            window.location.reload()
        }

        socket.on("order-dispatched", handleDispatched)
        socket.on('order-assigned', handleAssigned)
        socket.on('new-order-broadcast', handleBroadcast)
        return () => {
            socket.off("order-dispatched", handleDispatched)
            socket.off('order-assigned', handleAssigned)
            socket.off('new-order-broadcast', handleBroadcast)
        }
    }, [])

    const updateTripStage = async (orderId: string, stage: "arrived_customer", customMsg?: string) => {
        setTripStages(prev => ({ ...prev, [orderId]: stage }))
        if (stage === "arrived_customer") {
            try {
                await axios.post('/api/admin/update-order-status', {
                    orderId,
                    action: 'rider_at_doorstep',
                    customMessage: customMsg || doorstepMessage
                })
                toast.success("🔔 Doorstep Alert Sent! Customer received notification & doorbell chime.")
            } catch (e) {
                toast.error("Failed to notify customer")
            }
        }
    }

    // Verify Customer OTP and Complete Delivery
    const executeCompleteDelivery = async () => {
        if (!confirmModalOrder) return
        if (!enteredOtp || enteredOtp.trim().length !== 4) {
            toast.error("⚠️ Please enter the customer's 4-digit Snapcart OTP.")
            return
        }

        setLoadingAction(true)
        const payout = confirmModalOrder.deliveryFee !== undefined && confirmModalOrder.deliveryFee !== null ? Number(confirmModalOrder.deliveryFee) : 40
        try {
            const res = await axios.post('/api/admin/update-order-status', {
                orderId: confirmModalOrder._id,
                status: 'delivered',
                otp: enteredOtp.trim(),
                isPaid: true
            })

            if (res.status === 200) {
                setActiveOrders((prev) => prev.filter((o) => o._id !== confirmModalOrder._id))
                setConfirmModalOrder(null)
                setEnteredOtp("")
                fetchEarnings()
                toast.success(`🎉 OTP Verified! Order successfully delivered! (+₹${payout} added to your earnings)`)
            }
        } catch (e: any) {
            toast.error(e?.response?.data?.message || "❌ Invalid OTP! Ask customer for their 4-digit code.")
        } finally {
            setLoadingAction(false)
        }
    }

    const historyList: IDeliveryOrder[] = Array.isArray(earningsData?.history) ? earningsData.history : []
    const filteredHistory = historyList.filter((item: IDeliveryOrder) => {
        if (!item) return false
        const dateStr = item.deliveredAt || item.updatedAt || item.createdAt
        if (!dateStr) return false
        const orderDate = new Date(dateStr)
        const now = new Date()
        if (earningsFilter === "today") {
            return orderDate.toDateString() === now.toDateString()
        }
        if (earningsFilter === "yesterday") {
            const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1)
            return orderDate.toDateString() === yesterday.toDateString()
        }
        if (earningsFilter === "week") {
            const dayOfWeek = now.getDay()
            const diffToMonday = (dayOfWeek + 6) % 7
            const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - diffToMonday, 0, 0, 0, 0)
            return orderDate >= startOfWeek
        }
        if (earningsFilter === "month") {
            return orderDate.getMonth() === now.getMonth() && orderDate.getFullYear() === now.getFullYear()
        }
        if (earningsFilter === "year") {
            return orderDate.getFullYear() === now.getFullYear()
        }
        return true
    })

    const filteredEarnings = filteredHistory.reduce((sum, item) => sum + (Number(item.deliveryFee) || 40), 0)

    // Separate broadcast orders from orders already assigned to this partner
    const currentUserId = user?._id || user?.id
    const broadcastOrders = activeOrders.filter(o => !o.assignedDeliveryBoy)
    const myAssignedOrders = activeOrders.filter(o => {
        if (!o.assignedDeliveryBoy) return false
        const assignedId = o.assignedDeliveryBoy._id || o.assignedDeliveryBoy
        return String(assignedId) === String(currentUserId)
    })

    // On-the-way batching detection: If active trip exists, check if any broadcast order is nearby
    const hasActiveTrip = myAssignedOrders.length > 0
    const onTheWayBroadcast = hasActiveTrip 
        ? broadcastOrders.find(o => {
            if (dismissedAlerts.includes(o._id)) return false
            const custLat = o.address?.latitude || 25.4730
            const custLng = o.address?.longitude || 81.8630
            const dist = getDistanceKm(currentCoords, [custLat, custLng])
            return dist <= 6
        })
        : null

    return (
        <div className="pt-28 sm:pt-32 w-[94%] sm:w-[90%] md:w-[85%] max-w-6xl mx-auto pb-24 space-y-4 sm:space-y-6">
            {/* Top Duty Banner with Focus Mode & Live Map Toggle */}
            <div className="bg-white rounded-3xl p-4 sm:p-6 shadow-sm border border-gray-100 space-y-4 sm:space-y-5">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-green-100 flex items-center justify-center text-green-700 shrink-0">
                            <Bike size={24} />
                        </div>
                        <div>
                            <div className="flex items-center gap-2 flex-wrap">
                                <h1 className="text-lg sm:text-xl font-extrabold text-gray-800">
                                    {user?.name || "Delivery Partner"}
                                </h1>
                                <span className="bg-amber-50 text-amber-900 border border-amber-200 px-2 py-0.5 rounded-md font-extrabold text-[11px] flex items-center gap-1">
                                    ⭐ {user?.rating?.average ? Number(user.rating.average).toFixed(1) : "5.0"} ({user?.rating?.count || 0})
                                </span>
                            </div>
                            <p className="text-xs text-gray-500 flex items-center gap-1.5 mt-0.5">
                                <span className={`inline-block w-2 h-2 rounded-full ${isOnline ? "bg-green-500 animate-pulse" : "bg-red-500"}`}></span>
                                <span className={isOnline ? "text-green-700 font-bold" : "text-red-600 font-bold"}>
                                    {isOnline ? "Duty: ONLINE" : "Duty: OFFLINE"}
                                </span>
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
                        {/* Edit Profile Link */}
                        <Link
                            href="/profile"
                            className="px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-2xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border bg-gray-50 hover:bg-gray-100 text-gray-700 border-gray-200 shadow-2xs"
                        >
                            <User size={13} className="text-gray-500" />
                            <span>Profile</span>
                        </Link>

                        {/* Online / Offline Toggle */}
                        <button
                            onClick={toggleDuty}
                            className={`px-4 py-1.5 sm:px-5 sm:py-2 rounded-2xl font-black text-xs transition-all flex items-center gap-1.5 shadow-md cursor-pointer ${
                                isOnline 
                                    ? "bg-green-600 hover:bg-green-700 text-white shadow-green-200" 
                                    : "bg-red-500 hover:bg-red-600 text-white shadow-red-200"
                            }`}
                        >
                            <Power size={13} />
                            <span>{isOnline ? "ONLINE" : "OFFLINE"}</span>
                        </button>
                    </div>
                </div>

            </div>

            {/* 🛵 ON-THE-WAY ORDER BATCHING NOTIFICATION */}
            <AnimatePresence>
                {onTheWayBroadcast && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white p-4 sm:p-5 rounded-3xl shadow-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shrink-0">
                                <Navigation size={22} className="animate-bounce" />
                            </div>
                            <div>
                                <span className="text-[10px] font-black uppercase tracking-wider bg-white/30 px-2 py-0.5 rounded-full inline-block">
                                    🛵 On-Your-Path Delivery Request!
                                </span>
                                <h3 className="text-sm font-extrabold mt-0.5">
                                    Order #{onTheWayBroadcast._id.slice(-6).toUpperCase()} is along your route!
                                </h3>
                                <p className="text-xs opacity-90">
                                    Drop area: {onTheWayBroadcast.address?.city || "Nearby Area"} • Earn extra +₹40 payout
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                            <button
                                type="button"
                                onClick={() => setDismissedAlerts(prev => [...prev, onTheWayBroadcast._id])}
                                className="px-3 py-2 bg-white/20 hover:bg-white/30 text-white rounded-xl text-xs font-bold transition cursor-pointer"
                            >
                                Dismiss
                            </button>

                            <button
                                type="button"
                                onClick={() => handleAcceptBroadcastOrder(onTheWayBroadcast._id)}
                                disabled={loadingAction}
                                className="px-4 py-2 bg-white hover:bg-gray-50 text-amber-900 font-extrabold rounded-xl text-xs shadow-lg transition cursor-pointer"
                            >
                                🟢 Accept & Batch (+₹40)
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>



            {/* 📢 1. BROADCAST OPEN ORDERS (Available for any partner to accept) */}
            {isOnline && broadcastOrders.length > 0 && (
                <div className="space-y-4 bg-gradient-to-r from-purple-500/10 via-amber-500/10 to-green-500/10 p-4 sm:p-6 rounded-3xl border-2 border-dashed border-purple-400">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Radio size={20} className="text-purple-600 animate-pulse" />
                            <h2 className="text-base font-black text-purple-900">
                                📢 Available Delivery Broadcasts ({broadcastOrders.length})
                            </h2>
                        </div>
                        <span className="text-xs font-bold text-purple-700 bg-white px-3 py-1 rounded-full shadow-xs border border-purple-200">
                            First to accept gets the trip!
                        </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {broadcastOrders.map((order) => (
                            <div key={order._id} className="bg-white p-5 rounded-2xl border border-purple-100 shadow-md space-y-3">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-purple-100 text-purple-800">
                                            📢 Broadcast Request
                                        </span>
                                        <h4 className="text-sm font-extrabold text-gray-800 mt-1">
                                            Order #{order._id.slice(-6).toUpperCase()}
                                        </h4>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-xs font-black text-green-700 block bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
                                            +₹{order.deliveryFee !== undefined && order.deliveryFee !== null ? order.deliveryFee : 40} Payout
                                        </span>
                                        <span className="text-[10px] text-gray-400 font-semibold">{order.paymentMethod === 'cod' ? 'COD' : 'Paid Online'}</span>
                                    </div>
                                </div>

                                <div className="text-xs text-gray-600 space-y-1 bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                                    <p className="font-bold text-gray-800 flex items-center gap-1">
                                        <Store size={13} className="text-amber-600" /> Pickup: Snapcart Central Mart
                                    </p>
                                    <p className="flex items-center gap-1">
                                        <MapPin size={13} className="text-red-500" /> Drop: {order.address?.city || "Local Area"} ({order.address?.fullAddress?.slice(0, 35)}...)
                                    </p>
                                </div>

                                <button
                                    onClick={() => handleAcceptBroadcastOrder(order._id)}
                                    disabled={loadingAction}
                                    className="w-full py-2.5 bg-green-600 hover:bg-green-700 text-white font-extrabold rounded-xl shadow transition text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                                >
                                    <CheckCircle2 size={16} /> 🟢 Accept This Delivery (+₹{order.deliveryFee !== undefined && order.deliveryFee !== null ? order.deliveryFee : 40})
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* 🛵 2. MY ASSIGNED ACTIVE ORDERS */}
            <div className="space-y-4">
                <h2 className="text-base font-black text-gray-800 flex items-center gap-2">
                    <Bike size={20} className="text-green-600" />
                    <span>My Active Deliveries ({myAssignedOrders.length})</span>
                </h2>

                {myAssignedOrders.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {myAssignedOrders.map((order) => {
                            const isPaid = order.isPaid || order.paymentMethod === 'online'
                            const isArrivedAtMart = order.riderArrivedAtMart || order.status === "arrived_at_mart"
                            const isHandedOver = order.handoverConfirmed || order.status === "out of delivery"
                            const currentStage = tripStages[order._id] || (isHandedOver ? "dispatched" : "heading_to_store")
                            const customerCoords: [number, number] = [
                                order.address?.latitude || 25.4730,
                                order.address?.longitude || 81.8630
                            ]
                            const storeCoords: [number, number] = [25.4358, 81.8463]
                            const customerMobile = order.address?.mobile || order.user?.mobile || ""

                            return (
                                <motion.div
                                    key={order._id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="bg-white rounded-3xl p-6 border-2 border-green-500/40 shadow-xl space-y-5"
                                >
                                    {/* Header */}
                                    <div className="flex justify-between items-start border-b pb-3">
                                        <div>
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full inline-flex items-center gap-1.5 ${
                                                    isHandedOver 
                                                        ? "bg-blue-100 text-blue-800" 
                                                        : isArrivedAtMart 
                                                        ? "bg-amber-100 text-amber-900 border border-amber-300" 
                                                        : "bg-purple-100 text-purple-800"
                                                }`}>
                                                    {isHandedOver && (
                                                        <span className="relative flex h-2 w-2">
                                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                                            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                                                        </span>
                                                    )}
                                                    {isArrivedAtMart && (
                                                        <span className="relative flex h-2 w-2">
                                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                                                            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                                                        </span>
                                                    )}
                                                    {isHandedOver 
                                                        ? "🚀 Out for Delivery" 
                                                        : isArrivedAtMart 
                                                        ? "⏳ At Mart (Awaiting Handover)" 
                                                        : "🛵 Head to Mart Pickup"}
                                                </span>

                                                <span className="text-[10px] font-black bg-emerald-100 text-emerald-900 border border-emerald-300 px-2 py-0.5 rounded-full">
                                                    💰 Your Payout: ₹{order.deliveryFee !== undefined && order.deliveryFee !== null ? order.deliveryFee : 40}
                                                </span>
                                            </div>
                                            <h3 className="text-base font-black text-gray-800 mt-1">
                                                Order #{order._id.slice(-6).toUpperCase()}
                                            </h3>
                                        </div>

                                        <div className="text-right">
                                            <span className="text-[10px] font-bold text-gray-400 uppercase block">Payment Status</span>
                                            {isPaid ? (
                                                <span className="text-xs font-black text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-200 inline-block">
                                                    ✅ Pre-Paid Online
                                                </span>
                                            ) : (
                                                <span className="text-sm font-black text-red-600 bg-red-50 px-2.5 py-1 rounded-xl border border-red-200 inline-block">
                                                    💵 Collect ₹{order.totalAmount} (COD)
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* In-App Live Map */}
                                    <div className="space-y-1.5">
                                        <p className="text-[11px] font-bold text-gray-500 flex items-center justify-between">
                                            <span>🗺️ Live Route Map</span>
                                            <span className="text-[10px] text-green-700 font-semibold">Store ➔ Customer</span>
                                        </p>
                                        <LiveMap storePos={storeCoords} customerPos={customerCoords} />
                                    </div>

                                    {/* Route Locations */}
                                    <div className="space-y-3 bg-gray-50/80 p-4 rounded-2xl border border-gray-100">
                                        <div className="flex items-start gap-3">
                                            <div className="w-7 h-7 rounded-xl bg-amber-100 flex items-center justify-center text-amber-800 shrink-0 mt-0.5">
                                                <Store size={14} />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-bold text-gray-400 uppercase">Pickup Location (Store)</p>
                                                <p className="text-xs font-bold text-gray-800">Snapcart Central Mart, Prayagraj</p>
                                            </div>
                                        </div>

                                        <div className="border-l-2 border-dashed border-gray-300 ml-3.5 h-3"></div>

                                        <div className="flex items-start gap-3">
                                            <div className="w-7 h-7 rounded-xl bg-green-100 flex items-center justify-center text-green-800 shrink-0 mt-0.5">
                                                <MapPin size={14} />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-bold text-gray-400 uppercase">Delivery Dropoff (Customer)</p>
                                                <p className="text-xs font-bold text-gray-800">{order.address?.fullName || order.user?.name || "Customer"}</p>
                                                <p className="text-xs text-gray-600 mt-0.5">{order.address?.fullAddress}, {order.address?.city}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* 📦 Mart Pickup & Handover Workflow */}
                                    {!isHandedOver ? (
                                        <div className="space-y-2.5">
                                            <div className={`p-4 rounded-2xl border transition ${
                                                isArrivedAtMart 
                                                    ? "bg-amber-50/90 border-amber-300 text-amber-900" 
                                                    : "bg-blue-50/90 border-blue-200 text-blue-900"
                                            }`}>
                                                <div className="flex items-start gap-2.5">
                                                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                                                        isArrivedAtMart ? "bg-amber-200 text-amber-900" : "bg-blue-200 text-blue-900"
                                                    }`}>
                                                        <Store size={18} className={isArrivedAtMart ? "animate-pulse" : ""} />
                                                    </div>
                                                    <div className="grow">
                                                        <h4 className="font-extrabold text-xs flex items-center justify-between">
                                                            <span>{isArrivedAtMart ? "📍 You Are at Mart (Waiting for Handover)" : "🛵 Step 1: Head to Mart for Pickup"}</span>
                                                            <span className="text-[10px] px-2 py-0.5 rounded-md font-black bg-white/70">
                                                                {isArrivedAtMart ? "WAITING AT COUNTER" : "PICKUP PENDING"}
                                                            </span>
                                                        </h4>
                                                        <p className="text-[11px] opacity-80 mt-1">
                                                            {isArrivedAtMart 
                                                                ? "Mart staff has been notified! They are packing & verifying your items. Please wait at the dispatch counter for handover." 
                                                                : "Drive to Central Mart. Tap the button below once you arrive near the store so staff gets notified."}
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="mt-3 flex gap-2">
                                                    {!isArrivedAtMart ? (
                                                        <>
                                                            <a
                                                                href={`https://www.google.com/maps/dir/?api=1&destination=${storeCoords[0]},${storeCoords[1]}`}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="py-2.5 px-3 bg-white hover:bg-gray-50 text-blue-800 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition border border-blue-200 shadow-2xs"
                                                            >
                                                                <Navigation size={13} /> Maps to Mart
                                                            </a>

                                                            <button
                                                                type="button"
                                                                onClick={() => handleArrivedAtMart(order._id)}
                                                                disabled={loadingAction}
                                                                className="grow py-2.5 px-3 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs rounded-xl shadow transition flex items-center justify-center gap-1.5 cursor-pointer"
                                                            >
                                                                <MapPin size={14} /> 📍 1. I Have Arrived at Mart
                                                            </button>
                                                        </>
                                                    ) : (
                                                        <div className="w-full py-2.5 px-3 bg-white text-amber-900 font-extrabold text-xs rounded-xl border border-amber-300 flex items-center justify-center gap-2 shadow-2xs">
                                                            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping"></span>
                                                            <span>Store Notified • Waiting for Mart Staff Handover...</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="p-3 bg-gray-50 rounded-2xl text-center text-xs font-bold text-gray-500 border border-gray-200 flex items-center justify-center gap-2">
                                                <Lock size={14} className="text-gray-400" />
                                                <span>Customer doorstep actions unlock automatically after Mart staff confirms handover.</span>
                                            </div>
                                        </div>
                                    ) : (
                                        /* 🚀 Out for Delivery: Handover confirmed by Admin */
                                        <div className="space-y-2.5">
                                            <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-2xl flex items-center justify-between text-xs font-bold text-emerald-900">
                                                <span className="flex items-center gap-2">
                                                    <CheckCircle2 size={18} className="text-emerald-600" />
                                                    <span>✓ Packet Handed Over by Mart • En Route to Customer</span>
                                                </span>
                                                <span className="text-[10px] bg-emerald-200 text-emerald-900 px-2.5 py-1 rounded-full font-black">
                                                    OUT FOR DELIVERY
                                                </span>
                                            </div>

                                            {/* Arrived at Customer Doorstep Button */}
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setDoorstepModalOrder(order)
                                                    setDoorstepMessage("🔔 I am outside your doorstep! Please come and receive your groceries.")
                                                }}
                                                className={`w-full py-2.5 px-3 rounded-xl text-xs font-extrabold transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 ${
                                                    currentStage === "arrived_customer"
                                                        ? "bg-blue-100 text-blue-900 border border-blue-400 font-black shadow-xs"
                                                        : "bg-red-600 hover:bg-red-700 text-white shadow animate-pulse"
                                                }`}
                                            >
                                                <Bell size={14} />
                                                {currentStage === "arrived_customer" ? "✓ Customer Alerted • Tap to Send Another Alert" : "🔔 2. Arrived at Customer Door (Send Alert)"}
                                            </button>

                                            {/* Doorstep Actions: Phone, In-App Chat, WhatsApp, Google Maps */}
                                            <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
                                                <a
                                                    href={`tel:${customerMobile}`}
                                                    className="py-2 px-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs rounded-xl flex items-center justify-center gap-1 transition"
                                                >
                                                    <Phone size={13} /> Call
                                                </a>

                                                <button
                                                    type="button"
                                                    onClick={() => setChatOrder(order)}
                                                    className="py-2 px-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs rounded-xl flex items-center justify-center gap-1 transition cursor-pointer"
                                                >
                                                    <MessageSquare size={13} /> Chat
                                                </button>

                                                <a
                                                    href={`https://wa.me/${customerMobile.replace(/\D/g, '')}?text=Hello%20from%20Snapcart%20Delivery!%20I%20am%20outside%20with%20your%20order.`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="py-2 px-1 bg-green-50 hover:bg-green-100 text-green-700 font-bold text-xs rounded-xl flex items-center justify-center gap-1 transition"
                                                >
                                                    <MessageSquare size={13} /> WA
                                                </a>

                                                <a
                                                    href={`https://www.google.com/maps/dir/?api=1&destination=${customerCoords[0]},${customerCoords[1]}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="py-2 px-1 bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold text-xs rounded-xl flex items-center justify-center gap-1 transition"
                                                >
                                                    <Navigation size={13} /> Maps
                                                </a>
                                            </div>

                                            {/* If COD: Show Instant Doorstep UPI QR Button */}
                                            {!isPaid && (
                                                <button
                                                    type="button"
                                                    onClick={() => setDoorstepQrOrder(order)}
                                                    className="w-full py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                                                >
                                                    <QrCode size={14} className="text-amber-600" />
                                                    Customer Wants to Pay Online? Show Instant UPI QR
                                                </button>
                                            )}

                                            {/* Mark Delivered Trigger */}
                                            <button
                                                onClick={() => {
                                                    setConfirmModalOrder(order)
                                                    setEnteredOtp("")
                                                }}
                                                className="w-full py-3.5 bg-green-600 hover:bg-green-700 text-white font-extrabold rounded-2xl shadow-lg transition flex items-center justify-center gap-2 cursor-pointer text-sm"
                                            >
                                                <CheckCircle2 size={18} /> Mark Order Delivered (Enter OTP) ✓
                                            </button>
                                        </div>
                                    )}
                                </motion.div>
                            )
                        })}
                    </div>
                ) : (
                    <div className="bg-white rounded-3xl p-12 text-center border border-gray-100 shadow-sm space-y-2">
                        <CheckCircle2 size={44} className="text-green-600 mx-auto" />
                        <h3 className="text-base font-bold text-gray-700">No active delivery trips assigned to you right now</h3>
                        <p className="text-xs text-gray-400">Keep duty Online. When new orders are broadcasted or assigned, they will appear here!</p>
                    </div>
                )}
            </div>

            {/* 📜 3. DETAILED DELIVERY & EARNINGS RECORD */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm space-y-5">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                    <div>
                        <h2 className="text-lg font-black text-gray-800 flex items-center gap-2">
                            <TrendingUp className="text-green-600" /> Delivery History & Earnings
                        </h2>
                        <p className="text-xs text-gray-400">Complete record of every completed order, customer details, and earnings payout</p>
                    </div>

                    {/* Exact Dropdown Button matching user screenshot: [ Today Record ∨ ] */}
                    <div className="relative self-start sm:self-auto">
                        <button
                            type="button"
                            onClick={() => setShowRecordDropdown(!showRecordDropdown)}
                            className="px-4 py-2 rounded-full border border-green-200 bg-green-50/90 hover:bg-green-100 text-green-900 font-extrabold text-xs inline-flex items-center gap-2 shadow-2xs transition cursor-pointer active:scale-95"
                        >
                            <span className={`w-2 h-2 rounded-full ${getRecordDot(earningsFilter)}`} />
                            <span>{getRecordLabel(earningsFilter)}</span>
                            <ChevronDown size={14} className={`text-green-700 transition-transform duration-200 ${showRecordDropdown ? 'rotate-180' : ''}`} />
                        </button>

                        <AnimatePresence>
                            {showRecordDropdown && (
                                <>
                                    {/* Invisible backdrop to close when clicking outside */}
                                    <div
                                        className="fixed inset-0 z-20"
                                        onClick={() => setShowRecordDropdown(false)}
                                    />
                                    <motion.div
                                        initial={{ opacity: 0, y: 6, scale: 0.96 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 6, scale: 0.96 }}
                                        transition={{ duration: 0.15 }}
                                        className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl border border-gray-100 shadow-xl p-1.5 z-30 space-y-1"
                                    >
                                        <div className="px-3 py-1 text-[10px] font-black uppercase text-gray-400 tracking-wider">
                                            Select Timeframe Record
                                        </div>
                                        {(["today", "yesterday", "week", "month", "year", "all"] as const).map((filter) => {
                                            const isSelected = earningsFilter === filter
                                            return (
                                                <button
                                                    key={filter}
                                                    type="button"
                                                    onClick={() => {
                                                        setEarningsFilter(filter)
                                                        setShowRecordDropdown(false)
                                                    }}
                                                    className={`w-full px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-between transition cursor-pointer ${
                                                        isSelected
                                                            ? "bg-green-50 text-green-900 font-extrabold border border-green-200"
                                                            : "text-gray-700 hover:bg-gray-50"
                                                    }`}
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <span className={`w-2 h-2 rounded-full ${getRecordDot(filter)}`} />
                                                        <span>{getRecordLabel(filter)}</span>
                                                    </div>
                                                    {isSelected && (
                                                        <CheckCircle2 size={14} className="text-green-600" />
                                                    )}
                                                </button>
                                            )
                                        })}
                                    </motion.div>
                                </>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                <div className="bg-green-50/60 p-4 rounded-2xl flex justify-between items-center text-xs font-bold text-green-900 border border-green-200">
                    <span>Showing {filteredHistory.length} completed trips</span>
                    <span className="text-base font-black text-green-700">Total Payout: ₹{filteredEarnings}</span>
                </div>

                {filteredHistory.length > 0 ? (
                    <div className="divide-y divide-gray-100">
                        {filteredHistory.map((item: IDeliveryOrder, index: number) => {
                            const customerName = item.address?.fullName || item.user?.name || "Customer"
                            const customerUserId = item.user?._id || "Registered User"
                            const customerMobile = item.address?.mobile || item.user?.mobile || "N/A"
                            const dropCity = item.address?.city || "Local City"
                            const fullAddr = item.address?.fullAddress || ""
                            const deliveredTime = new Date(item.deliveredAt || item.updatedAt || item.createdAt).toLocaleString()

                            return (
                                <div key={item._id || index} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="font-extrabold text-gray-800 text-sm">
                                                Order #{item._id?.slice(-6).toUpperCase() || "ORDER"}
                                            </span>
                                            <span className="text-[10px] font-mono bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md border border-blue-200">
                                                Cust ID: {String(customerUserId).slice(-6).toUpperCase()}
                                            </span>
                                            <span className="text-[10px] font-bold bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                                                ✅ Delivered
                                            </span>
                                        </div>

                                        <p className="text-gray-700 font-semibold flex items-center gap-1.5">
                                            <User size={13} className="text-gray-400" />
                                            Delivered to: <span className="font-bold text-gray-900">{customerName}</span> ({customerMobile})
                                        </p>

                                        <p className="text-gray-500 flex items-start gap-1 text-[11px]">
                                            <MapPin size={12} className="text-red-500 shrink-0 mt-0.5" />
                                            {fullAddr ? `${fullAddr}, ${dropCity}` : dropCity}
                                        </p>

                                        <p className="text-[11px] text-gray-400 flex items-center gap-1">
                                            <Calendar size={11} /> {deliveredTime}
                                        </p>

                                        {/* Customer Rating for this trip */}
                                        {(item as any).deliveryRating?.rating && (
                                            <div className="bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-xl flex items-center gap-1.5 text-xs inline-flex mt-1">
                                                <span className="text-amber-500 font-bold">
                                                    {'★'.repeat((item as any).deliveryRating.rating)}
                                                </span>
                                                <span className="font-extrabold text-amber-900 text-[11px]">
                                                    ({(item as any).deliveryRating.rating}/5)
                                                </span>
                                                {(item as any).deliveryRating.feedback && (
                                                    <span className="text-gray-600 text-[11px] italic">
                                                        "{((item as any).deliveryRating.feedback)}"
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    <div className="text-left sm:text-right bg-green-50/80 sm:bg-transparent p-2.5 sm:p-0 rounded-xl flex sm:flex-col justify-between sm:justify-center items-center sm:items-end">
                                        <span className="font-black text-green-700 text-base">+₹{item.deliveryFee || 40}</span>
                                        <p className="text-[10px] text-gray-500 font-bold">Delivery Fee Earned</p>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                ) : (
                    <p className="text-xs text-gray-400 text-center py-6">No delivered trips found for this period.</p>
                )}
            </div>

            {/* 🛡️ 4-DIGIT DELIVERY OTP CONFIRMATION MODAL */}
            <AnimatePresence>
                {confirmModalOrder && (
                    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl space-y-5 relative text-center"
                        >
                            <button
                                onClick={() => setConfirmModalOrder(null)}
                                className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 p-1"
                            >
                                <X size={20} />
                            </button>

                            <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center text-green-600 mx-auto">
                                <Lock size={28} />
                            </div>

                            <div>
                                <h3 className="text-xl font-black text-gray-800">Enter Customer OTP</h3>
                                <p className="text-xs text-gray-500 mt-1">
                                    Order #{confirmModalOrder._id.slice(-6).toUpperCase()} • {confirmModalOrder.address?.fullName || "Customer"}
                                </p>
                            </div>

                            {/* Payment Collection Warning */}
                            <div className={`p-3.5 rounded-2xl text-xs font-bold ${
                                confirmModalOrder.paymentMethod === 'cod' && !confirmModalOrder.isPaid
                                    ? "bg-red-50 text-red-800 border border-red-200"
                                    : "bg-emerald-50 text-emerald-800 border border-emerald-200"
                            }`}>
                                {confirmModalOrder.paymentMethod === 'cod' && !confirmModalOrder.isPaid ? (
                                    <p>💵 Collect <b>₹{confirmModalOrder.totalAmount} Cash</b> before entering OTP!</p>
                                ) : (
                                    <p>✅ Pre-Paid Online. Do not collect cash!</p>
                                )}
                            </div>

                            {/* 4-Digit OTP Input Box */}
                            <div className="space-y-2">
                                <label className="block text-xs font-black uppercase text-gray-700">
                                    Customer's 4-Digit Delivery OTP
                                </label>
                                <input
                                    type="text"
                                    maxLength={4}
                                    placeholder="• • • •"
                                    value={enteredOtp}
                                    onChange={(e) => setEnteredOtp(e.target.value.replace(/\D/g, ''))}
                                    className="w-48 mx-auto py-3 text-center text-2xl font-black tracking-widest bg-gray-50 border-2 border-green-500 rounded-2xl focus:ring-4 focus:ring-green-100 outline-none"
                                    autoFocus
                                />
                                <p className="text-[11px] text-gray-400">Ask the customer for the 4-digit code shown on their Snapcart screen.</p>
                            </div>

                            {/* Action Buttons: Confirm vs Cancel */}
                            <div className="grid grid-cols-2 gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setConfirmModalOrder(null)}
                                    className="py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-xs transition cursor-pointer"
                                >
                                    ❌ Cancel (Go Back)
                                </button>

                                <button
                                    type="button"
                                    onClick={executeCompleteDelivery}
                                    disabled={loadingAction || enteredOtp.length !== 4}
                                    className="py-3 px-4 bg-green-600 hover:bg-green-700 text-white font-extrabold rounded-xl text-xs shadow-lg transition cursor-pointer disabled:bg-gray-300"
                                >
                                    {loadingAction ? "Verifying..." : "✅ Verify OTP & Deliver"}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* 📲 DOORSTEP UPI QR MODAL */}
            <AnimatePresence>
                {doorstepQrOrder && (
                    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl space-y-4 relative text-center"
                        >
                            <button
                                onClick={() => setDoorstepQrOrder(null)}
                                className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 p-1"
                            >
                                <X size={20} />
                            </button>

                            <h3 className="text-xl font-black text-gray-800">Scan & Pay ₹{doorstepQrOrder.totalAmount}</h3>
                            <p className="text-xs text-gray-500">Customer can scan with Paytm, GPay, PhonePe, or Cred</p>

                            <div className="w-48 h-48 mx-auto bg-white p-2 rounded-2xl border-2 border-green-500 shadow-md flex items-center justify-center">
                                <img
                                    src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=upi://pay?pa=store@paytm%26pn=SnapcartMart%26am=${doorstepQrOrder.totalAmount}`}
                                    alt="Doorstep QR"
                                    className="w-full h-full object-contain p-1"
                                />
                            </div>

                            <p className="text-xs font-bold text-gray-700 bg-gray-50 py-1.5 px-3 rounded-xl border inline-block">
                                Amount: ₹{doorstepQrOrder.totalAmount}
                            </p>

                            <button
                                onClick={() => {
                                    setDoorstepQrOrder(null)
                                    setConfirmModalOrder(doorstepQrOrder)
                                }}
                                className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-extrabold rounded-2xl shadow transition text-xs cursor-pointer"
                            >
                                Customer Paid Online ➔ Proceed to Enter OTP
                            </button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* 🔔 Doorstep Alert Modal for Delivery Boy */}
            <AnimatePresence>
                {doorstepModalOrder && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 border border-gray-100 text-left relative"
                        >
                            <div className="flex items-center justify-between border-b pb-3">
                                <div className="flex items-center gap-2">
                                    <Bell className="text-red-500 animate-bounce" size={20} />
                                    <h3 className="font-black text-gray-800 text-base">
                                        Send Doorstep Arrival Alert
                                    </h3>
                                </div>
                                <button
                                    onClick={() => setDoorstepModalOrder(null)}
                                    className="text-gray-400 hover:text-gray-600 p-1 cursor-pointer font-bold"
                                >
                                    ✕
                                </button>
                            </div>

                            <p className="text-xs text-gray-600">
                                This will instantly ring the customer's doorbell notification chime and display an alert popup on their screen to receive their order.
                            </p>

                            {/* Quick Message Choices */}
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase text-gray-400">Choose or edit alert message:</label>
                                {[
                                    "🔔 I am outside your doorstep! Please come and receive your groceries.",
                                    "🚪 Ringing your doorbell! Please come and collect your order.",
                                    "🚗 Arrived outside your building / main gate, please come down."
                                ].map((msg, idx) => (
                                    <button
                                        key={idx}
                                        type="button"
                                        onClick={() => setDoorstepMessage(msg)}
                                        className={`w-full text-left p-2.5 rounded-xl border text-xs transition cursor-pointer ${
                                            doorstepMessage === msg ? 'bg-blue-50 border-blue-400 text-blue-900 font-bold' : 'bg-gray-50 border-gray-200 text-gray-700'
                                        }`}
                                    >
                                        {msg}
                                    </button>
                                ))}
                            </div>

                            <textarea
                                rows={2}
                                value={doorstepMessage}
                                onChange={(e) => setDoorstepMessage(e.target.value)}
                                className="w-full p-2.5 rounded-xl border border-gray-200 text-xs outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Custom alert message..."
                            />

                            <div className="grid grid-cols-2 gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setDoorstepModalOrder(null)}
                                    className="py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold text-xs transition cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={async () => {
                                        const ordId = doorstepModalOrder._id
                                        setDoorstepModalOrder(null)
                                        await updateTripStage(ordId, "arrived_customer", doorstepMessage)
                                    }}
                                    className="py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-black text-xs shadow-md transition cursor-pointer flex items-center justify-center gap-1.5"
                                >
                                    <Bell size={14} /> Send Alert 🔔
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* In-App Live Chat Modal with Customer */}
            {chatOrder && (
                <ChatModal
                    isOpen={!!chatOrder}
                    onClose={() => setChatOrder(null)}
                    roomId={`order_${chatOrder._id}`}
                    title={`Chat with ${chatOrder.address?.fullName || chatOrder.user?.name || 'Customer'}`}
                    subtitle={`Order #${chatOrder._id.slice(-6).toUpperCase()} • Delivery Coordination`}
                    partnerRole="user"
                    partnerName={chatOrder.address?.fullName || chatOrder.user?.name || 'Customer'}
                    partnerPhone={chatOrder.address?.mobile || chatOrder.user?.mobile}
                    orderId={chatOrder._id}
                    currentUser={{ _id: user?._id || user?.id, name: user?.name, role: 'deliveryBoy' }}
                    deliveryOtp={chatOrder.deliveryOtp}
                />
            )}
        </div>
    )
}