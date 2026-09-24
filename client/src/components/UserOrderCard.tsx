'use client'

import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { motion, AnimatePresence } from 'motion/react'
import { ArrowRight, Bell, BellRing, Calendar, CheckCircle2, Clock, CreditCard, DollarSign, Download, FileText, KeyRound, MapPin, MessageSquare, Package, Phone, Printer, RefreshCw, ShieldCheck, Star, Store, Truck, User, X, XCircle } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { getSocket } from '@/lib/socket'
import { useDispatch } from 'react-redux'
import { addToCart } from '@/redux/cartSlice'
import ChatModal from './ChatModal'

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

export default function UserOrderCard({ order }: { order: any }) {
    const router = useRouter()
    const dispatch = useDispatch()
    const [orderItems, setOrderItems] = useState<any[]>(order.items || [])
    const [showInvoice, setShowInvoice] = useState<boolean>(false)
    const [reordering, setReordering] = useState<boolean>(false)

    // Chat with Rider / Store Modal State
    const [chatConfig, setChatConfig] = useState<any>({ isOpen: false })

    // Dynamic order tracking state
    const [orderStatus, setOrderStatus] = useState<string>(order.status || 'pending')
    const [assignedRider, setAssignedRider] = useState<any>(order.assignedDeliveryBoy || null)
    const [deliveryOtp, setDeliveryOtp] = useState<string>(order.deliveryOtp || "")
    const [isAtDoorstep, setIsAtDoorstep] = useState<boolean>(false)

    // Delivery Boy Rating State
    const [rating, setRating] = useState<number>(order.deliveryRating?.rating || 0)
    const [hoverRating, setHoverRating] = useState<number>(0)
    const [feedback, setFeedback] = useState<string>(order.deliveryRating?.feedback || "")
    const [submittedRating, setSubmittedRating] = useState<any>(order.deliveryRating || null)
    const [submittingRating, setSubmittingRating] = useState<boolean>(false)

    // Product Rating Modal State
    const [reviewModalItem, setReviewModalItem] = useState<{ item: any, index: number } | null>(null)
    const [productStars, setProductStars] = useState<number>(5)
    const [hoverProductStars, setHoverProductStars] = useState<number>(0)
    const [productReviewText, setProductReviewText] = useState<string>("")
    const [submittingProductReview, setSubmittingProductReview] = useState<boolean>(false)
    const [showDoorstepModal, setShowDoorstepModal] = useState<boolean>(false)
    const [doorstepData, setDoorstepData] = useState<any>(null)

    // Pleasant 2-tone doorbell chime via Web Audio API
    const playDoorbellChime = () => {
        try {
            const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
            if (!AudioCtx) return
            const ctx = new AudioCtx()
            const osc = ctx.createOscillator()
            const gain = ctx.createGain()
            osc.connect(gain)
            gain.connect(ctx.destination)
            osc.type = "sine"
            osc.frequency.setValueAtTime(659.25, ctx.currentTime) // E5
            osc.frequency.setValueAtTime(523.25, ctx.currentTime + 0.2) // C5
            gain.gain.setValueAtTime(0.3, ctx.currentTime)
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8)
            osc.start()
            osc.stop(ctx.currentTime + 0.8)
        } catch (e) {}
    }

    // Real-time socket notifications
    useEffect(() => {
        const socket = getSocket()
        if (!socket) return

        const handleDispatched = (data: any) => {
            if (String(data?.orderId) === String(order._id)) {
                setOrderStatus('out of delivery')
                if (data?.riderName) {
                    setAssignedRider((prev: any) => ({ ...(prev || {}), name: data.riderName }))
                }
                if (data?.deliveryOtp) {
                    setDeliveryOtp(data.deliveryOtp)
                }
                toast.success('🚀 Your grocery order is out for delivery! ' + (data?.riderName || 'Partner') + ' is on the way!', {
                    duration: 6000,
                    style: { background: '#eff6ff', border: '2px solid #3b82f6', color: '#1e40af', fontWeight: '700' }
                })
            }
        }

        const handleAtDoorstep = (data: any) => {
            if (String(data?.orderId) === String(order._id)) {
                setDoorstepData(data)
                setIsAtDoorstep(true)
                setShowDoorstepModal(true)
                if (data?.riderName) {
                    setAssignedRider((prev: any) => ({ ...(prev || {}), name: data.riderName }))
                }
                playDoorbellChime()
                toast('🔔 Delivery partner has reached your doorstep! Please go and receive your groceries.', {
                    icon: '🔔',
                    duration: 10000,
                    style: { background: '#fefce8', border: '2px solid #eab308', color: '#854d0e', fontWeight: '700' }
                })
            }
        }

        const handleDelivered = (data: any) => {
            if (String(data?.orderId) === String(order._id)) {
                setOrderStatus('delivered')
                setIsAtDoorstep(false)
                setShowDoorstepModal(false)
                toast.success('✅ Order delivered successfully!', { duration: 5000 })
            }
        }

        const handleAssigned = (data: any) => {
            if (String(data?.orderId) === String(order._id)) {
                setOrderStatus(data?.status || 'assigned')
                if (data?.riderName) {
                    setAssignedRider((prev: any) => ({ ...(prev || {}), name: data.riderName }))
                }
            }
        }

        const handleArrivedAtMart = (data: any) => {
            if (String(data?.orderId) === String(order._id)) {
                setOrderStatus('arrived_at_mart')
                if (data?.riderName) {
                    setAssignedRider((prev: any) => ({ ...(prev || {}), name: data.riderName }))
                }
            }
        }

        socket.on('order-dispatched', handleDispatched)
        socket.on('rider-at-doorstep', handleAtDoorstep)
        socket.on('order-delivered', handleDelivered)
        socket.on('order-assigned', handleAssigned)
        socket.on('rider-arrived-at-mart', handleArrivedAtMart)
        return () => {
            socket.off('order-dispatched', handleDispatched)
            socket.off('rider-at-doorstep', handleAtDoorstep)
            socket.off('order-delivered', handleDelivered)
            socket.off('order-assigned', handleAssigned)
            socket.off('rider-arrived-at-mart', handleArrivedAtMart)
        }
    }, [order._id])

    const isPaid = order.isPaid || order.paymentMethod === 'online'
    const isDelivered = orderStatus === "delivered"
    const isCancelled = orderStatus === "cancelled"
    const isOutForDelivery = !isDelivered && !isCancelled && orderStatus === "out of delivery"
    const isArrivedAtMart = !isDelivered && !isCancelled && Boolean(order.riderArrivedAtMart || orderStatus === "arrived_at_mart")
    const isAssigned = !isDelivered && !isCancelled && orderStatus === "assigned"
    const partnerId = assignedRider?._id || assignedRider
    const partnerName = assignedRider?.name || order.assignedDeliveryBoy?.name || "Delivery Partner"
    const partnerMobile = assignedRider?.mobile || order.assignedDeliveryBoy?.mobile || ""

    // Formatted Dates & Timestamps
    const placedDate = formatDate(order.createdAt)
    const placedTime = formatTime(order.createdAt)

    const deliveredRawDate = order.deliveredAt || (isDelivered ? order.updatedAt : null)
    const deliveredDate = deliveredRawDate ? formatDate(deliveredRawDate) : null
    const deliveredTime = deliveredRawDate ? formatTime(deliveredRawDate) : null

    // Submit Delivery Partner Rating
    const handleSubmitRating = async () => {
        if (!rating || rating < 1 || rating > 5) {
            toast.error("Please select 1 to 5 stars.")
            return
        }

        setSubmittingRating(true)
        try {
            const res = await axios.post('/api/user/rate-delivery', {
                orderId: order._id,
                rating,
                feedback
            })
            if (res.status === 200) {
                setSubmittedRating({
                    rating,
                    feedback: feedback.trim(),
                    ratedAt: new Date()
                })
                toast.success("⭐ Thank you for rating your delivery partner!")
            }
        } catch (e: any) {
            toast.error(e?.response?.data?.message || "Failed to submit rating.")
        } finally {
            setSubmittingRating(false)
        }
    }

    // Open Product Review Modal
    const openProductReviewModal = (item: any, index: number) => {
        setReviewModalItem({ item, index })
        setProductStars(item.rating?.stars || 5)
        setProductReviewText(item.rating?.review || "")
    }

    // Submit Product Review
    const handleSubmitProductReview = async () => {
        if (!reviewModalItem) return
        if (!productStars || productStars < 1 || productStars > 5) {
            toast.error("Please select 1 to 5 stars for the product.")
            return
        }

        setSubmittingProductReview(true)
        try {
            const res = await axios.post('/api/user/rate-product', {
                orderId: order._id,
                itemIndex: reviewModalItem.index,
                stars: productStars,
                review: productReviewText
            })

            if (res.status === 200) {
                const updatedRating = {
                    stars: productStars,
                    review: productReviewText.trim(),
                    ratedAt: new Date()
                }

                setOrderItems(prev => prev.map((it, idx) => {
                    if (idx === reviewModalItem.index) {
                        return { ...it, rating: updatedRating }
                    }
                    return it
                }))

                toast.success("⭐ Thank you! Your product review has been submitted.")
                setReviewModalItem(null)
            }
        } catch (e: any) {
            toast.error(e?.response?.data?.message || "Failed to submit product review.")
        } finally {
            setSubmittingProductReview(false)
        }
    }

    // 1-Click Reorder
    const handleReorder = () => {
        setReordering(true)
        try {
            orderItems.forEach((item: any) => {
                dispatch(addToCart({
                    _id: item.grocery?._id || item.grocery || item._id || Math.random().toString(),
                    name: item.name,
                    category: item.category || 'General',
                    price: String(item.price),
                    unit: item.unit || 'unit',
                    quantity: Number(item.quantity) || 1,
                    image: item.image || ''
                }))
            })

            toast.success("🛒 Items added to your cart! Redirecting...")
            router.push('/user/cart')
        } catch (e) {
            toast.error("Could not re-order items.")
        } finally {
            setReordering(false)
        }
    }

    return (
        <div
            className="bg-white rounded-3xl p-6 sm:p-7 border border-gray-100 shadow-md space-y-5 relative transition"
            suppressHydrationWarning
        >
            {/* 1. Header: Order ID, Notification Bell, Placed Timestamp & Total */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4">
                <div>
                    <div className="flex items-center gap-2.5 flex-wrap">
                        <h3 className="font-black text-gray-800 text-lg">
                            Order #{order._id.slice(-6).toUpperCase()}
                        </h3>

                        {/* Notification Status Icon & Badge */}
                        <div className="flex items-center gap-1.5">
                            {isDelivered ? (
                                <span className="text-[11px] font-black uppercase px-3 py-1 rounded-full inline-flex items-center gap-1.5 bg-green-100 text-green-800 border border-green-200">
                                    <CheckCircle2 size={13} className="text-green-600" />
                                    <span>✅ Delivered</span>
                                </span>
                            ) : isCancelled ? (
                                <span className="text-[11px] font-black uppercase px-3 py-1 rounded-full inline-flex items-center gap-1.5 bg-red-100 text-red-800 border border-red-200">
                                    <XCircle size={13} className="text-red-600" />
                                    <span>❌ Cancelled</span>
                                </span>
                            ) : isAtDoorstep ? (
                                <span className="text-[11px] font-black uppercase px-3 py-1 rounded-full inline-flex items-center gap-1.5 bg-red-100 text-red-700 border border-red-300 animate-pulse">
                                    <BellRing size={13} className="text-red-600 animate-bounce" />
                                    <span>🔔 At Your Doorstep</span>
                                </span>
                            ) : isOutForDelivery ? (
                                <span className="text-[11px] font-black uppercase px-3 py-1 rounded-full inline-flex items-center gap-1.5 bg-blue-100 text-blue-800 border border-blue-300">
                                    <Bell size={13} className="text-blue-600 animate-pulse" />
                                    <span>🛵 Out for Delivery</span>
                                </span>
                            ) : isArrivedAtMart ? (
                                <span className="text-[11px] font-black uppercase px-3 py-1 rounded-full inline-flex items-center gap-1.5 bg-amber-100 text-amber-900 border border-amber-300">
                                    <Store size={13} className="text-amber-700" />
                                    <span>📍 Rider at Mart</span>
                                </span>
                            ) : isAssigned ? (
                                <span className="text-[11px] font-black uppercase px-3 py-1 rounded-full inline-flex items-center gap-1.5 bg-purple-100 text-purple-800 border border-purple-200">
                                    <Truck size={13} className="text-purple-600" />
                                    <span>🛵 Partner Assigned</span>
                                </span>
                            ) : (
                                <span className="text-[11px] font-black uppercase px-3 py-1 rounded-full inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200">
                                    <Package size={13} className="text-emerald-600" />
                                    <span>🏪 Packing at Mart</span>
                                </span>
                            )}
                        </div>
                    </div>

                    <p className="text-xs text-gray-500 mt-1 flex items-center gap-1.5 font-medium">
                        <Clock size={13} className="text-gray-400" />
                        <span>Placed on <b>{placedDate}</b> at <b>{placedTime}</b></span>
                    </p>
                </div>

                <div className="text-left sm:text-right">
                    <span className="text-xs text-gray-400 font-bold block">Total Amount</span>
                    <span className="text-2xl font-black text-green-700">₹{order.totalAmount}</span>
                </div>
            </div>

            {/* 🔔 REAL-TIME DELIVERY NOTIFICATION BAR */}
            {isAtDoorstep ? (
                <div className="p-4 rounded-2xl bg-gradient-to-r from-red-500 via-rose-500 to-amber-500 text-white shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-pulse border-2 border-white/30">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                            <BellRing size={22} className="animate-bounce text-yellow-200" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="bg-yellow-400 text-black text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider">
                                    Doorstep Alert
                                </span>
                                <p className="font-black text-sm text-white">Delivery Partner is at your doorstep!</p>
                            </div>
                            <p className="text-xs text-white/95 mt-0.5">
                                Please share 4-digit Delivery OTP: <b className="font-mono bg-black/30 px-2.5 py-0.5 rounded-lg text-yellow-300 text-sm tracking-widest">{deliveryOtp || order.deliveryOtp || "Ready"}</b> with {partnerName}.
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                        <button
                            type="button"
                            onClick={() => {
                                const otp = deliveryOtp || order.deliveryOtp || "";
                                if (otp) {
                                    navigator.clipboard?.writeText(otp);
                                    toast.success("Delivery OTP copied!");
                                }
                            }}
                            className="text-xs bg-white text-rose-900 hover:bg-yellow-50 font-extrabold px-3.5 py-2 rounded-xl cursor-pointer shadow transition flex items-center gap-1.5"
                        >
                            <KeyRound size={13} /> Copy OTP
                        </button>
                    </div>
                </div>
            ) : isOutForDelivery ? (
                <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-600 text-white shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border border-blue-400">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                            <Truck size={22} className="text-white animate-pulse" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="bg-emerald-400 text-emerald-950 text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-950 animate-ping"></span>
                                    Dispatched & On The Way
                                </span>
                                <p className="font-black text-sm text-white">Your groceries have left the store!</p>
                            </div>
                            <p className="text-xs text-blue-100 mt-0.5">
                                <b>{partnerName}</b> is bringing your order fresh to your address. Keep OTP ready upon arrival.
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                        {(deliveryOtp || order.deliveryOtp) && (
                            <div className="bg-white/15 px-3 py-1.5 rounded-xl border border-white/20 text-center">
                                <span className="text-[9px] uppercase font-bold text-blue-200 block">Delivery OTP</span>
                                <span className="font-mono font-black text-yellow-300 text-sm tracking-widest">{deliveryOtp || order.deliveryOtp}</span>
                            </div>
                        )}
                        <Link
                            href={`/user/track-order/${order._id}`}
                            className="text-xs bg-white text-blue-900 hover:bg-blue-50 font-black px-3.5 py-2 rounded-xl transition shadow-xs flex items-center gap-1"
                        >
                            <span>Track Order</span>
                            <ArrowRight size={13} />
                        </Link>
                    </div>
                </div>
            ) : isArrivedAtMart ? (
                <div className="p-3.5 rounded-2xl bg-amber-50/90 border border-amber-300 text-amber-950 flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700 shrink-0">
                            <Store size={18} />
                        </div>
                        <div>
                            <p className="font-extrabold text-amber-950">
                                📍 Delivery Partner at Store Counter
                            </p>
                            <p className="text-[11px] text-amber-800">
                                <b>{partnerName}</b> has arrived at the Mart. Store staff is handing over your freshly packed groceries.
                            </p>
                        </div>
                    </div>
                    <span className="text-[10px] font-bold bg-amber-200/60 text-amber-900 px-2.5 py-1 rounded-lg border border-amber-300 shrink-0 hidden sm:inline-block">
                        Bag Handover in Progress
                    </span>
                </div>
            ) : isAssigned ? (
                <div className="p-3.5 rounded-2xl bg-purple-50/90 border border-purple-200 text-purple-950 flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-purple-100 flex items-center justify-center text-purple-700 shrink-0">
                            <Truck size={18} />
                        </div>
                        <div>
                            <p className="font-extrabold text-purple-950">
                                🛵 Delivery Partner Assigned
                            </p>
                            <p className="text-[11px] text-purple-800">
                                <b>{partnerName}</b> is heading to Central Mart to pick up your packed groceries.
                            </p>
                        </div>
                    </div>
                    <span className="text-[10px] font-bold bg-white text-purple-800 px-2.5 py-1 rounded-lg border border-purple-200 shrink-0 hidden sm:inline-block">
                        Heading to Store
                    </span>
                </div>
            ) : !isDelivered && !isCancelled ? (
                <div className="p-3.5 rounded-2xl bg-emerald-50/80 border border-emerald-200 text-emerald-950 flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700 shrink-0">
                            <Package size={18} />
                        </div>
                        <div>
                            <p className="font-extrabold text-emerald-950">
                                🏪 Packing Fresh Groceries at Mart
                            </p>
                            <p className="text-[11px] text-emerald-700">
                                Mart team is hand-picking and carefully packing your grocery items. You will be notified once picked up.
                            </p>
                        </div>
                    </div>
                    <span className="text-[10px] font-bold bg-white text-emerald-800 px-2.5 py-1 rounded-lg border border-emerald-200 shrink-0 hidden sm:inline-block">
                        ⚡ Quick Commerce
                    </span>
                </div>
            ) : null}

            {/* 2. Delivered Timestamp Card (When order was received!) */}
            {isDelivered && deliveredDate && (
                <div className="bg-gradient-to-r from-emerald-50 via-green-50 to-emerald-50 border border-emerald-200 p-3.5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2 text-emerald-800 font-bold">
                        <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
                        <div>
                            <p className="font-extrabold text-sm text-emerald-950">Delivered Successfully!</p>
                            <p className="text-emerald-700 font-medium">
                                Received on <b>{deliveredDate}</b> at <b>{deliveredTime}</b>
                            </p>
                        </div>
                    </div>

                    {partnerName && partnerName !== "Delivery Partner" && (
                        <div className="text-right sm:text-right text-[11px] text-emerald-800 bg-white/70 px-3 py-1 rounded-xl border border-emerald-100">
                            🛵 Handed over by: <b>{partnerName}</b>
                        </div>
                    )}
                </div>
            )}

            {/* ⭐ 3. Delivery Partner Rating Widget (Customer Feedback for Rider) */}
            {isDelivered && (
                <div>
                    {submittedRating?.rating ? (
                        <div className="bg-amber-50/70 border border-amber-200 p-3.5 rounded-2xl flex items-center justify-between text-xs">
                            <div className="space-y-0.5">
                                <p className="text-[10px] font-black uppercase text-amber-900 tracking-wider">
                                    Your Rating for {partnerName}
                                </p>
                                <div className="flex items-center gap-1">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <span key={star} className={star <= submittedRating.rating ? "text-amber-500 text-base" : "text-gray-300 text-base"}>
                                            ★
                                        </span>
                                    ))}
                                    <span className="font-black text-amber-950 text-xs ml-1">({submittedRating.rating}/5)</span>
                                </div>
                                {submittedRating.feedback && (
                                    <p className="text-gray-600 text-[11px] italic mt-0.5">"{submittedRating.feedback}"</p>
                                )}
                            </div>

                            <span className="text-[10px] font-extrabold bg-amber-200 text-amber-900 px-3 py-1 rounded-full shrink-0">
                                ✅ Feedback Saved
                            </span>
                        </div>
                    ) : (
                        <div className="bg-gradient-to-r from-amber-50/70 via-yellow-50/40 to-amber-50/70 border border-amber-200 p-4 rounded-2xl space-y-2.5 text-xs">
                            <div className="flex items-center justify-between">
                                <p className="font-extrabold text-gray-800">
                                    ⭐ How was your delivery with <b className="text-amber-900">{partnerName}</b>?
                                </p>
                                <span className="text-[10px] text-amber-800 font-bold bg-amber-100 px-2 py-0.5 rounded-md">
                                    Tap stars to rate
                                </span>
                            </div>

                            {/* 5 Interactive Stars */}
                            <div className="flex items-center gap-3">
                                <div className="flex items-center gap-1">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <button
                                            key={star}
                                            type="button"
                                            onClick={() => setRating(star)}
                                            onMouseEnter={() => setHoverRating(star)}
                                            onMouseLeave={() => setHoverRating(0)}
                                            className="text-2xl transition cursor-pointer hover:scale-125 active:scale-95 focus:outline-none"
                                            title={`${star} Star${star > 1 ? 's' : ''}`}
                                        >
                                            <span className={(hoverRating || rating) >= star ? "text-amber-400" : "text-gray-300"}>
                                                ★
                                            </span>
                                        </button>
                                    ))}
                                </div>

                                <span className="font-extrabold text-amber-900 text-xs">
                                    {rating === 5 ? "🤩 Super Fast & Polite!" :
                                     rating === 4 ? "😊 Great Service!" :
                                     rating === 3 ? "🙂 Good" :
                                     rating === 2 ? "😕 Average" :
                                     rating === 1 ? "😞 Needs Improvement" : "Rate this delivery"}
                                </span>
                            </div>

                            {/* Optional Feedback Input + Submit */}
                            {rating > 0 && (
                                <div className="flex gap-2 pt-1">
                                    <input
                                        type="text"
                                        placeholder="Add a compliment or feedback for the driver (optional)..."
                                        value={feedback}
                                        onChange={(e) => setFeedback(e.target.value)}
                                        className="grow px-3.5 py-2 bg-white rounded-xl border border-amber-300 text-xs outline-none focus:ring-2 focus:ring-amber-400"
                                    />
                                    <button
                                        type="button"
                                        onClick={handleSubmitRating}
                                        disabled={submittingRating}
                                        className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs rounded-xl shadow transition cursor-pointer shrink-0 disabled:bg-gray-300"
                                    >
                                        {submittingRating ? "Saving..." : "Submit ⭐"}
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* 4. Detailed Mode of Payment & Assigned Partner */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {/* Mode of Payment */}
                <div className={`p-3.5 rounded-2xl border flex items-center justify-between ${
                    isPaid ? 'bg-green-50/80 text-green-900 border-green-200' : 'bg-amber-50/80 text-amber-900 border-amber-200'
                }`}>
                    <div className="space-y-0.5">
                        <p className="text-[10px] font-black uppercase text-gray-500 tracking-wider">Mode of Payment</p>
                        <p className="font-extrabold text-xs flex items-center gap-1.5">
                            <CreditCard size={14} className={isPaid ? "text-green-600" : "text-amber-600"} />
                            {order.paymentMethod === 'cod' ? 'Cash on Delivery (COD)' : 'Online Payment (Razorpay)'}
                        </p>
                    </div>

                    <div className="text-right">
                        <span className={`text-[10px] font-black px-2.5 py-1 rounded-lg inline-block ${
                            isPaid ? 'bg-green-200 text-green-900' : 'bg-amber-200 text-amber-900'
                        }`}>
                            {isPaid ? "✅ PAID" : "💵 PENDING"}
                        </span>
                    </div>
                </div>

                {/* Assigned Delivery Partner & Live Chat */}
                <div className="p-3.5 rounded-2xl border border-gray-200 bg-gray-50/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                    <div className="space-y-0.5">
                        <p className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Delivery Partner</p>
                        <p className="font-extrabold text-xs text-gray-800 flex items-center gap-1.5">
                            <Truck size={14} className="text-blue-600" />
                            {isOutForDelivery || isDelivered ? (partnerName || "Snapcart Rider") :
                             assignedRider?.name ? assignedRider.name : "Packing groceries at mart..."}
                        </p>
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap">
                        {/* Chat with Delivery Partner */}
                        {(assignedRider?.name || isOutForDelivery) && (
                            <button
                                type="button"
                                onClick={() => setChatConfig({
                                    isOpen: true,
                                    roomId: `order_${order._id}`,
                                    title: `Chat with ${partnerName || 'Delivery Partner'}`,
                                    subtitle: `Order #${order._id.slice(-6).toUpperCase()} • ${isOutForDelivery ? 'Out for Delivery' : 'Partner Assigned'}`,
                                    partnerRole: 'deliveryBoy',
                                    partnerName: partnerName || 'Delivery Partner',
                                    partnerPhone: partnerMobile,
                                    orderId: order._id,
                                    deliveryOtp: order.deliveryOtp
                                })}
                                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs flex items-center gap-1 transition cursor-pointer active:scale-95 shadow-xs"
                            >
                                <MessageSquare size={13} />
                                <span>Chat with Rider</span>
                            </button>
                        )}

                        {/* Chat with Shop Owner (Central Mart Admin) */}
                        <button
                            type="button"
                            onClick={() => setChatConfig({
                                isOpen: true,
                                roomId: `store_${order._id}`,
                                title: "Central Mart Store",
                                subtitle: `Order #${order._id.slice(-6).toUpperCase()} • Shop Owner & Support`,
                                partnerRole: 'admin',
                                partnerName: "Shop Owner (Central Mart)",
                                orderId: order._id
                            })}
                            className="px-3 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded-xl font-bold text-xs flex items-center gap-1 transition cursor-pointer active:scale-95 border border-amber-300"
                        >
                            <Store size={13} />
                            <span>Chat with Store</span>
                        </button>

                        {partnerMobile && (isOutForDelivery || isAtDoorstep) && (
                            <a
                                href={`tel:${partnerMobile}`}
                                className="px-2.5 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-xl font-bold text-xs flex items-center gap-1 transition"
                            >
                                <Phone size={13} /> Call
                            </a>
                        )}
                    </div>
                </div>
            </div>

            {/* 6. 🔑 4-Digit Delivery OTP Banner */}
            {isOutForDelivery && order.deliveryOtp && (
                <div className="bg-gradient-to-r from-amber-500/10 via-amber-400/20 to-green-500/10 border-2 border-dashed border-amber-400 p-4 rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-3 shadow-inner">
                    <div className="flex items-center gap-3 text-left">
                        <div className="w-11 h-11 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-700 shrink-0">
                            <KeyRound size={22} className="animate-bounce" />
                        </div>
                        <div>
                            <p className="text-xs font-black uppercase tracking-wider text-amber-900">Your 4-Digit Delivery OTP</p>
                            <p className="text-xs text-gray-600">Share this code with your delivery partner upon delivery.</p>
                        </div>
                    </div>

                    <div className="text-3xl font-black font-mono tracking-widest bg-white px-5 py-2 rounded-2xl shadow-md border border-amber-300 text-green-700">
                        {order.deliveryOtp}
                    </div>
                </div>
            )}

            {/* 7. Delivery Address */}
            <div className="bg-gray-50 p-4 rounded-2xl space-y-1 text-xs text-gray-600">
                <p className="font-bold text-gray-800 flex items-center gap-1.5 text-sm">
                    <MapPin size={15} className="text-red-500" /> Delivery Address
                </p>
                <p className="text-gray-700 font-semibold">{order.address?.fullName} ({order.address?.mobile})</p>
                <p>{order.address?.fullAddress}, {order.address?.city} - {order.address?.pincode}</p>
            </div>

            {/* 8. Ordered Items List with Rate & Review for each Grocery */}
            <div className="space-y-2 border-t pt-3">
                <div className="flex justify-between items-center">
                    <p className="text-xs font-black uppercase text-gray-400">Items Ordered ({orderItems?.length})</p>
                    {isDelivered && (
                        <span className="text-[10px] text-amber-800 font-semibold bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                            ⭐ Rate each product below
                        </span>
                    )}
                </div>

                <div className="space-y-2">
                    {orderItems?.map((item: any, i: number) => (
                        <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between py-2 border-b border-gray-50 last:border-0 gap-2">
                            <div className="flex items-center gap-2.5">
                                {item.image ? (
                                    <div className="w-10 h-10 rounded-xl overflow-hidden relative border bg-gray-50 shrink-0">
                                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                    </div>
                                ) : (
                                    <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center text-green-600 shrink-0">
                                        <Package size={18} />
                                    </div>
                                )}
                                <div>
                                    <p className="font-bold text-gray-800 text-xs">{item.name}</p>
                                    <p className="text-[11px] text-gray-400">{item.unit || "unit"} × {item.quantity}</p>
                                </div>
                            </div>

                            <div className="flex items-center justify-between sm:justify-end gap-3 self-end sm:self-auto w-full sm:w-auto">
                                <span className="font-extrabold text-gray-800 text-xs">₹{Number(item.price) * item.quantity}</span>

                                {/* Product Rating / Review Button if delivered */}
                                {isDelivered && (
                                    <div>
                                        {item.rating?.stars ? (
                                            <div className="flex items-center gap-1.5 text-[11px] bg-amber-50 text-amber-900 px-2.5 py-1 rounded-lg border border-amber-200" title={item.rating.review || ""}>
                                                <span className="text-amber-500 font-black">{'★'.repeat(item.rating.stars)}</span>
                                                <span className="font-extrabold">({item.rating.stars}/5)</span>
                                                {item.rating.review && (
                                                    <span className="text-gray-600 italic max-w-[130px] truncate hidden md:inline">
                                                        "{item.rating.review}"
                                                    </span>
                                                )}
                                            </div>
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={() => openProductReviewModal(item, i)}
                                                className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-lg text-[10px] font-extrabold transition flex items-center gap-1 cursor-pointer active:scale-95 shadow-xs"
                                            >
                                                <Star size={11} className="text-amber-500 fill-amber-500" />
                                                <span>Rate Product</span>
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* 9. Price Breakdown Summary */}
            <div className="bg-gray-50/80 p-3.5 rounded-2xl border border-gray-100 space-y-1.5 text-xs text-gray-600">
                <div className="flex justify-between">
                    <span>Items Subtotal:</span>
                    <span>₹{order.totalAmount}</span>
                </div>
                <div className="flex justify-between text-green-700 font-semibold">
                    <span>Express Delivery Fee:</span>
                    <span>FREE</span>
                </div>
                <div className="flex justify-between text-gray-400 text-[11px]">
                    <span>Taxes & Packaging:</span>
                    <span>Included</span>
                </div>
                <div className="border-t pt-1.5 flex justify-between font-black text-gray-800 text-sm">
                    <span>Total Paid / Payable:</span>
                    <span className="text-green-700">₹{order.totalAmount}</span>
                </div>
            </div>

            {/* 10. Action Buttons: View Invoice & Reorder */}
            <div className="pt-2 border-t flex flex-wrap items-center justify-between gap-2">
                <button
                    type="button"
                    onClick={() => setShowInvoice(true)}
                    className="px-3.5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold text-xs transition flex items-center gap-1.5 cursor-pointer active:scale-95"
                >
                    <FileText size={14} className="text-gray-500" />
                    <span>View / Print Receipt</span>
                </button>

                <button
                    type="button"
                    onClick={handleReorder}
                    disabled={reordering}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl font-extrabold text-xs shadow-sm transition flex items-center gap-1.5 cursor-pointer active:scale-95"
                >
                    <RefreshCw size={13} className={reordering ? "animate-spin" : ""} />
                    <span>Buy Again (Re-Order)</span>
                </button>
            </div>

            {/* 🌟 11. MODAL: RATE & REVIEW SPECIFIC GROCERY PRODUCT */}
            <AnimatePresence>
                {reviewModalItem && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 relative text-left border border-gray-100"
                        >
                            <button
                                onClick={() => setReviewModalItem(null)}
                                className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 p-1 cursor-pointer"
                            >
                                <X size={20} />
                            </button>

                            {/* Product Info Header */}
                            <div className="flex items-center gap-3 border-b pb-3">
                                {reviewModalItem.item.image ? (
                                    <div className="w-12 h-12 rounded-2xl overflow-hidden border bg-gray-50 shrink-0">
                                        <img src={reviewModalItem.item.image} alt={reviewModalItem.item.name} className="w-full h-full object-cover" />
                                    </div>
                                ) : (
                                    <div className="w-12 h-12 rounded-2xl bg-green-50 flex items-center justify-center text-green-600 shrink-0">
                                        <Package size={22} />
                                    </div>
                                )}
                                <div>
                                    <h3 className="font-black text-gray-800 text-base">{reviewModalItem.item.name}</h3>
                                    <p className="text-xs text-gray-400">
                                        {reviewModalItem.item.unit || "unit"} • ₹{reviewModalItem.item.price} each
                                    </p>
                                </div>
                            </div>

                            {/* 5 Stars Picker */}
                            <div className="space-y-1.5 text-center py-2">
                                <label className="text-xs font-black uppercase text-gray-600 tracking-wider block">
                                    Your Rating for this Item
                                </label>
                                <div className="flex items-center justify-center gap-1.5">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <button
                                            key={star}
                                            type="button"
                                            onClick={() => setProductStars(star)}
                                            onMouseEnter={() => setHoverProductStars(star)}
                                            onMouseLeave={() => setHoverProductStars(0)}
                                            className="text-3xl transition cursor-pointer hover:scale-125 active:scale-95 focus:outline-none"
                                            title={`${star} Star${star > 1 ? 's' : ''}`}
                                        >
                                            <span className={(hoverProductStars || productStars) >= star ? "text-amber-400" : "text-gray-300"}>
                                                ★
                                            </span>
                                        </button>
                                    ))}
                                </div>
                                <p className="text-xs font-bold text-amber-900">
                                    {productStars === 5 ? "⭐⭐⭐⭐⭐ Outstanding Quality!" :
                                     productStars === 4 ? "⭐⭐⭐⭐ Great Product!" :
                                     productStars === 3 ? "⭐⭐⭐ Satisfactory / Average" :
                                     productStars === 2 ? "⭐⭐ Below Expectations" : "⭐ Poor Quality"}
                                </p>
                            </div>

                            {/* Review Comment Textarea */}
                            <div className="space-y-1.5 text-xs">
                                <label className="font-bold text-gray-700 block">
                                    Write a short review / feedback (Optional):
                                </label>
                                <textarea
                                    rows={3}
                                    placeholder="How was the freshness, taste, packaging, or quality of this item?"
                                    value={productReviewText}
                                    onChange={(e) => setProductReviewText(e.target.value)}
                                    className="w-full p-3 rounded-2xl border border-gray-300 text-xs outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-none bg-gray-50"
                                />
                            </div>

                            {/* Actions */}
                            <div className="grid grid-cols-2 gap-3 pt-1">
                                <button
                                    type="button"
                                    onClick={() => setReviewModalItem(null)}
                                    className="py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold text-xs transition cursor-pointer"
                                >
                                    Cancel
                                </button>

                                <button
                                    type="button"
                                    onClick={handleSubmitProductReview}
                                    disabled={submittingProductReview}
                                    className="py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl font-extrabold text-xs shadow-md transition cursor-pointer disabled:bg-gray-300"
                                >
                                    {submittingProductReview ? "Submitting..." : "Submit Review ⭐"}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* 📄 12. PRINTABLE INVOICE / RECEIPT MODAL */}
            <AnimatePresence>
                {showInvoice && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-5 relative text-left border border-gray-100"
                        >
                            <button
                                onClick={() => setShowInvoice(false)}
                                className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 p-1 cursor-pointer"
                            >
                                <X size={20} />
                            </button>

                            {/* Store Header */}
                            <div className="border-b pb-3 flex justify-between items-start">
                                <div>
                                    <h2 className="text-xl font-black text-green-700 tracking-tight">Snapcart Mart</h2>
                                    <p className="text-[11px] text-gray-400">10-Minute Instant Grocery Delivery</p>
                                    <p className="text-[11px] text-gray-500 mt-1">Central Mart, Prayagraj, UP</p>
                                </div>
                                <div className="text-right">
                                    <span className="text-[10px] font-bold uppercase bg-gray-100 px-2 py-0.5 rounded text-gray-600 block">
                                        TAX INVOICE
                                    </span>
                                    <p className="text-xs font-mono font-bold text-gray-800 mt-1">
                                        #{order._id.slice(-8).toUpperCase()}
                                    </p>
                                </div>
                            </div>

                            {/* Order & Delivery Info */}
                            <div className="grid grid-cols-2 gap-3 text-xs bg-gray-50 p-3 rounded-2xl">
                                <div>
                                    <p className="text-gray-400 text-[10px] font-bold uppercase">Billed To:</p>
                                    <p className="font-bold text-gray-800">{order.address?.fullName || "Customer"}</p>
                                    <p className="text-gray-600 text-[11px]">{order.address?.mobile}</p>
                                    <p className="text-gray-500 text-[11px] mt-0.5">{order.address?.city}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-gray-400 text-[10px] font-bold uppercase">Order Date:</p>
                                    <p className="font-semibold text-gray-800">{placedDate} {placedTime}</p>
                                    {deliveredDate && (
                                        <p className="text-green-700 font-bold text-[11px] mt-1">
                                            Delivered: {deliveredDate} {deliveredTime}
                                        </p>
                                    )}
                                    <p className="text-gray-600 text-[11px] mt-1">
                                        Payment: <b>{order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Online (Paid)'}</b>
                                    </p>
                                </div>
                            </div>

                            {/* Items Table */}
                            <div className="space-y-1.5 text-xs max-h-48 overflow-y-auto">
                                <div className="flex justify-between font-black text-gray-400 uppercase text-[10px] border-b pb-1">
                                    <span>Item</span>
                                    <span>Qty × Rate</span>
                                    <span>Total</span>
                                </div>
                                {orderItems?.map((item: any, i: number) => (
                                    <div key={i} className="flex justify-between py-1 border-b border-gray-50 last:border-0 text-xs">
                                        <span className="font-medium text-gray-800">{item.name}</span>
                                        <span className="text-gray-500">{item.quantity} × ₹{item.price}</span>
                                        <span className="font-bold text-gray-800">₹{Number(item.price) * item.quantity}</span>
                                    </div>
                                ))}
                            </div>

                            {/* Total Summary */}
                            <div className="border-t pt-2 space-y-1 text-xs text-gray-600">
                                <div className="flex justify-between">
                                    <span>Subtotal:</span>
                                    <span>₹{order.totalAmount}</span>
                                </div>
                                <div className="flex justify-between text-green-700">
                                    <span>Delivery Charges:</span>
                                    <span>FREE</span>
                                </div>
                                <div className="flex justify-between text-sm font-black text-gray-900 border-t pt-1">
                                    <span>Grand Total:</span>
                                    <span className="text-green-700">₹{order.totalAmount}</span>
                                </div>
                            </div>

                            {/* Print / Close Buttons */}
                            <div className="grid grid-cols-2 gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => window.print()}
                                    className="py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                                >
                                    <Printer size={15} /> Print Receipt
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setShowInvoice(false)}
                                    className="py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold text-xs transition cursor-pointer"
                                >
                                    Close
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* 🔔 CUSTOMER DOORSTEP ARRIVAL POPUP MODAL */}
            <AnimatePresence>
                {showDoorstepModal && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl space-y-4 border-2 border-red-500 text-left relative"
                        >
                            <div className="flex items-center justify-between border-b pb-3">
                                <div className="flex items-center gap-2">
                                    <span className="relative flex h-3.5 w-3.5">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-red-600"></span>
                                    </span>
                                    <h3 className="font-black text-gray-900 text-base">
                                        Rider Has Arrived at Your Door!
                                    </h3>
                                </div>
                                <button
                                    onClick={() => setShowDoorstepModal(false)}
                                    className="text-gray-400 hover:text-gray-600 p-1 cursor-pointer"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="p-4 bg-rose-50 rounded-2xl border border-rose-200 text-xs text-rose-950 space-y-2">
                                <p className="font-extrabold text-sm flex items-center gap-2">
                                    <Truck size={18} className="text-rose-600" />
                                    {doorstepData?.riderName || partnerName || "Delivery Partner"} is outside your door!
                                </p>
                                <p className="text-gray-600">
                                    Order #{order._id.slice(-6).toUpperCase()} • Total: ₹{order.totalAmount}
                                </p>
                            </div>

                            {/* Prominent OTP display */}
                            {order.deliveryOtp && (
                                <div className="bg-amber-50 border-2 border-dashed border-amber-400 p-3.5 rounded-2xl text-center space-y-1">
                                    <p className="text-[10px] font-black uppercase text-amber-900 tracking-wider">Share This OTP with Delivery Partner</p>
                                    <p className="text-3xl font-black font-mono tracking-widest text-emerald-700">{order.deliveryOtp}</p>
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-2 pt-1">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowDoorstepModal(false)
                                        setChatConfig({
                                            isOpen: true,
                                            roomId: `order_${order._id}`,
                                            title: `Chat with ${doorstepData?.riderName || partnerName || 'Delivery Partner'}`,
                                            subtitle: `Order #${order._id.slice(-6).toUpperCase()} • At Doorstep`,
                                            partnerRole: 'deliveryBoy',
                                            partnerName: doorstepData?.riderName || partnerName || 'Delivery Partner',
                                            partnerPhone: partnerMobile,
                                            orderId: order._id,
                                            deliveryOtp: order.deliveryOtp
                                        })
                                    }}
                                    className="py-3 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl shadow transition cursor-pointer flex items-center justify-center gap-1.5 active:scale-95"
                                >
                                    <MessageSquare size={14} /> Chat with Rider
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowDoorstepModal(false)}
                                    className="py-3 bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs rounded-xl shadow transition cursor-pointer active:scale-95"
                                >
                                    I am Receiving ✓
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Live Chat Modal */}
            {chatConfig.isOpen && (
                <ChatModal
                    isOpen={chatConfig.isOpen}
                    onClose={() => setChatConfig({ isOpen: false })}
                    roomId={chatConfig.roomId}
                    title={chatConfig.title}
                    subtitle={chatConfig.subtitle}
                    partnerRole={chatConfig.partnerRole}
                    partnerName={chatConfig.partnerName}
                    partnerPhone={chatConfig.partnerPhone}
                    orderId={chatConfig.orderId}
                    currentUser={{ _id: order.user?._id || order.user, name: order.address?.fullName || 'Customer', role: 'user' }}
                    deliveryOtp={chatConfig.deliveryOtp}
                />
            )}
        </div>
    )
}