'use client'

import React, { useState, useEffect } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'
import { motion, AnimatePresence } from 'motion/react'
import { Bell, Bike, Calendar, CheckCircle2, Clock, CreditCard, DollarSign, MapPin, MessageSquare, Navigation, Package, Phone, Radio, ShieldAlert, ShieldCheck, Store, Trash2, Truck, User, XCircle } from 'lucide-react'
import { getSocket } from '@/lib/socket'
import ChatModal from './ChatModal'

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

// Gentle pleasant arrival chime via Web Audio API
function playArrivalChime() {
    try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
        if (!AudioCtx) return
        const ctx = new AudioCtx()
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.type = "sine"
        osc.frequency.setValueAtTime(587.33, ctx.currentTime) // D5
        osc.frequency.setValueAtTime(880, ctx.currentTime + 0.15) // A5
        gain.gain.setValueAtTime(0.3, ctx.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6)
        osc.start()
        osc.stop(ctx.currentTime + 0.6)
    } catch (e) {
        // audio context blocked or unsupported
    }
}

function formatDate(dateInput: any): string {
    if (!dateInput) return ""
    const d = new Date(dateInput)
    if (isNaN(d.getTime())) return ""
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    return `${String(d.getDate()).padStart(2, '0')} ${months[d.getMonth()]} ${d.getFullYear()}`
}

function formatTime(dateInput: any): string {
    if (!dateInput) return ""
    const d = new Date(dateInput)
    if (isNaN(d.getTime())) return ""
    let hours = d.getHours()
    const minutes = String(d.getMinutes()).padStart(2, '0')
    const ampm = hours >= 12 ? 'PM' : 'AM'
    hours = hours % 12
    hours = hours ? hours : 12
    return `${String(hours).padStart(2, '0')}:${minutes} ${ampm}`
}

