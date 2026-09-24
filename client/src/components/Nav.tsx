'use client'
import { ArrowRight, Bell, BellRing, Boxes, CalendarDays, CheckCircle2, ClipboardCheck, Home, KeyRound, LogOut, Menu, MessageSquare, Package, PlusCircle, Search, ShoppingCart, Store, Trash2, Truck, User, Users, X } from 'lucide-react'
import Link from 'next/link'
import React, { FormEvent, useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { AnimatePresence, motion } from 'motion/react'
import { signOut } from 'next-auth/react'
import { createPortal } from 'react-dom'
import { useSelector } from 'react-redux'
import { RootState } from '@/redux/store'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import axios from 'axios'
import toast from 'react-hot-toast'
import { getSocket } from '@/lib/socket'
import BrandLogo from './BrandLogo'
import ChatModal from './ChatModal'

interface IUser {
    _id?: string
    name: string
    email: string
    password?: string
    mobile?: string
    role: "user" | "deliveryBoy" | "admin"
    image?: string
}

export default function Nav({ user }: { user: IUser }) {
    const [open, setOpen] = useState(false)
    const profileDropDown = useRef<HTMLDivElement>(null)
    const [notifOpen, setNotifOpen] = useState(false)
    const notifDropDown = useRef<HTMLDivElement>(null)
    const [searchBarOpen, setSearchBarOpen] = useState(false)
    const [menuOpen, setMenuOpen] = useState(false)
    const [pendingOrdersCount, setPendingOrdersCount] = useState(0)
    const [adminUnreadChats, setAdminUnreadChats] = useState(0)
    const [pendingApprovalsCount, setPendingApprovalsCount] = useState(0)
    const [customerUnreadChats, setCustomerUnreadChats] = useState(0)
    const [mounted, setMounted] = useState(false)

    // Chat Modal configuration
    const [chatModalConfig, setChatModalConfig] = useState<any>({ isOpen: false })
    const chatModalConfigRef = useRef<any>(chatModalConfig)
    useEffect(() => {
        chatModalConfigRef.current = chatModalConfig
    }, [chatModalConfig])

    // Customer Delivery Notifications (Strictly out of delivery & doorstep alerts)
    const [activeDeliveries, setActiveDeliveries] = useState<any[]>([])
    const [liveDoorstepAlert, setLiveDoorstepAlert] = useState<any>(null)
    const [liveDispatchedAlert, setLiveDispatchedAlert] = useState<any>(null)
    const [dismissedAlerts, setDismissedAlerts] = useState<string[]>([])
    const [clearedNotifKeys, setClearedNotifKeys] = useState<string[]>([])
    const [riderMessages, setRiderMessages] = useState<{ [orderId: string]: { text: string, time: string, senderName: string, unread: number } }>({})

    // Load cleared notification keys from localStorage
    useEffect(() => {
        try {
            const saved = localStorage.getItem('snapcart_cleared_notif_keys')
            if (saved) {
                setClearedNotifKeys(JSON.parse(saved))
            }
        } catch (e) {}
    }, [])

    // Dismiss a single notification
    const handleDismissNotification = (key: string) => {
        setClearedNotifKeys(prev => {
            const updated = Array.from(new Set([...prev, key]))
            try { localStorage.setItem('snapcart_cleared_notif_keys', JSON.stringify(updated)) } catch (e) {}
            return updated
        })
        toast.success("Notification cleared", { duration: 2000 })
    }

    // Clear all notifications
    const handleClearAllNotifications = () => {
        const keysToClear = [
            ...(liveDoorstepAlert?.orderId ? [`doorstep_${liveDoorstepAlert.orderId}`] : []),
            ...activeDeliveries.map((o: any) => `${o._id}_${o.status}`),
            ...activeDeliveries.map((o: any) => String(o._id))
        ]
        setClearedNotifKeys(prev => {
            const updated = Array.from(new Set([...prev, ...keysToClear]))
            try { localStorage.setItem('snapcart_cleared_notif_keys', JSON.stringify(updated)) } catch (e) {}
            return updated
        })
        setLiveDoorstepAlert(null)
        setLiveDispatchedAlert(null)
        setDismissedAlerts(prev => [...prev, 'out_for_delivery', 'doorstep'])
        toast.success("All notifications cleared!", { duration: 2500 })
    }

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

    // Pleasant dual-chime notification sound for customer messages
    const playChatNotificationChime = () => {
        try {
            const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
            if (!AudioCtx) return
            const ctx = new AudioCtx()

            // Note 1 (E5 - 659.25Hz)
            const osc1 = ctx.createOscillator()
            const gain1 = ctx.createGain()
            osc1.type = "sine"
            osc1.frequency.setValueAtTime(659.25, ctx.currentTime)
            gain1.gain.setValueAtTime(0.25, ctx.currentTime)
            gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35)
            osc1.connect(gain1)
            gain1.connect(ctx.destination)
            osc1.start(ctx.currentTime)
            osc1.stop(ctx.currentTime + 0.35)

            // Note 2 (A5 - 880Hz) - slight delay for a cheerful ding-ding
            const osc2 = ctx.createOscillator()
            const gain2 = ctx.createGain()
            osc2.type = "sine"
            osc2.frequency.setValueAtTime(880, ctx.currentTime + 0.12)
            gain2.gain.setValueAtTime(0.3, ctx.currentTime + 0.12)
            gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6)
            osc2.connect(gain2)
            gain2.connect(ctx.destination)
            osc2.start(ctx.currentTime + 0.12)
            osc2.stop(ctx.currentTime + 0.6)
        } catch (e) {}
    }

    // Open store chat for customer and clear notification badge
    const handleOpenCustomerStoreChat = () => {
        if (!user?._id) return
        const targetRoom = `store_user_${user._id}`
        setCustomerUnreadChats(0)
        axios.post('/api/chat/unread', { roomId: targetRoom, senderRole: 'admin' }).catch(() => {})
        setChatModalConfig({
            isOpen: true,
            roomId: targetRoom,
            title: "Central Mart Store",
            subtitle: "Chat with Shop Owner & Grocery Support",
            partnerRole: "admin",
            partnerName: "Shop Owner (Central Mart)",
            currentUser: { _id: user._id, name: user.name, role: user.role }
        })
    }

    const cartState = useSelector((state: RootState) => state.cart)
    const cartData = cartState?.cartData || []

    const searchParams = useSearchParams()
    const router = useRouter()
    const pathname = usePathname()
    const [search, setSearch] = useState(searchParams.get("q") || "")

    useEffect(() => { setMounted(true) }, [])

    useEffect(() => {
        setSearch(searchParams.get("q") || "")
    }, [searchParams])

    // Fetch active customer orders for notifications (ONLY out of delivery)
    const fetchActiveOrders = async () => {
        if (!user?._id && !user?.email) return
        try {
            const res = await axios.get('/api/user/my-orders')
            if (res.data && Array.isArray(res.data)) {
                const active = res.data.filter((o: any) =>
                    o.status === 'out of delivery'
                )
                setActiveDeliveries(active)

                // Join socket rooms for all active delivery orders
                const socket = getSocket()
                if (socket) {
                    res.data.filter((o: any) => o.status !== 'delivered' && o.status !== 'cancelled').forEach((ord: any) => {
                        socket.emit("join-room", `order_${ord._id}`)
                        socket.emit("join-room", String(ord._id))
                    })
                }

                // Check for any unread rider messages across active deliveries
                active.forEach(async (ord: any) => {
                    try {
                        const unreadRes = await axios.get(`/api/chat/unread?roomId=order_${ord._id}&senderRole=deliveryBoy`)
                        const count = unreadRes.data?.unreadCount || 0
                        if (count > 0) {
                            setRiderMessages(prev => ({
                                ...prev,
                                [ord._id]: {
                                    text: prev[ord._id]?.text || "New message from delivery partner",
                                    time: prev[ord._id]?.time || "",
                                    senderName: ord.assignedDeliveryBoy?.name || "Delivery Partner",
                                    unread: count
                                }
                            }))
                            // Un-dismiss if there are unread messages!
                            setClearedNotifKeys(prev => {
                                const updated = prev.filter(k => 
                                    k !== String(ord._id) && 
                                    !k.startsWith(`${ord._id}_`) && 
                                    k !== `doorstep_${ord._id}`
                                )
                                try { localStorage.setItem('snapcart_cleared_notif_keys', JSON.stringify(updated)) } catch (e) {}
                                return updated
                            })
                            setDismissedAlerts(prev => prev.filter(a => a !== 'out_for_delivery' && a !== 'doorstep'))
                        }
                    } catch (e) {}
                })
            }
        } catch (e) {}
    }

    // Fetch unread customer chat count from store admin
    const fetchCustomerUnreadChatCount = async () => {
        if (!user?._id) return
        try {
            const res = await axios.get(`/api/chat/unread?roomId=store_user_${user._id}&senderRole=admin`)
            if (typeof res.data?.unreadCount === 'number') {
                setCustomerUnreadChats(res.data.unreadCount)
            }
        } catch (e) {}
    }

    useEffect(() => {
        if (user?.role === "user") {
            fetchActiveOrders()
            fetchCustomerUnreadChatCount()
            const interval = setInterval(() => {
                fetchActiveOrders()
                fetchCustomerUnreadChatCount()
            }, 8000)
            return () => clearInterval(interval)
        }
    }, [user])

    // Global real-time socket delivery & store chat updates
    useEffect(() => {
        if (user?.role !== "user") return
        const socket = getSocket()
        if (!socket) return

        const customerRoomId = `store_user_${user._id}`
        if (user?._id) {
            socket.emit("identity", user._id)
            socket.emit("join-room", customerRoomId)
        }

        const processedMsgIds = new Set<string>()

        const handleIncomingChatForCustomer = (msg: any) => {
            if (!msg || (!msg.roomId && !msg.orderId)) return

            // 1. Messages from Admin / Store Support
            if (msg.roomId === customerRoomId) {
                if (msg.senderRole !== "admin") return

                const msgKey = String(msg.clientMsgId || msg._id || '')
                if (msgKey && processedMsgIds.has(msgKey)) return
                if (msgKey) processedMsgIds.add(msgKey)

                // Play notification popup sound chime!
                playChatNotificationChime()

                // If the chat modal is currently open for this room, mark read immediately
                if (chatModalConfigRef.current?.isOpen && chatModalConfigRef.current?.roomId === customerRoomId) {
                    axios.post('/api/chat/unread', { roomId: customerRoomId, senderRole: 'admin' }).catch(() => {})
                    return
                }

                // Increment unread chat counter badge
                setCustomerUnreadChats(prev => prev + 1)

                // Show toast notification with direct click-to-open
                toast((t) => (
                    <div 
                        onClick={() => {
                            toast.dismiss(t.id)
                            handleOpenCustomerStoreChat()
                        }}
                        className="flex items-center gap-3 cursor-pointer py-1"
                    >
                        <div className="w-8 h-8 rounded-xl bg-green-100 flex items-center justify-center text-green-700 font-bold shrink-0">
                            <Store size={18} />
                        </div>
                        <div className="overflow-hidden">
                            <p className="text-xs font-bold text-gray-800">
                                💬 Central Mart Store: <span className="font-normal text-gray-600 truncate">{msg.text}</span>
                            </p>
                            <p className="text-[10px] text-green-600 font-bold mt-0.5">Click to view & reply</p>
                        </div>
                    </div>
                ), { duration: 6000, position: 'top-right' })
                return
            }

            // 2. Messages from Delivery Boy for Customer Order
            const rawRoomId = String(msg.roomId || '')
            const isOrderChat = rawRoomId.startsWith("order_") || Boolean(msg.orderId)
            const orderId = String(msg.orderId || rawRoomId.replace(/^order_/, ""))
            const myId = String(user?._id || (user as any)?.id || "")

            // Ignore messages sent by customer themself
            if (msg.senderId && String(msg.senderId) === myId) return
            if (msg.senderRole === "user") return

            if (isOrderChat && orderId) {
                const msgKey = String(msg.clientMsgId || msg._id || '')
                if (msgKey && processedMsgIds.has(msgKey)) return
                if (msgKey) processedMsgIds.add(msgKey)

                // 🔔 WAKE UP THE NOTIFICATION: Remove from clearedNotifKeys & reset dismissed alerts!
                setClearedNotifKeys(prev => {
                    const updated = prev.filter(k => 
                        k !== String(orderId) && 
                        !k.startsWith(`${orderId}_`) && 
                        k !== `doorstep_${orderId}`
                    )
                    try { localStorage.setItem('snapcart_cleared_notif_keys', JSON.stringify(updated)) } catch (e) {}
                    return updated
                })
                setDismissedAlerts(prev => prev.filter(a => a !== 'out_for_delivery' && a !== 'doorstep'))

                // Refresh orders
                fetchActiveOrders()

                // Play pleasant notification sound chime!
                playDoorbellChime()

                // Update rider messages state
                const riderName = msg.senderName || "Delivery Partner"
                setRiderMessages(prev => ({
                    ...prev,
                    [orderId]: {
                        text: msg.text,
                        time: msg.time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                        senderName: riderName,
                        unread: (prev[orderId]?.unread || 0) + 1
                    }
                }))

                // If chat modal is already open for this exact room, mark read and do not toast
                if (chatModalConfigRef.current?.isOpen && 
                    (chatModalConfigRef.current?.roomId === `order_${orderId}` || chatModalConfigRef.current?.roomId === orderId)) {
                    axios.post('/api/chat/unread', { roomId: `order_${orderId}`, senderRole: 'deliveryBoy' }).catch(() => {})
                    return
                }

                // Show rich interactive toast with 1-click reply!
                const shortId = orderId.slice(-6).toUpperCase()

                toast((t) => (
                    <div 
                        onClick={() => {
                            toast.dismiss(t.id)
                            setRiderMessages(prev => {
                                const updated = { ...prev }
                                if (updated[orderId]) updated[orderId] = { ...updated[orderId], unread: 0 }
                                return updated
                            })
                            axios.post('/api/chat/unread', { roomId: `order_${orderId}`, senderRole: 'deliveryBoy' }).catch(() => {})
                            setChatModalConfig({
                                isOpen: true,
                                roomId: `order_${orderId}`,
                                title: `Chat with ${riderName}`,
                                subtitle: `Order #${shortId} • Delivery Coordination`,
                                partnerRole: 'deliveryBoy',
                                partnerName: riderName,
                                orderId: orderId,
                                currentUser: { _id: user._id, name: user.name, role: user.role }
                            })
                        }}
                        className="flex items-center gap-3 cursor-pointer py-1.5"
                    >
                        <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center text-xl shrink-0 shadow-xs border border-blue-200">
                            🛵
                        </div>
                        <div className="overflow-hidden flex-1">
                            <div className="flex items-center justify-between gap-1">
                                <p className="text-xs font-black text-gray-900 truncate">
                                    🛵 {riderName}
                                </p>
                                <span className="text-[10px] bg-blue-100 text-blue-800 font-black px-1.5 py-0.5 rounded shrink-0">
                                    #{shortId}
                                </span>
                            </div>
                            <p className="text-xs text-gray-700 font-semibold line-clamp-2 mt-0.5">
                                "{msg.text}"
                            </p>
                            <p className="text-[10px] text-blue-600 font-black mt-1 flex items-center gap-1">
                                <span>💬 Click to open chat & reply</span>
                            </p>
                        </div>
                    </div>
                ), { 
                    duration: 9000, 
                    position: 'top-right',
                    style: {
                        background: '#ffffff',
                        border: '2px solid #3b82f6',
                        borderRadius: '16px',
                        boxShadow: '0 10px 25px -5px rgba(59, 130, 246, 0.25)'
                    }
                })
            }
        }

        const handleDispatched = (data: any) => {
            if (data?.orderId) {
                setClearedNotifKeys(prev => {
                    const updated = prev.filter(k => k !== `${data.orderId}_out of delivery` && k !== String(data.orderId))
                    try { localStorage.setItem('snapcart_cleared_notif_keys', JSON.stringify(updated)) } catch (e) {}
                    return updated
                })
            }
            setLiveDispatchedAlert(data)
            fetchActiveOrders()
            toast.success(`🚀 Order #${String(data?.orderId).slice(-6).toUpperCase()} is out for delivery!`, {
                duration: 6000,
                style: { background: '#eff6ff', border: '2px solid #3b82f6', color: '#1e40af', fontWeight: '700' }
            })
        }

        const handleAtDoorstep = (data: any) => {
            if (data?.orderId) {
                setClearedNotifKeys(prev => {
                    const updated = prev.filter(k => k !== `doorstep_${data.orderId}`)
                    try { localStorage.setItem('snapcart_cleared_notif_keys', JSON.stringify(updated)) } catch (e) {}
                    return updated
                })
            }
            setLiveDoorstepAlert(data)
            playDoorbellChime()
            fetchActiveOrders()
            toast('🔔 Delivery partner has reached your doorstep! Please go and receive your groceries.', {
                icon: '🔔',
                duration: 10000,
                style: { background: '#fefce8', border: '2px solid #eab308', color: '#854d0e', fontWeight: '700' }
            })
        }

        const handleDelivered = (data: any) => {
            setLiveDoorstepAlert(null)
            setLiveDispatchedAlert(null)
            fetchActiveOrders()
            toast.success('✅ Order delivered successfully!', { duration: 5000 })
        }

        socket.on('order-dispatched', handleDispatched)
        socket.on('rider-at-doorstep', handleAtDoorstep)
        socket.on('order-delivered', handleDelivered)
        socket.on('send-message', handleIncomingChatForCustomer)
        socket.on('admin-store-message', handleIncomingChatForCustomer)

        return () => {
            socket.off('order-dispatched', handleDispatched)
            socket.off('rider-at-doorstep', handleAtDoorstep)
            socket.off('order-delivered', handleDelivered)
            socket.off('send-message', handleIncomingChatForCustomer)
            socket.off('admin-store-message', handleIncomingChatForCustomer)
        }
    }, [user])

    useEffect(() => {
        if (user?.role === "admin") {
            const fetchAdminData = async () => {
                try {
                    const [ordersRes, chatsRes, approvalsRes] = await Promise.all([
                        axios.get('/api/admin/get-orders').catch(() => ({ data: [] })),
                        axios.get('/api/admin/chat-conversations').catch(() => ({ data: [] })),
                        axios.get('/api/admin/pending-approvals').catch(() => ({ data: { count: 0 } }))
                    ])
                    if (Array.isArray(ordersRes.data)) {
                        setPendingOrdersCount(ordersRes.data.filter((o: any) => o.status === "pending").length)
                    }
                    if (Array.isArray(chatsRes.data)) {
                        const unread = chatsRes.data.reduce((sum: number, c: any) => sum + (Number(c.unreadCount) || 0), 0)
                        setAdminUnreadChats(unread)
                    }
                    if (typeof approvalsRes.data?.count === 'number') {
                        setPendingApprovalsCount(approvalsRes.data.count)
                    }
                } catch (e) { console.log(e) }
            }

            fetchAdminData()
            const interval = setInterval(fetchAdminData, 6000)

            const socket = getSocket()
            if (socket) {
                const handleStoreChatAlert = (msg: any) => {
                    if (msg && msg.senderRole !== "admin") {
                        playDoorbellChime()
                        setAdminUnreadChats(prev => prev + 1)
                        toast((t) => (
                            <div 
                                onClick={() => {
                                    toast.dismiss(t.id)
                                    setChatModalConfig({
                                        isOpen: true,
                                        roomId: msg.roomId,
                                        title: `Support: ${msg.senderName || 'Customer'}`,
                                        subtitle: 'Store Customer Inquiry',
                                        partnerRole: 'user',
                                        partnerName: msg.senderName || 'Customer',
                                        currentUser: { _id: user._id, name: user.name || 'Store Support', role: 'admin' }
                                    })
                                }}
                                className="flex items-center gap-3 cursor-pointer py-1"
                            >
                                <div className="w-8 h-8 rounded-xl bg-green-100 flex items-center justify-center text-green-700 font-bold shrink-0">
                                    <MessageSquare size={16} />
                                </div>
                                <div className="overflow-hidden">
                                    <p className="text-xs font-bold text-gray-800">
                                        💬 {msg.senderName || 'Customer'}: <span className="font-normal text-gray-600 truncate">{msg.text}</span>
                                    </p>
                                    <p className="text-[10px] text-green-600 font-bold mt-0.5">Click to reply directly</p>
                                </div>
                            </div>
                        ), { duration: 6000, position: 'top-right' })
                    }
                }

                const handleDeliveryRegistration = (data: any) => {
                    playDoorbellChime()
                    setPendingApprovalsCount(prev => prev + 1)
                    toast((t) => (
                        <div 
                            onClick={() => {
                                toast.dismiss(t.id)
                                router.push('/admin/manage-users')
                            }}
                            className="flex items-center gap-3 cursor-pointer py-1"
                        >
                            <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center text-2xl shrink-0 shadow-xs">
                                🛵
                            </div>
                            <div className="overflow-hidden">
                                <p className="text-xs font-black text-gray-800">
                                    🛵 New Delivery Partner Applied!
                                </p>
                                <p className="text-[11px] text-gray-600 truncate mt-0.5">
                                    <b>{data.name || 'Applicant'}</b> is awaiting your verification.
                                </p>
                                <p className="text-[10px] text-amber-600 font-black mt-0.5">Click to review & approve</p>
                            </div>
                        </div>
                    ), { duration: 9000, position: 'top-right' })
                }

                const handleApprovalChanged = () => {
                    axios.get('/api/admin/pending-approvals').then(res => {
                        if (typeof res.data?.count === 'number') {
                            setPendingApprovalsCount(res.data.count)
                        }
                    }).catch(() => {})
                }

                socket.on('admin-store-message', handleStoreChatAlert)
                socket.on('send-message', (msg: any) => {
                    if (msg?.roomId?.startsWith('store_')) {
                        handleStoreChatAlert(msg)
                    }
                })
                socket.on('new-delivery-partner-registered', handleDeliveryRegistration)
                socket.on('delivery-approval-status-changed', handleApprovalChanged)

                return () => {
                    clearInterval(interval)
                    socket.off('admin-store-message', handleStoreChatAlert)
                    socket.off('new-delivery-partner-registered', handleDeliveryRegistration)
                    socket.off('delivery-approval-status-changed', handleApprovalChanged)
                }
            }

            return () => clearInterval(interval)
        }
    }, [user])

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (profileDropDown.current && !profileDropDown.current.contains(e.target as Node)) {
                setOpen(false)
            }
            if (notifDropDown.current && !notifDropDown.current.contains(e.target as Node)) {
                setNotifOpen(false)
            }
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])

    const handleSearch = (e: FormEvent) => {
        e.preventDefault()
        const query = search.trim()
        if (!query) return router.push("/")
        router.push(`/?q=${encodeURIComponent(query)}#products`)
        setSearchBarOpen(false)
    }

    const clearSearch = () => {
        setSearch("")
        router.push("/")
    }

    const totalCartCount = Array.isArray(cartData) ? cartData.reduce((sum, item) => sum + (Number(item?.quantity) || 1), 0) : 0
    const totalCartValue = Array.isArray(cartData) ? cartData.reduce((sum, item) => sum + (Number(item?.price || 0) * (Number(item?.quantity) || 1)), 0) : 0

    // Filter out cleared delivery notifications
    const visibleActiveDeliveries = activeDeliveries.filter((o: any) =>
        !clearedNotifKeys.includes(String(o._id)) && !clearedNotifKeys.includes(`${o._id}_${o.status}`)
    )
    const visibleDoorstepAlert = liveDoorstepAlert && !clearedNotifKeys.includes(`doorstep_${liveDoorstepAlert?.orderId}`)
        ? liveDoorstepAlert
        : null

    const totalRiderUnread = Object.values(riderMessages).reduce((sum, item) => sum + (Number(item?.unread) || 0), 0)
    const totalNotifCount = (visibleDoorstepAlert ? 1 : 0) + visibleActiveDeliveries.length + (totalRiderUnread > 0 && visibleActiveDeliveries.length === 0 && !visibleDoorstepAlert ? 1 : 0)

    // Admin sidebar portal
    const sideBar = mounted ? createPortal(
        <AnimatePresence>
            {menuOpen && (
                <>
                    <motion.div
                        key="admin-sidebar-drawer"
                        initial={{ x: -300, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: -300, opacity: 0 }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        className='fixed top-0 left-0 h-full w-[80%] max-w-xs z-[9999] bg-gradient-to-b from-green-800 via-green-700 to-green-900 backdrop-blur-xl shadow-2xl flex flex-col p-6 text-white'
                    >
                        <div className='flex justify-between items-center mb-6'>
                            <BrandLogo size="md" />
                            <button className='w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition' onClick={() => setMenuOpen(false)}>
                                <X size={18} />
                            </button>
                        </div>

                        <div className='flex items-center gap-3 p-3 rounded-2xl bg-white/10 mb-6'>
                            <div className='w-12 h-12 rounded-full overflow-hidden border-2 border-green-400/60 flex items-center justify-center bg-white/20 shrink-0'>
                                {user.image ? <Image src={user.image} alt='user' width={48} height={48} className='object-cover rounded-full' /> : <User size={22} />}
                            </div>
                            <div>
                                <h2 className='text-base font-bold text-white'>{user.name}</h2>
                                <p className='text-xs text-green-200 capitalize'>{user.role}</p>
                            </div>
                        </div>

                        <div className='flex flex-col gap-2 font-medium flex-1'>
                            {[
                                { href: "/admin/add-grocery", icon: PlusCircle, label: "Add Grocery" },
                                { href: "/admin/view-grocery", icon: Boxes, label: "View Grocery" },
                                { href: "/admin/manage-orders", icon: ClipboardCheck, label: "Manage Orders", badge: pendingOrdersCount },
                                { href: "/admin/sales-records", icon: CalendarDays, label: "Sales & Records Calendar" },
                                { href: "/admin/manage-users", icon: Users, label: "Manage Users" },
                                { href: "/admin/customer-chats", icon: MessageSquare, label: "Customer Chats", badge: adminUnreadChats },
                                { href: "/profile", icon: User, label: "Profile Settings" },
                            ].map(({ href, icon: Icon, label, badge }) => (
                                <Link key={href} href={href}
                                    className='flex items-center justify-between p-3 rounded-xl bg-white/10 hover:bg-white/20 transition-all active:scale-95'
                                    onClick={() => setMenuOpen(false)}
                                >
                                    <span className='flex items-center gap-3'><Icon size={18} />{label}</span>
                                    {badge ? <span className='bg-red-500 text-white text-xs px-2 py-0.5 rounded-full font-bold'>{badge}</span> : null}
                                </Link>
                            ))}
                        </div>

                        <button
                            className='flex items-center gap-3 text-red-300 font-semibold mt-4 hover:bg-red-500/20 p-3 rounded-xl transition-all cursor-pointer'
                            onClick={async () => await signOut({ callbackUrl: "/" })}
                        >
                            <LogOut size={18} className='text-red-300' /> Logout
                        </button>
                    </motion.div>

                    {/* backdrop */}
                    <motion.div
                        key="admin-sidebar-backdrop"
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }} 
                        exit={{ opacity: 0 }}
                        className='fixed inset-0 bg-black/40 backdrop-blur-sm z-[9998]'
                        onClick={() => setMenuOpen(false)}
                    />
                </>
            )}
        </AnimatePresence>,
        document.body
    ) : null

    return (
        <>
            {/* ── Main Navbar ── */}
            <div className='sticky top-0 sm:fixed sm:top-3 sm:left-1/2 sm:-translate-x-1/2 w-full sm:w-[94%] sm:max-w-7xl z-50
                bg-gradient-to-r from-green-600 to-green-700
                shadow-md sm:rounded-2xl sm:shadow-xl sm:shadow-green-900/20
                flex flex-col px-4 sm:px-6 py-2.5 sm:py-3 gap-2'>

                {/* Row 1: Logo | Desktop Search | Actions */}
                <div className='flex items-center gap-3 md:gap-4'>
                    {/* Admin hamburger (mobile) */}
                    {user.role === "admin" && (
                        <button
                            className='md:hidden w-9 h-9 rounded-xl bg-white/15 hover:bg-white/25 flex items-center justify-center text-white transition relative'
                            onClick={() => setMenuOpen(prev => !prev)}
                        >
                            <Menu size={20} />
                            {pendingOrdersCount > 0 && (
                                <span className='absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center'>{pendingOrdersCount}</span>
                            )}
                        </button>
                    )}

                    {/* Logo */}
                    <Link href="/" className='shrink-0 hover:scale-[1.02] transition-transform'>
                        <BrandLogo size="md" />
                    </Link>

                    {/* Desktop Search (user only) */}
                    {user.role === "user" && (
                        <form
                            className='hidden md:flex items-center bg-white/95 hover:bg-white rounded-xl px-4 py-2.5 flex-1 max-w-2xl shadow-md relative group transition-all'
                            onSubmit={handleSearch}
                        >
                            <Search className='text-green-600 w-4 h-4 mr-2.5 shrink-0' />
                            <input
                                type="text"
                                placeholder='Search groceries, fruits, milk...'
                                className='w-full outline-none text-gray-700 placeholder-gray-400 text-sm bg-transparent'
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                            {search && (
                                <button type="button" onClick={clearSearch} className="absolute right-3 text-gray-400 hover:text-gray-600 cursor-pointer">
                                    <X size={15} />
                                </button>
                            )}
                        </form>
                    )}

                    {/* Desktop Admin Links */}
                    {user.role === "admin" && (
                        <div className='hidden md:flex items-center gap-2 ml-2 flex-1 flex-wrap'>
                            {[
                                { href: "/admin/add-grocery", icon: PlusCircle, label: "Add Grocery" },
                                { href: "/admin/view-grocery", icon: Boxes, label: "View Grocery" },
                                { href: "/admin/manage-orders", icon: ClipboardCheck, label: "Orders", badge: pendingOrdersCount },
                                { href: "/admin/sales-records", icon: CalendarDays, label: "Sales Calendar" },
                                { href: "/admin/manage-users", icon: Users, label: "Users", badge: pendingApprovalsCount },
                                { href: "/admin/customer-chats", icon: MessageSquare, label: "Customer Chats", badge: adminUnreadChats },
                            ].map(({ href, icon: Icon, label, badge }) => (
                                <Link key={href} href={href}
                                    className='relative flex items-center gap-1.5 bg-white/15 hover:bg-white/25 text-white font-semibold text-xs px-3 py-1.5 rounded-xl transition-all'
                                >
                                    <Icon size={14} />{label}
                                    {badge ? (
                                        <span className={`absolute -top-1.5 -right-1.5 text-white text-[9px] font-black min-w-4 h-4 px-1 rounded-full flex items-center justify-center border-2 border-green-600 ${
                                            label === "Users" ? "bg-amber-500 animate-pulse shadow-md" : "bg-red-500 animate-bounce"
                                        }`}>
                                            {badge}
                                        </span>
                                    ) : null}
                                </Link>
                            ))}
                        </div>
                    )}

                    <div className='ml-auto flex items-center gap-2 sm:gap-3'>
                        {/* Search button (user only) — visible on all screen sizes */}
                        {user.role === "user" && (
                            <button
                                className='flex w-9 h-9 rounded-xl bg-white/15 hover:bg-white/25 items-center justify-center text-white transition'
                                onClick={() => setSearchBarOpen(prev => !prev)}
                            >
                                <Search size={18} />
                            </button>
                        )}

                        {/* Cart (user only) — hidden on mobile (bottom nav has it), shown on sm+ */}
                        {user.role === "user" && (
                            <Link href="/user/cart" className='relative hidden sm:flex items-center gap-1.5 bg-white/15 hover:bg-white/25 text-white px-3 py-1.5 rounded-xl transition font-semibold text-xs'>
                                <ShoppingCart size={17} />
                                <span className='hidden sm:inline'>Cart</span>
                                {totalCartCount > 0 && (
                                    <span className='absolute -top-1.5 -right-1.5 bg-amber-400 text-green-900 text-[9px] font-black min-w-4 h-4 px-1 rounded-full flex items-center justify-center border-2 border-green-600 shadow-md'>
                                        {totalCartCount}
                                    </span>
                                )}
                            </Link>
                        )}

                        {/* 💬 Store Chat (Customer <-> Shop Owner) */}
                        {user.role === "user" && user?._id && (
                            <button
                                type="button"
                                onClick={handleOpenCustomerStoreChat}
                                className="relative flex items-center gap-1.5 bg-white/15 hover:bg-white/25 text-white px-2.5 sm:px-3 py-1.5 rounded-xl transition font-semibold text-xs cursor-pointer active:scale-95"
                                title="Chat with Store Owner"
                            >
                                <div className="relative flex items-center justify-center">
                                    <MessageSquare size={16} />
                                    {customerUnreadChats > 0 && (
                                        <span className="absolute -top-2 -right-2.5 bg-red-500 text-white text-[9px] font-black min-w-4 h-4 px-1 rounded-full flex items-center justify-center border-2 border-green-700 shadow-md animate-pulse">
                                            {customerUnreadChats}
                                        </span>
                                    )}
                                </div>
                                <span className="hidden sm:inline">Store Chat</span>
                                {customerUnreadChats > 0 && (
                                    <span className="bg-amber-400 text-green-950 text-[10px] font-black px-1.5 py-0.2 rounded-full ml-0.5 animate-pulse">
                                        {customerUnreadChats}
                                    </span>
                                )}
                            </button>
                        )}


                        {/* 🔔 Live Delivery Notification Bell (For Customers) */}
                        {user.role === "user" && user?._id && (
                            <div className="relative" ref={notifDropDown}>
                                <button
                                    type="button"
                                    className={`w-9 h-9 rounded-xl flex items-center justify-center transition text-white relative cursor-pointer active:scale-95 ${
                                        visibleDoorstepAlert ? 'bg-red-500 hover:bg-red-600 animate-pulse' :
                                        totalRiderUnread > 0 ? 'bg-amber-500 hover:bg-amber-600 animate-pulse' :
                                        visibleActiveDeliveries.some((o: any) => o.status === 'out of delivery') ? 'bg-blue-500 hover:bg-blue-600' :
                                        'bg-white/15 hover:bg-white/25'
                                    }`}
                                    onClick={() => setNotifOpen(prev => !prev)}
                                    title="Live Delivery Notifications"
                                >
                                    {visibleDoorstepAlert ? (
                                        <BellRing size={18} className="animate-bounce text-yellow-200" />
                                    ) : totalRiderUnread > 0 ? (
                                        <MessageSquare size={17} className="animate-bounce text-white" />
                                    ) : (
                                        <Bell size={18} className={totalNotifCount > 0 ? "text-yellow-300" : "text-white"} />
                                    )}

                                    {/* Alert Badge */}
                                    {(totalNotifCount > 0 || totalRiderUnread > 0) && (
                                        <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[9px] font-black min-w-4 h-4 px-1 rounded-full flex items-center justify-center border-2 border-green-700 shadow-md animate-pulse">
                                            {totalNotifCount + totalRiderUnread}
                                        </span>
                                    )}
                                </button>

                                {/* Notification Dropdown Popover */}
                                <AnimatePresence>
                                    {notifOpen && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -8, scale: 0.96 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: -8, scale: 0.96 }}
                                            transition={{ duration: 0.15 }}
                                            className='absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-3xl shadow-2xl border border-gray-100 p-4 z-[999] text-gray-800'
                                        >
                                            {/* Header */}
                                            <div className="flex items-center justify-between border-b pb-3 mb-3">
                                                <div className="flex items-center gap-2">
                                                    <Bell className="text-green-600 w-4 h-4" />
                                                    <h3 className="font-black text-sm text-gray-900">Delivery Notifications</h3>
                                                    {totalNotifCount > 0 && (
                                                        <span className="bg-green-100 text-green-800 text-[10px] font-black px-2 py-0.5 rounded-full">
                                                            {totalNotifCount} En Route
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {totalNotifCount > 0 && (
                                                        <button
                                                            type="button"
                                                            onClick={handleClearAllNotifications}
                                                            className="text-[10px] font-black text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-2.5 py-1 rounded-xl transition flex items-center gap-1 cursor-pointer"
                                                            title="Clear all active notifications"
                                                        >
                                                            <Trash2 size={11} />
                                                            <span>Clear All</span>
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => setNotifOpen(false)}
                                                        className="text-gray-400 hover:text-gray-600 p-1 cursor-pointer"
                                                    >
                                                        <X size={15} />
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Content */}
                                            <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-0.5">
                                                {/* Live Doorstep Alert */}
                                                {visibleDoorstepAlert && (
                                                    <div className="p-3.5 bg-gradient-to-r from-red-500 via-rose-500 to-amber-500 text-white rounded-2xl shadow-md space-y-2 animate-pulse">
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-2">
                                                                <BellRing size={16} className="text-yellow-200 animate-bounce" />
                                                                <span className="text-xs font-black">Partner At Your Doorstep!</span>
                                                            </div>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleDismissNotification(`doorstep_${visibleDoorstepAlert.orderId}`)}
                                                                className="text-white/80 hover:text-white p-0.5 rounded-md hover:bg-black/20 transition cursor-pointer"
                                                                title="Clear notification"
                                                            >
                                                                <X size={13} />
                                                            </button>
                                                        </div>
                                                        <p className="text-[11px] text-white/95">
                                                            🔔 Delivery partner {visibleDoorstepAlert.riderName ? `(${visibleDoorstepAlert.riderName})` : ''} has reached your doorstep! Please go and receive your groceries. Keep OTP ready.
                                                        </p>
                                                        <div className="flex items-center justify-between pt-1">
                                                            <div className="flex items-center gap-1.5">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        setNotifOpen(false)
                                                                        setChatModalConfig({
                                                                            isOpen: true,
                                                                            roomId: `order_${visibleDoorstepAlert.orderId}`,
                                                                            title: `Chat with ${visibleDoorstepAlert.riderName || 'Rider'}`,
                                                                            subtitle: `Order #${String(visibleDoorstepAlert.orderId).slice(-6).toUpperCase()} • At Doorstep`,
                                                                            partnerRole: 'deliveryBoy',
                                                                            partnerName: visibleDoorstepAlert.riderName || 'Delivery Partner',
                                                                            orderId: visibleDoorstepAlert.orderId,
                                                                            deliveryOtp: visibleDoorstepAlert.deliveryOtp,
                                                                            currentUser: { _id: user._id, name: user.name, role: user.role }
                                                                        })
                                                                    }}
                                                                    className="text-[11px] font-bold bg-white/20 hover:bg-white/30 text-white px-2.5 py-1 rounded-xl transition flex items-center gap-1 cursor-pointer"
                                                                >
                                                                    <MessageSquare size={12} />
                                                                    <span>Chat</span>
                                                                </button>
                                                                <Link
                                                                    href="/user/my-orders"
                                                                    onClick={() => setNotifOpen(false)}
                                                                    className="text-[11px] font-black bg-white text-rose-900 px-3 py-1 rounded-xl shadow-xs hover:bg-yellow-50 transition"
                                                                >
                                                                    View OTP
                                                                </Link>
                                                            </div>
                                                            <button
                                                                onClick={() => handleDismissNotification(`doorstep_${visibleDoorstepAlert.orderId}`)}
                                                                className="text-[10px] text-white/90 hover:text-white bg-black/20 hover:bg-black/30 px-2.5 py-1 rounded-lg transition cursor-pointer flex items-center gap-1"
                                                            >
                                                                <Trash2 size={10} />
                                                                <span>Clear</span>
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Active Deliveries List (Strictly out of delivery) */}
                                                {visibleActiveDeliveries.length > 0 ? (
                                                    visibleActiveDeliveries.map((ord: any) => {
                                                        const rider = ord.assignedDeliveryBoy?.name || "Delivery Partner"

                                                        return (
                                                            <div
                                                                key={ord._id}
                                                                className="p-3 rounded-2xl border text-xs space-y-2 transition bg-blue-50/90 border-blue-200 shadow-xs"
                                                            >
                                                                <div className="flex items-center justify-between">
                                                                    <span className="font-extrabold text-gray-800 flex items-center gap-1.5">
                                                                        <Truck size={14} className="text-blue-600 animate-pulse" />
                                                                        Order #{ord._id.slice(-6).toUpperCase()}
                                                                    </span>
                                                                    <div className="flex items-center gap-1.5">
                                                                        <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-blue-200 text-blue-900">
                                                                            🚀 Out for Delivery
                                                                        </span>
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => handleDismissNotification(`${ord._id}_${ord.status}`)}
                                                                            className="text-gray-400 hover:text-red-500 p-0.5 rounded-md hover:bg-gray-200 transition cursor-pointer"
                                                                            title="Clear notification"
                                                                        >
                                                                            <X size={13} />
                                                                        </button>
                                                                    </div>
                                                                </div>

                                                                <p className="text-[11px] text-gray-600 leading-tight">
                                                                    🛵 {rider} has picked up your groceries and is en route to your address.
                                                                </p>

                                                                {/* OTP if available when out for delivery */}
                                                                {ord.deliveryOtp && (
                                                                    <div className="flex items-center justify-between bg-white px-2.5 py-1.5 rounded-xl border border-blue-100">
                                                                        <span className="text-[10px] text-gray-500 font-bold">Delivery OTP:</span>
                                                                        <span className="font-mono font-black text-xs text-blue-700 tracking-wider">
                                                                            {ord.deliveryOtp}
                                                                        </span>
                                                                    </div>
                                                                )}

                                                                {/* Latest Rider Message if any */}
                                                                {riderMessages[ord._id]?.text && (
                                                                    <div className="flex items-center justify-between bg-blue-100/90 px-2.5 py-1.5 rounded-xl border border-blue-200">
                                                                        <span className="text-[11px] text-blue-900 font-bold truncate flex items-center gap-1">
                                                                            <span>💬 Rider:</span>
                                                                            <span className="font-semibold italic truncate">"{riderMessages[ord._id].text}"</span>
                                                                        </span>
                                                                        {riderMessages[ord._id]?.unread > 0 && (
                                                                            <span className="bg-blue-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full shrink-0 ml-1">
                                                                                {riderMessages[ord._id].unread} new
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                )}

                                                                <div className="flex items-center justify-between pt-1">
                                                                    <span className="font-black text-green-700 text-xs">₹{ord.totalAmount}</span>
                                                                    <div className="flex items-center gap-1.5">
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => {
                                                                                setNotifOpen(false)
                                                                                setRiderMessages(prev => {
                                                                                    const updated = { ...prev }
                                                                                    if (updated[ord._id]) {
                                                                                        updated[ord._id] = { ...updated[ord._id], unread: 0 }
                                                                                    }
                                                                                    return updated
                                                                                })
                                                                                axios.post('/api/chat/unread', { roomId: `order_${ord._id}`, senderRole: 'deliveryBoy' }).catch(() => {})
                                                                                setChatModalConfig({
                                                                                    isOpen: true,
                                                                                    roomId: `order_${ord._id}`,
                                                                                    title: `Chat with ${rider}`,
                                                                                    subtitle: `Order #${ord._id.slice(-6).toUpperCase()} • Out for Delivery`,
                                                                                    partnerRole: 'deliveryBoy',
                                                                                    partnerName: rider,
                                                                                    partnerPhone: ord.assignedDeliveryBoy?.mobile,
                                                                                    orderId: ord._id,
                                                                                    deliveryOtp: ord.deliveryOtp,
                                                                                    currentUser: { _id: user._id, name: user.name, role: user.role }
                                                                                })
                                                                            }}
                                                                            className={`text-[10px] font-bold px-2.5 py-1 rounded-lg transition flex items-center gap-1 cursor-pointer ${
                                                                                riderMessages[ord._id]?.unread > 0
                                                                                    ? "bg-amber-400 text-blue-950 font-black animate-pulse shadow-xs"
                                                                                    : "text-blue-700 hover:text-blue-900 bg-blue-100/90 hover:bg-blue-200"
                                                                            }`}
                                                                        >
                                                                            <MessageSquare size={11} />
                                                                            <span>Chat</span>
                                                                            {riderMessages[ord._id]?.unread > 0 && (
                                                                                <span className="bg-red-500 text-white text-[8px] font-black px-1 rounded-full">
                                                                                    {riderMessages[ord._id].unread}
                                                                                </span>
                                                                            )}
                                                                        </button>
                                                                        <Link
                                                                            href={`/user/track-order/${ord._id}`}
                                                                            onClick={() => setNotifOpen(false)}
                                                                            className="text-[10px] font-bold text-gray-700 hover:text-gray-900 bg-gray-100 px-2.5 py-1 rounded-lg transition"
                                                                        >
                                                                            Live Track
                                                                        </Link>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )
                                                    })
                                                ) : !visibleDoorstepAlert ? (
                                                    <div className="py-8 text-center space-y-2">
                                                        <div className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center mx-auto text-green-600">
                                                            <CheckCircle2 size={24} />
                                                        </div>
                                                        <h4 className="font-bold text-xs text-gray-800">All Caught Up!</h4>
                                                        <p className="text-[11px] text-gray-400 max-w-[220px] mx-auto">
                                                            No active deliveries en route. Alerts will appear here when your delivery is out or at your doorstep.
                                                        </p>
                                                    </div>
                                                ) : null}
                                            </div>

                                            {/* Footer */}
                                            <div className="border-t pt-2.5 mt-2 flex items-center justify-between text-xs">
                                                <Link
                                                    href="/user/my-orders"
                                                    onClick={() => setNotifOpen(false)}
                                                    className="text-green-700 hover:text-green-800 font-extrabold flex items-center gap-1 text-[11px]"
                                                >
                                                    <span>View My Orders</span>
                                                    <ArrowRight size={12} />
                                                </Link>
                                                {totalNotifCount > 0 ? (
                                                    <button
                                                        type="button"
                                                        onClick={handleClearAllNotifications}
                                                        className="text-[11px] font-bold text-gray-500 hover:text-red-600 transition cursor-pointer"
                                                    >
                                                        Clear all
                                                    </button>
                                                ) : (
                                                    <span className="text-[10px] text-gray-400 font-medium">Snapcart Real-Time</span>
                                                )}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        )}

                        {/* Profile avatar or Log In button */}
                        {!user?._id ? (
                            <Link
                                href="/login"
                                className='bg-white text-green-700 hover:bg-green-50 font-black text-xs px-3.5 py-1.5 rounded-xl shadow-sm transition flex items-center gap-1.5'
                            >
                                <User size={15} />
                                <span>Log In</span>
                            </Link>
                        ) : (
                            <div className="relative" ref={profileDropDown}>
                                <button
                                    className='w-9 h-9 rounded-xl bg-white/15 hover:bg-white/25 flex items-center justify-center overflow-hidden transition text-white cursor-pointer'
                                    onClick={() => setOpen(prev => !prev)}
                                >
                                    {user.image
                                        ? <Image src={user.image} alt='user' width={36} height={36} className='object-cover w-full h-full' />
                                        : <User size={18} />
                                    }
                                </button>

                                <AnimatePresence>
                                    {open && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -8, scale: 0.96 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: -8, scale: 0.96 }}
                                            transition={{ duration: 0.15 }}
                                            className='absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-2xl border border-gray-100 p-2 z-[999]'
                                        >
                                            <div className='flex items-center gap-2.5 px-3 py-2.5 border-b border-gray-100 mb-1'>
                                                <div className='w-9 h-9 relative rounded-full bg-green-100 flex items-center justify-center overflow-hidden shrink-0'>
                                                    {user.image ? <Image src={user.image} alt='user' fill className='object-cover rounded-full' /> : <User className="text-green-700 w-4 h-4" />}
                                                </div>
                                                <div className='overflow-hidden'>
                                                    <div className='text-gray-800 font-bold truncate text-sm'>{user.name}</div>
                                                    <div className='text-xs text-gray-400 capitalize'>{user.role}</div>
                                                </div>
                                            </div>

                                            {user.role === "user" && (
                                                <>
                                                    <button
                                                        type="button"
                                                        className='flex items-center justify-between w-full px-3 py-2 hover:bg-green-50 rounded-xl text-gray-700 font-medium text-sm transition cursor-pointer text-left'
                                                        onClick={() => { setOpen(false); setNotifOpen(true) }}
                                                    >
                                                        <span className='flex items-center gap-2'>
                                                            <Bell className='w-4 h-4 text-green-600' /> Notifications
                                                        </span>
                                                        {((liveDoorstepAlert ? 1 : 0) + activeDeliveries.length) > 0 && (
                                                            <span className='bg-red-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full'>
                                                                {(liveDoorstepAlert ? 1 : 0) + activeDeliveries.length}
                                                            </span>
                                                        )}
                                                    </button>
                                                    <Link href="/user/my-orders" className='flex items-center gap-2 px-3 py-2 hover:bg-green-50 rounded-xl text-gray-700 font-medium text-sm transition' onClick={() => setOpen(false)}>
                                                        <Package className='w-4 h-4 text-green-600' /> My Orders
                                                    </Link>
                                                    <Link href="/user/wishlist" className='flex items-center gap-2 px-3 py-2 hover:bg-green-50 rounded-xl text-gray-700 font-medium text-sm transition' onClick={() => setOpen(false)}>
                                                        <span className='text-base'>❤️</span> My Wishlist
                                                    </Link>
                                                </>
                                            )}
                                            {user.role === "admin" && (
                                                <>
                                                    <Link 
                                                        href="/admin/manage-users" 
                                                        className='flex items-center justify-between px-3 py-2 hover:bg-green-50 rounded-xl text-gray-700 font-medium text-sm transition' 
                                                        onClick={() => setOpen(false)}
                                                    >
                                                        <span className='flex items-center gap-2'>
                                                            <Users className='w-4 h-4 text-green-600' /> Manage Staff & Users
                                                        </span>
                                                        {pendingApprovalsCount > 0 && (
                                                            <span className='bg-amber-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full animate-bounce'>
                                                                {pendingApprovalsCount} pending
                                                            </span>
                                                        )}
                                                    </Link>
                                                    <Link 
                                                        href="/admin/customer-chats" 
                                                        className='flex items-center justify-between px-3 py-2 hover:bg-green-50 rounded-xl text-gray-700 font-medium text-sm transition' 
                                                        onClick={() => setOpen(false)}
                                                    >
                                                        <span className='flex items-center gap-2'>
                                                            <MessageSquare className='w-4 h-4 text-green-600' /> Customer Chats
                                                        </span>
                                                        {adminUnreadChats > 0 && (
                                                            <span className='bg-red-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full'>
                                                                {adminUnreadChats}
                                                            </span>
                                                        )}
                                                    </Link>
                                                </>
                                            )}
                                            <Link href="/profile" className='flex items-center gap-2 px-3 py-2 hover:bg-green-50 rounded-xl text-gray-700 font-medium text-sm transition' onClick={() => setOpen(false)}>
                                                <User className='w-4 h-4 text-green-600' /> Profile & Account
                                            </Link>
                                            <button
                                                className='flex items-center gap-2 w-full text-left px-3 py-2 hover:bg-red-50 rounded-xl text-red-600 font-semibold text-sm transition mt-1 cursor-pointer'
                                                onClick={() => { setOpen(false); signOut({ callbackUrl: "/login" }) }}
                                            >
                                                <LogOut className='w-4 h-4 text-red-500' /> Log Out
                                            </button>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        )}
                    </div>
                </div>

                {/* Mobile Search Bar (slides down) */}
                <AnimatePresence>
                    {searchBarOpen && user.role === "user" && (
                        <motion.form
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className='md:hidden overflow-hidden'
                            onSubmit={handleSearch}
                        >
                            <div className='flex items-center bg-white rounded-xl px-3 py-2.5 gap-2'>
                                <Search className='text-green-600 w-4 h-4 shrink-0' />
                                <input
                                    type="text"
                                    className='w-full outline-none text-gray-700 text-sm placeholder-gray-400 bg-transparent'
                                    placeholder='Search groceries...'
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    autoFocus
                                />
                                {search && <button type="button" onClick={() => setSearch("")} className="text-gray-400"><X size={14} /></button>}
                                <button type="button" onClick={() => setSearchBarOpen(false)} className='text-gray-400 hover:text-gray-600'><X size={18} /></button>
                            </div>
                        </motion.form>
                    )}
                </AnimatePresence>
            </div>

            {/* ── Global Floating Real-Time Delivery Alert Banner ── */}
            {user.role === "user" && mounted && (visibleDoorstepAlert || (visibleActiveDeliveries.find((o: any) => o.status === 'out of delivery') && !dismissedAlerts.includes('out_for_delivery'))) && (
                <div className="fixed top-20 left-1/2 -translate-x-1/2 w-[94%] max-w-2xl z-40">
                    {visibleDoorstepAlert ? (
                        <div className="p-3.5 bg-gradient-to-r from-red-600 via-rose-600 to-amber-500 text-white rounded-2xl shadow-xl flex items-center justify-between gap-3 animate-pulse border-2 border-white/40">
                            <div className="flex items-center gap-2.5">
                                <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                                    <BellRing size={20} className="animate-bounce text-yellow-200" />
                                </div>
                                <div>
                                    <p className="font-black text-xs sm:text-sm">🔔 Delivery Partner is at your doorstep!</p>
                                    <p className="text-[11px] text-white/90">
                                        Please go and receive your groceries. Keep OTP ready for {visibleDoorstepAlert.riderName || 'Partner'}.
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                                <button
                                    onClick={() => setChatModalConfig({
                                        isOpen: true,
                                        roomId: `order_${visibleDoorstepAlert.orderId}`,
                                        title: `Chat with ${visibleDoorstepAlert.riderName || 'Rider'}`,
                                        subtitle: `Order #${String(visibleDoorstepAlert.orderId).slice(-6).toUpperCase()} • At Doorstep`,
                                        partnerRole: 'deliveryBoy',
                                        partnerName: visibleDoorstepAlert.riderName || 'Delivery Partner',
                                        orderId: visibleDoorstepAlert.orderId,
                                        deliveryOtp: visibleDoorstepAlert.deliveryOtp,
                                        currentUser: { _id: user._id, name: user.name, role: user.role }
                                    })}
                                    className="text-xs bg-white/20 hover:bg-white/30 text-white font-bold px-2.5 py-1.5 rounded-xl transition flex items-center gap-1 cursor-pointer"
                                >
                                    <MessageSquare size={13} /> Chat
                                </button>
                                <Link
                                    href="/user/my-orders"
                                    className="text-xs bg-white text-rose-900 font-black px-3 py-1.5 rounded-xl shadow-xs hover:bg-yellow-50 transition"
                                >
                                    View
                                </Link>
                                <button
                                    onClick={() => {
                                        if (visibleDoorstepAlert?.orderId) {
                                            handleDismissNotification(`doorstep_${visibleDoorstepAlert.orderId}`)
                                        }
                                        setLiveDoorstepAlert(null)
                                    }}
                                    className="text-white/80 hover:text-white p-1 cursor-pointer"
                                    title="Dismiss alert"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                        </div>
                    ) : (
                        (() => {
                            const outOrder = visibleActiveDeliveries.find((o: any) => o.status === 'out of delivery')
                            if (!outOrder) return null
                            return (
                                <div className="p-3 bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-600 text-white rounded-2xl shadow-xl flex items-center justify-between gap-3 border border-blue-400">
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                                            <Truck size={18} className="animate-pulse text-white" />
                                        </div>
                                        <div>
                                            <p className="font-black text-xs flex items-center gap-1.5">
                                                <span>🛵 Groceries Dispatched • Out for Delivery!</span>
                                                {riderMessages[outOrder._id]?.unread > 0 && (
                                                    <span className="bg-amber-400 text-blue-950 text-[9px] font-black px-1.5 py-0.2 rounded-full animate-bounce">
                                                        New Message
                                                    </span>
                                                )}
                                            </p>
                                            <p className="text-[11px] text-blue-100">
                                                {riderMessages[outOrder._id]?.text ? (
                                                    <span className="font-bold text-yellow-200">
                                                        💬 Rider: "{riderMessages[outOrder._id].text}"
                                                    </span>
                                                ) : (
                                                    `Order #${outOrder._id.slice(-6).toUpperCase()} is on the way to your door.`
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        {outOrder.deliveryOtp && (
                                            <span className="font-mono font-black text-yellow-300 text-xs bg-white/15 px-2 py-1 rounded-lg">
                                                OTP: {outOrder.deliveryOtp}
                                            </span>
                                        )}
                                        <button
                                            onClick={() => {
                                                setRiderMessages(prev => {
                                                    const updated = { ...prev }
                                                    if (updated[outOrder._id]) updated[outOrder._id] = { ...updated[outOrder._id], unread: 0 }
                                                    return updated
                                                })
                                                axios.post('/api/chat/unread', { roomId: `order_${outOrder._id}`, senderRole: 'deliveryBoy' }).catch(() => {})
                                                setChatModalConfig({
                                                    isOpen: true,
                                                    roomId: `order_${outOrder._id}`,
                                                    title: `Chat with ${outOrder.assignedDeliveryBoy?.name || 'Rider'}`,
                                                    subtitle: `Order #${outOrder._id.slice(-6).toUpperCase()} • Out for Delivery`,
                                                    partnerRole: 'deliveryBoy',
                                                    partnerName: outOrder.assignedDeliveryBoy?.name || 'Delivery Partner',
                                                    partnerPhone: outOrder.assignedDeliveryBoy?.mobile,
                                                    orderId: outOrder._id,
                                                    deliveryOtp: outOrder.deliveryOtp,
                                                    currentUser: { _id: user._id, name: user.name, role: user.role }
                                                })
                                            }}
                                            className={`text-xs font-bold px-2.5 py-1.5 rounded-xl transition flex items-center gap-1 cursor-pointer relative ${
                                                riderMessages[outOrder._id]?.unread > 0
                                                    ? "bg-amber-400 text-blue-950 font-black hover:bg-amber-300 animate-pulse shadow-md"
                                                    : "bg-white/20 hover:bg-white/30 text-white"
                                            }`}
                                        >
                                            <MessageSquare size={13} /> Chat
                                            {riderMessages[outOrder._id]?.unread > 0 && (
                                                <span className="w-2 h-2 rounded-full bg-red-600 animate-ping absolute -top-1 -right-1" />
                                            )}
                                        </button>
                                        <Link
                                            href={`/user/track-order/${outOrder._id}`}
                                            className="text-xs bg-white text-blue-900 font-black px-2.5 py-1 rounded-xl shadow-xs hover:bg-blue-50 transition"
                                        >
                                            Track
                                        </Link>
                                        <button
                                            onClick={() => {
                                                handleDismissNotification(`${outOrder._id}_${outOrder.status}`)
                                                setDismissedAlerts(prev => [...prev, 'out_for_delivery'])
                                            }}
                                            className="text-white/80 hover:text-white p-1 cursor-pointer"
                                            title="Dismiss alert"
                                        >
                                            <X size={15} />
                                        </button>
                                    </div>
                                </div>
                            )
                        })()
                    )}
                </div>
            )}

            {/* ── Bottom Nav Bar (mobile, user only) ── */}
            {user.role === "user" && (
                <div className='fixed bottom-0 left-0 right-0 z-40 sm:hidden bg-white/95 backdrop-blur-md border-t border-gray-100 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]'>
                    <div className='flex items-center justify-around py-1.5'>
                        
                        {/* Home */}
                        <Link href="/" className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition relative ${pathname === "/" ? 'text-green-600' : 'text-gray-400'}`}>
                            {pathname === "/" && <span className='absolute top-0 left-1/2 -translate-x-1/2 w-5 h-0.5 bg-green-600 rounded-full' />}
                            <Home size={22} />
                            <span className={`text-[10px] font-semibold`}>Home</span>
                        </Link>

                        {/* Categories */}
                        <button
                            onClick={() => {
                                const el = document.querySelector('[data-section="categories"]') || document.getElementById('categories') || document.querySelector('.category-section')
                                if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'start' }) }
                                else { window.scrollTo({ top: 280, behavior: 'smooth' }) }
                            }}
                            className='flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition text-gray-400 hover:text-green-600 cursor-pointer'
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
                            </svg>
                            <span className='text-[10px] font-semibold'>Categories</span>
                        </button>

                        {/* Store Chat (Chat with Shop Owner) */}
                        {user?._id && (
                            <button
                                onClick={handleOpenCustomerStoreChat}
                                className="relative flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition text-gray-400 hover:text-green-600 cursor-pointer"
                            >
                                <div className="relative flex items-center justify-center">
                                    <MessageSquare size={22} />
                                    {customerUnreadChats > 0 && (
                                        <span className="absolute -top-1 -right-2.5 bg-red-500 text-white text-[8px] font-black min-w-3.5 h-3.5 px-0.5 rounded-full flex items-center justify-center border border-white shadow-sm animate-pulse">
                                            {customerUnreadChats}
                                        </span>
                                    )}
                                </div>
                                <span className="text-[10px] font-semibold">Store Chat</span>
                            </button>
                        )}

                        {/* Orders or Login */}
                        {!user?._id ? (
                            <Link href="/login" className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition relative ${pathname === "/login" ? 'text-green-600' : 'text-gray-400'}`}>
                                <User size={22} />
                                <span className='text-[10px] font-semibold'>Log In</span>
                            </Link>
                        ) : (
                            <Link href="/user/my-orders" className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition relative ${pathname === "/user/my-orders" ? 'text-green-600' : 'text-gray-400'}`}>
                                {pathname === "/user/my-orders" && <span className='absolute top-0 left-1/2 -translate-x-1/2 w-5 h-0.5 bg-green-600 rounded-full' />}
                                <Package size={22} />
                                <span className='text-[10px] font-semibold'>Orders</span>
                            </Link>
                        )}

                        {/* Cart */}
                        <Link href="/user/cart" className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition relative ${pathname === "/user/cart" ? 'text-green-600' : 'text-gray-400'}`}>
                            {pathname === "/user/cart" && <span className='absolute top-0 left-1/2 -translate-x-1/2 w-5 h-0.5 bg-green-600 rounded-full' />}
                            <div className='relative'>
                                <ShoppingCart size={22} />
                                {totalCartCount > 0 && (
                                    <span className='absolute -top-1.5 -right-1.5 bg-amber-400 text-green-900 text-[9px] font-black min-w-4 h-4 px-0.5 rounded-full flex items-center justify-center'>
                                        {totalCartCount}
                                    </span>
                                )}
                            </div>
                            <span className='text-[10px] font-semibold'>Cart</span>
                        </Link>

                    </div>
                </div>
            )}

            {/* Unified Real-Time Chat Modal */}
            {chatModalConfig.isOpen && (
                <ChatModal
                    isOpen={chatModalConfig.isOpen}
                    onClose={() => {
                        if (chatModalConfig.orderId) {
                            setRiderMessages(prev => {
                                const updated = { ...prev }
                                if (updated[chatModalConfig.orderId]) {
                                    updated[chatModalConfig.orderId] = { ...updated[chatModalConfig.orderId], unread: 0 }
                                }
                                return updated
                            })
                            axios.post('/api/chat/unread', { roomId: `order_${chatModalConfig.orderId}`, senderRole: 'deliveryBoy' }).catch(() => {})
                        }
                        setChatModalConfig({ isOpen: false })
                    }}
                    roomId={chatModalConfig.roomId}
                    title={chatModalConfig.title}
                    subtitle={chatModalConfig.subtitle}
                    partnerRole={chatModalConfig.partnerRole}
                    partnerName={chatModalConfig.partnerName}
                    partnerPhone={chatModalConfig.partnerPhone}
                    orderId={chatModalConfig.orderId}
                    currentUser={chatModalConfig.currentUser || { _id: user._id, name: user.name, role: user.role }}
                    deliveryOtp={chatModalConfig.deliveryOtp}
                    onMessagesRead={() => {
                        setCustomerUnreadChats(0)
                        if (chatModalConfig.orderId) {
                            setRiderMessages(prev => {
                                const updated = { ...prev }
                                if (updated[chatModalConfig.orderId]) {
                                    updated[chatModalConfig.orderId] = { ...updated[chatModalConfig.orderId], unread: 0 }
                                }
                                return updated
                            })
                            axios.post('/api/chat/unread', { roomId: `order_${chatModalConfig.orderId}`, senderRole: 'deliveryBoy' }).catch(() => {})
                        }
                    }}
                />
            )}

            {sideBar}
        </>
    )
}