export default function AdminOrderCard({ 
    order, 
    deliveryBoys = [], 
    onUpdate 
}: { 
    order: any, 
    deliveryBoys?: any[], 
    onUpdate: () => void 
}) {
    const [status, setStatus] = useState(order.status || "pending")
    const [isPaid, setIsPaid] = useState(order.isPaid || false)
    const [assignedDeliveryBoy, setAssignedDeliveryBoy] = useState(order.assignedDeliveryBoy?._id || "")
    const [riderArrivedAtMart, setRiderArrivedAtMart] = useState(Boolean(order.riderArrivedAtMart || order.status === "arrived_at_mart"))
    const [handoverConfirmed, setHandoverConfirmed] = useState(Boolean(order.handoverConfirmed || order.status === "out of delivery"))
    const [loading, setLoading] = useState(false)

    const [deliveryFee, setDeliveryFee] = useState<number>(order.deliveryFee !== undefined && order.deliveryFee !== null ? Number(order.deliveryFee) : 40)
    const [showRiderAtMartModal, setShowRiderAtMartModal] = useState(false)
    const [riderArrivalInfo, setRiderArrivalInfo] = useState<any>(null)
    const [savingFee, setSavingFee] = useState(false)
    const [chatOpen, setChatOpen] = useState(false)

    // Formatted Dates
    const placedDate = formatDate(order.createdAt)
    const placedTime = formatTime(order.createdAt)

    const deliveredRawDate = order.deliveredAt || (status === 'delivered' ? order.updatedAt : null)
    const deliveredDate = deliveredRawDate ? formatDate(deliveredRawDate) : null
    const deliveredTime = deliveredRawDate ? formatTime(deliveredRawDate) : null

    // Store / Order reference point
    const orderLat = order.address?.latitude || 25.4730
    const orderLng = order.address?.longitude || 81.8630

    // Calculate distance for each delivery boy and sort closest first
    const deliveryBoysWithDistance = deliveryBoys.map((boy: any) => {
        let dist = 999
        if (boy.location?.coordinates && boy.location.coordinates.length === 2) {
            const [boyLng, boyLat] = boy.location.coordinates
            if (boyLat !== 0 && boyLng !== 0) {
                dist = getDistanceKm([orderLat, orderLng], [boyLat, boyLng])
            }
        }
        return { ...boy, distanceKm: dist }
    }).sort((a, b) => a.distanceKm - b.distanceKm)

    const closestBoy = deliveryBoysWithDistance.find(b => b.isOnline && b.distanceKm < 900)

    // Listen for live socket arrival event
    useEffect(() => {
        const socket = getSocket()
        if (!socket) return

        const handleArrival = (data: any) => {
            if (String(data?.orderId) === String(order._id)) {
                setRiderArrivedAtMart(true)
                setStatus("arrived_at_mart")
                setRiderArrivalInfo(data)
                setShowRiderAtMartModal(true)
                playArrivalChime()
                toast.success(`🔔 Rider ${data?.riderName || 'Partner'} has arrived at the Central Mart counter!`, {
                    duration: 8000,
                    style: { background: '#fffbeb', border: '2px solid #f59e0b', color: '#92400e', fontWeight: '700' }
                })
            }
        }

        socket.on("rider-arrived-at-mart", handleArrival)
        return () => {
            socket.off("rider-arrived-at-mart", handleArrival)
        }
    }, [order._id])

    // Listen for new incoming orders
    useEffect(() => {
        const socket = getSocket()
        if (!socket) return

        const handleNewOrder = (data: any) => {
            toast('🛒 New Order! #' + (data?.orderNumber || '') + ' from ' + (data?.customerName || 'Customer') + ' — ₹' + (data?.totalAmount || ''), {
                icon: '🛒',
                duration: 6000,
                style: { background: '#ecfdf5', border: '2px solid #10b981', color: '#065f46', fontWeight: '700' }
            })
            // Play notification sound
            try {
                const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
                if (AudioCtx) {
                    const ctx = new AudioCtx()
                    const osc = ctx.createOscillator()
                    const gain = ctx.createGain()
                    osc.connect(gain)
                    gain.connect(ctx.destination)
                    osc.type = 'sine'
                    osc.frequency.setValueAtTime(523.25, ctx.currentTime)
                    osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1)
                    osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.2)
                    gain.gain.setValueAtTime(0.3, ctx.currentTime)
                    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5)
                    osc.start()
                    osc.stop(ctx.currentTime + 0.5)
                }
            } catch (e) {}
            onUpdate()
        }

        socket.on('new-order', handleNewOrder)
        return () => { socket.off('new-order', handleNewOrder) }
    }, [onUpdate])

    // Assign Delivery Partner (moves order to "assigned")
    const handleAssignPartner = async (partnerId?: string) => {
        setLoading(true)
        const targetPartner = partnerId !== undefined ? partnerId : assignedDeliveryBoy
        try {
            await axios.post('/api/admin/update-order-status', {
                orderId: order._id,
                status: "assigned",
                assignedDeliveryBoy: targetPartner || null,
                deliveryFee: Number(deliveryFee)
            })
            setStatus("assigned")
            if (targetPartner) {
                toast.success(`🛵 Order assigned with ₹${deliveryFee} payout! Partner heading to Mart.`)
            } else {
                toast.success(`📢 Broadcast sent with ₹${deliveryFee} payout to all delivery partners!`)
            }
            onUpdate()
        } catch (e) {
            console.log(e)
            toast.error('Failed to assign partner')
        } finally {
            setLoading(false)
        }
    }

    // Save customized delivery fee directly
    const handleUpdateDeliveryFee = async (feeToSave: number) => {
        setSavingFee(true)
        try {
            await axios.post('/api/admin/update-order-status', {
                orderId: order._id,
                deliveryFee: Number(feeToSave)
            })
            setDeliveryFee(feeToSave)
            toast.success(`💰 Rider delivery fee payout updated to ₹${feeToSave}`)
            onUpdate()
        } catch (e) {
            toast.error('Failed to update delivery fee')
        } finally {
            setSavingFee(false)
        }
    }

    // 📦 Admin Confirms Packet Handover to Rider & Dispatches Order
    const handleConfirmHandover = async () => {
        setLoading(true)
        try {
            await axios.post('/api/admin/update-order-status', {
                orderId: order._id,
                action: 'admin_confirm_handover'
            })
            setStatus("out of delivery")
            setHandoverConfirmed(true)
            toast.success('📦 Handover confirmed! Order dispatched.')
            onUpdate()
        } catch (e) {
            console.log(e)
            toast.error('Failed to confirm handover')
        } finally {
            setLoading(false)
        }
    }

    const handleUpdateStatus = async (newStatus: string) => {
        setLoading(true)
        try {
            await axios.post('/api/admin/update-order-status', {
                orderId: order._id,
                status: newStatus,
                assignedDeliveryBoy: assignedDeliveryBoy || order.assignedDeliveryBoy?._id || undefined,
                isPaid: newStatus === "delivered" ? true : isPaid
            })
            setStatus(newStatus)
            if (newStatus === "delivered") setIsPaid(true)
            toast.success(`✅ Status updated: ${newStatus}`)
            onUpdate()
        } catch (e) {
            console.log(e)
            toast.error('Failed to update status')
        } finally {
            setLoading(false)
        }
    }

    const handleCancelOrder = async () => {
        if (!confirm("Are you sure you want to Cancel this order?")) return
        setLoading(true)
        try {
            await axios.post('/api/admin/update-order-status', {
                orderId: order._id,
                status: 'cancelled'
            })
            setStatus('cancelled')
            toast.success("Order marked as Cancelled.")
            onUpdate()
        } catch (e) {
            console.log(e)
        } finally {
            setLoading(false)
        }
    }

    const isRiderAtMart = riderArrivedAtMart || status === "arrived_at_mart"
    const isDispatched = handoverConfirmed || status === "out of delivery"

    return (
        <div suppressHydrationWarning className={`bg-white rounded-3xl p-6 border shadow-md space-y-4 transition ${
            isRiderAtMart && !isDispatched ? "border-amber-400 ring-2 ring-amber-300" : "border-gray-100"
        }`}>
            {/* 1. Header: Order ID, Placed Timestamp & Dynamic Status Badge */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3">
                <div>
                    <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-extrabold text-gray-800 text-base">
                            Order #{order._id.slice(-6).toUpperCase()}
                        </h3>

                        {/* Status Badge with Live Dot */}
                        <span className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full inline-flex items-center gap-1.5 ${
                            status === 'delivered' ? 'bg-green-100 text-green-800' :
                            isDispatched ? 'bg-blue-100 text-blue-800' :
                            isRiderAtMart ? 'bg-amber-100 text-amber-900 border border-amber-300' :
                            status === 'assigned' ? 'bg-purple-100 text-purple-800' :
                            status === 'cancelled' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-700'
                        }`}>
                            {isRiderAtMart && !isDispatched && (
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                                </span>
                            )}
                            {isDispatched && (
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                                </span>
                            )}
                            {status === 'delivered' ? '✓ Delivered' :
                             isDispatched ? (order.assignedDeliveryBoy ? `🛵 Out for Delivery (${order.assignedDeliveryBoy.name})` : "🚀 Out for Delivery") :
                             isRiderAtMart ? `🔔 Rider At Mart Counter (${order.assignedDeliveryBoy?.name || "Rider"})` :
                             status === 'assigned' ? `🛵 Assigned • Heading to Mart (${order.assignedDeliveryBoy?.name || "Partner"})` :
                             status === 'cancelled' ? '✕ Cancelled' : '🏪 Packing at Mart'}
                        </span>

                        {/* Delivery Payout Badge */}
                        <span className="text-[10px] font-black bg-emerald-50 text-emerald-900 border border-emerald-300 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                            💰 Rider Payout: ₹{deliveryFee}
                        </span>

                        {order.deliveryOtp && status !== 'delivered' && (
                            <span className="text-[10px] font-black bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded-full">
                                OTP: {order.deliveryOtp}
                            </span>
                        )}
                    </div>

                    <p className="text-xs text-gray-500 mt-1 flex items-center gap-1.5 font-medium">
                        <Clock size={12} className="text-gray-400" />
                        <span>Placed: <b>{placedDate}</b> at <b>{placedTime}</b></span>
                    </p>
                </div>

                <div className="text-right">
                    <span className="text-xs text-gray-400 font-bold block">Total Amount</span>
                    <span className="text-xl font-black text-green-700">₹{order.totalAmount}</span>
                </div>
            </div>

            {/* 🔔 1.5 LIVE RIDER ARRIVAL ALERT BANNER (When rider reached Mart counter) */}
            {isRiderAtMart && !isDispatched && (
                <div className="p-4 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white rounded-2xl shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-pulse">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shrink-0">
                            <Bike size={22} className="animate-bounce" />
                        </div>
                        <div>
                            <span className="text-[10px] font-black uppercase tracking-wider bg-white/30 px-2 py-0.5 rounded-full inline-block">
                                🔔 RIDER IS AT MART COUNTER!
                            </span>
                            <h4 className="text-sm font-extrabold mt-0.5">
                                {order.assignedDeliveryBoy?.name || "Delivery Partner"} has arrived at the store!
                            </h4>
                            <p className="text-xs opacity-90">
                                Please hand over the packed grocery bag to the partner, then click Confirm Handover below.
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={handleConfirmHandover}
                        disabled={loading}
                        className="px-4 py-2.5 bg-white hover:bg-gray-50 text-amber-900 font-extrabold text-xs rounded-xl shadow-md transition cursor-pointer shrink-0 self-end sm:self-auto flex items-center gap-1.5"
                    >
                        <Package size={14} className="text-amber-800" />
                        <span>📦 Confirm Handover & Dispatch ✓</span>
                    </button>
                </div>
            )}

            {/* 2. Delivered Timestamp & Rating Record */}
            {status === "delivered" && deliveredDate && (
                <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-2xl space-y-1.5 text-xs text-emerald-900 font-bold">
                    <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                            <CheckCircle2 size={16} className="text-emerald-600" />
                            Delivered on: <b>{deliveredDate}</b> at <b>{deliveredTime}</b>
                        </span>
                        {order.assignedDeliveryBoy?.name && (
                            <span className="text-[11px] text-emerald-800 font-semibold">
                                By: {order.assignedDeliveryBoy.name}
                            </span>
                        )}
                    </div>

                    {order.deliveryRating?.rating && (
                        <div className="border-t border-emerald-200/60 pt-1 flex items-center justify-between text-[11px] flex-wrap gap-1">
                            <span className="text-amber-600 font-extrabold flex items-center gap-1">
                                Customer Rating: {'★'.repeat(order.deliveryRating.rating)} ({order.deliveryRating.rating}/5)
                            </span>
                            {order.deliveryRating.feedback && (
                                <span className="text-gray-600 italic">
                                    "{order.deliveryRating.feedback}"
                                </span>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* 3. Detailed Mode of Payment Badge */}
            <div className={`p-3.5 rounded-2xl border flex items-center justify-between text-xs font-bold ${
                isPaid ? 'bg-green-50 text-green-900 border-green-200' : 'bg-amber-50 text-amber-900 border-amber-200'
            }`}>
                <div className="flex items-center gap-2">
                    <CreditCard size={15} className={isPaid ? "text-green-600" : "text-amber-600"} />
                    <span>
                        Mode of Payment: <b>{order.paymentMethod === 'cod' ? 'Cash on Delivery (COD)' : 'Online Payment (Razorpay)'}</b>
                    </span>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-md font-black ${
                    isPaid ? 'bg-green-200 text-green-900' : 'bg-amber-200 text-amber-900'
                }`}>
                    {isPaid ? "✅ PAID" : "💵 COD PENDING"}
                </span>
            </div>

            {/* 4. Customer Details with User ID */}
            <div className="bg-gray-50 p-4 rounded-2xl space-y-1 text-xs text-gray-600">
                <div className="flex items-center justify-between">
                    <p className="font-bold text-gray-800 flex items-center gap-1.5 text-sm">
                        <User size={15} className="text-green-600" /> {order.address?.fullName || order.user?.name || "Customer"}
                    </p>
                    <span className="text-[10px] font-mono bg-white px-2 py-0.5 rounded-md border text-gray-500">
                        UID: {String(order.user?._id || order.user || "").slice(-6).toUpperCase()}
                    </span>
                </div>

                <p className="flex items-center gap-1.5 font-medium">
                    <Phone size={14} className="text-gray-400" /> {order.address?.mobile || order.user?.mobile || "No Mobile"}
                </p>
                <p className="flex items-start gap-1.5 text-[11px]">
                    <MapPin size={14} className="text-red-500 shrink-0 mt-0.5" />
                    {order.address?.fullAddress}, {order.address?.city} - {order.address?.pincode}
                </p>

                <div className="pt-2 flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => setChatOpen(true)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition cursor-pointer"
                    >
                        <MessageSquare size={13} /> Chat with Customer
                    </button>
                    {order.address?.mobile && (
                        <a
                            href={`tel:${order.address.mobile}`}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-gray-100 text-gray-700 rounded-xl text-xs font-bold border border-gray-200 shadow-sm transition"
                        >
                            <Phone size={13} /> Call Customer
                        </a>
                    )}
                </div>
            </div>

            {/* 5. Items Breakdown */}
            <div className="space-y-1 text-xs text-gray-600 border-t pt-2">
                <p className="font-bold text-gray-700 mb-1">Ordered Items ({order.items?.length}):</p>
                {order.items?.map((item: any, i: number) => (
                    <div key={i} className="flex justify-between items-center py-1 border-b border-gray-50 last:border-0">
                        <div className="flex items-center gap-2 flex-wrap">
                            <span>{item.name} ({item.unit}) × {item.quantity}</span>
                            {item.rating?.stars && (
                                <span className="bg-amber-50 text-amber-900 border border-amber-200 px-2 py-0.5 rounded-md text-[10px] font-bold flex items-center gap-1">
                                    ⭐ {item.rating.stars}/5
                                    {item.rating.review && <span className="text-gray-500 font-normal italic truncate max-w-[150px]"> — "{item.rating.review}"</span>}
                                </span>
                            )}
                        </div>
                        <span className="font-bold">₹{Number(item.price) * item.quantity}</span>
                    </div>
                ))}
            </div>

            {/* 6. Admin Actions (Only shown for active/pending orders) */}
            {status !== 'delivered' && status !== 'cancelled' ? (
                <div className="pt-2 border-t space-y-3">
                    {/* 💰 Customized Delivery Fee (Payout for Delivery Boy) */}
                    <div className="bg-emerald-50/70 border border-emerald-200 p-3 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                        <div>
                            <label className="text-xs font-black text-emerald-950 flex items-center gap-1.5">
                                <DollarSign size={14} className="text-emerald-700" />
                                <span>Customize Delivery Fee (Rider Payout):</span>
                            </label>
                            <p className="text-[11px] text-emerald-700 font-medium">
                                Delivery boy sees this exact payout amount for delivering this order.
                            </p>
                        </div>

                        <div className="flex items-center gap-1.5 flex-wrap">
                            {[30, 40, 50, 70].map((fee) => (
                                <button
                                    key={fee}
                                    type="button"
                                    onClick={() => handleUpdateDeliveryFee(fee)}
                                    disabled={savingFee}
                                    className={`px-2.5 py-1 text-xs font-black rounded-lg transition cursor-pointer ${
                                        deliveryFee === fee
                                            ? "bg-emerald-600 text-white shadow-xs"
                                            : "bg-white text-emerald-800 border border-emerald-300 hover:bg-emerald-100"
                                    }`}
                                >
                                    ₹{fee}
                                </button>
                            ))}
                            
                            <div className="flex items-center bg-white border border-emerald-300 rounded-lg px-2 py-0.5 shadow-2xs">
                                <span className="text-xs font-bold text-gray-500">₹</span>
                                <input
                                    type="number"
                                    value={deliveryFee}
                                    onChange={(e) => setDeliveryFee(Math.max(0, Number(e.target.value)))}
                                    className="w-14 text-xs font-black text-emerald-900 outline-none px-1"
                                    min="0"
                                />
                                <button
                                    type="button"
                                    onClick={() => handleUpdateDeliveryFee(deliveryFee)}
                                    disabled={savingFee}
                                    className="text-[10px] font-black uppercase text-emerald-700 hover:text-emerald-900 ml-1 cursor-pointer"
                                >
                                    {savingFee ? "..." : "Save"}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Select Nearby Delivery Partner or Broadcast */}
                    {!isDispatched && (
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="grow max-w-md">
                                <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1 flex items-center justify-between">
                                    <span>Nearby Delivery Partners (Sorted by Distance):</span>
                                    {closestBoy && (
                                        <span className="text-emerald-700 text-[10px] font-extrabold">
                                            📍 Closest: {closestBoy.name} ({closestBoy.distanceKm} km away)
                                        </span>
                                    )}
                                </label>
                                <select
                                    value={assignedDeliveryBoy}
                                    onChange={(e) => setAssignedDeliveryBoy(e.target.value)}
                                    className="w-full text-xs font-semibold px-3 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-green-500 outline-none bg-white cursor-pointer"
                                >
                                    <option value="">📢 Broadcast to ALL Delivery Partners</option>
                                    {deliveryBoysWithDistance.map((boy: any) => (
                                        <option key={boy._id} value={boy._id}>
                                            {boy.isOnline ? "🟢 [ONLINE]" : "🔴 [OFFLINE]"} {boy.name} (⭐ {boy.rating?.average ? Number(boy.rating.average).toFixed(1) : "5.0"})
                                            {boy.distanceKm < 900 ? ` — 📍 ${boy.distanceKm} km away` : " — 📍 No GPS yet"}
                                            {boy.mobile ? ` (${boy.mobile})` : ""}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Quick Assign Closest Partner Button */}
                            {status === "pending" && closestBoy && !assignedDeliveryBoy && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setAssignedDeliveryBoy(closestBoy._id)
                                        handleAssignPartner(closestBoy._id)
                                    }}
                                    disabled={loading}
                                    className="px-3.5 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl font-bold text-xs transition flex items-center gap-1.5 cursor-pointer shrink-0 self-end sm:self-auto"
                                >
                                    <Navigation size={13} className="text-emerald-700" />
                                    Send to Closest ({closestBoy.name} - {closestBoy.distanceKm} km)
                                </button>
                            )}
                        </div>
                    )}

                    {/* Status Action Buttons */}
                    <div className="flex flex-wrap gap-2 pt-1">
                        {/* 1. Assign / Broadcast (if pending) */}
                        {status === "pending" && (
                            <button
                                type="button"
                                onClick={() => handleAssignPartner()}
                                disabled={loading}
                                className={`px-4 py-2.5 text-white font-extrabold text-xs rounded-xl shadow transition cursor-pointer disabled:bg-gray-300 flex items-center gap-1.5 ${
                                    assignedDeliveryBoy ? "bg-blue-600 hover:bg-blue-700" : "bg-purple-600 hover:bg-purple-700"
                                }`}
                            >
                                {assignedDeliveryBoy ? "Assign Partner 🛵" : "Broadcast to All 📢"}
                            </button>
                        )}

                        {/* 2. Confirm Handover & Dispatch (if assigned or rider at mart) */}
                        {!isDispatched && (
                            <button
                                type="button"
                                onClick={handleConfirmHandover}
                                disabled={loading}
                                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow transition cursor-pointer flex items-center gap-1.5"
                            >
                                <Package size={14} />
                                <span>📦 Confirm Handover & Dispatch Order ✓</span>
                            </button>
                        )}

                        {/* Master Override Deliver */}
                        <button
                            type="button"
                            onClick={() => handleUpdateStatus("delivered")}
                            disabled={loading}
                            className="px-3.5 py-2.5 bg-green-600 hover:bg-green-700 text-white font-bold text-xs rounded-xl shadow transition cursor-pointer disabled:bg-gray-300"
                        >
                            Mark Delivered ✓
                        </button>

                        {/* Cancel Order Button */}
                        <button
                            type="button"
                            onClick={handleCancelOrder}
                            disabled={loading}
                            className="px-3 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 font-bold text-xs rounded-xl transition cursor-pointer"
                            title="Cancel Order"
                        >
                            <Trash2 size={14} />
                        </button>
                    </div>
                </div>
            ) : status === 'delivered' ? (
                <div className="pt-2 border-t flex items-center justify-between text-xs text-gray-500">
                    <span className="flex items-center gap-1.5 text-emerald-700 font-extrabold">
                        <CheckCircle2 size={15} className="text-emerald-600" />
                        Order Fulfilled & Successfully Delivered
                    </span>
                    <span className="text-[11px] text-gray-400 font-medium">
                        No further action required
                    </span>
                </div>
            ) : (
                <div className="pt-2 border-t text-xs text-red-600 font-bold flex items-center gap-1.5">
                    <XCircle size={15} /> Order Cancelled
                </div>
            )}

            {/* 🔔 POPUP MODAL: RIDER REACHED CENTRAL MART */}
            <AnimatePresence>
                {showRiderAtMartModal && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 border-2 border-amber-400 text-left relative"
                        >
                            <div className="flex items-center justify-between border-b pb-3">
                                <div className="flex items-center gap-2">
                                    <span className="relative flex h-3.5 w-3.5">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-amber-500"></span>
                                    </span>
                                    <h3 className="font-black text-gray-900 text-base">
                                        Rider Arrived at Central Mart Counter!
                                    </h3>
                                </div>
                                <button
                                    onClick={() => setShowRiderAtMartModal(false)}
                                    className="text-gray-400 hover:text-gray-600 p-1 cursor-pointer"
                                >
                                    <XCircle size={20} />
                                </button>
                            </div>

                            <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 text-xs text-amber-900 space-y-1.5">
                                <p className="font-extrabold text-sm text-amber-950 flex items-center gap-1.5">
                                    <Bike size={18} className="text-amber-700" />
                                    {order.assignedDeliveryBoy?.name || riderArrivalInfo?.riderName || "Delivery Partner"} is here!
                                </p>
                                <p className="text-gray-600">
                                    Order #{order._id.slice(-6).toUpperCase()} • Total: <b>₹{order.totalAmount}</b> • Payout: <b>₹{deliveryFee}</b>
                                </p>
                                <p className="text-amber-800 font-semibold pt-1">
                                    📍 Rider is waiting at your store/counter. Please hand over the packed grocery bag to the partner and click Confirm Handover below.
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-3 pt-1">
                                <button
                                    type="button"
                                    onClick={() => setShowRiderAtMartModal(false)}
                                    className="py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl transition cursor-pointer"
                                >
                                    Dismiss
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowRiderAtMartModal(false)
                                        handleConfirmHandover()
                                    }}
                                    disabled={loading}
                                    className="py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow transition cursor-pointer flex items-center justify-center gap-1.5"
                                >
                                    <Package size={14} /> Confirm Handover
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Store Support <-> Customer Chat */}
            {chatOpen && (
                <ChatModal
                    isOpen={chatOpen}
                    onClose={() => setChatOpen(false)}
                    roomId={`store_${order._id}`}
                    title={`Customer: ${order.address?.fullName || order.user?.name || "Customer"}`}
                    subtitle={`Order #${order._id.slice(-6).toUpperCase()} • Store Support`}
                    partnerRole="user"
                    partnerName={order.address?.fullName || order.user?.name || "Customer"}
                    partnerPhone={order.address?.mobile || order.user?.mobile}
                    orderId={order._id}
                    currentUser={{
                        _id: "admin",
                        name: "Snapcart Store Support",
                        role: "admin"
                    }}
                />
            )}
        </div>
    )
}