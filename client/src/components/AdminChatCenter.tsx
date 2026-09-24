'use client'

import React, { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'
import { motion, AnimatePresence } from 'motion/react'
import { 
    AlertTriangle, ArrowLeft, Ban, Bot, Check, CheckCheck, CheckCircle2, Clock, 
    MessageSquare, Package, Phone, RefreshCw, 
    Search, Send, Sparkles, Store, Trash2, User, Volume2, 
    VolumeX, X 
} from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { getSocket } from '@/lib/socket'

interface Customer {
    _id?: string
    name: string
    email?: string
    mobile?: string
    image?: string
    isBanned?: boolean
    banReason?: string
    role?: string
}

interface Conversation {
    roomId: string
    customer: Customer
    order?: {
        _id: string
        totalAmount: number
        status: string
        address?: any
    }
    lastMessage: {
        text: string
        time: string
        senderRole: string
        senderName: string
        createdAt: string
    }
    totalMsgs: number
    unreadCount: number
}

// Gentle pleasant notification chime via Web Audio API
function playMessagePing() {
    try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
        if (!AudioCtx) return
        const ctx = new AudioCtx()
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.type = "sine"
        osc.frequency.setValueAtTime(784, ctx.currentTime) // G5
        osc.frequency.setValueAtTime(1046.5, ctx.currentTime + 0.1) // C6
        gain.gain.setValueAtTime(0.2, ctx.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5)
        osc.start()
        osc.stop(ctx.currentTime + 0.5)
    } catch (e) {
        // audio blocked or unsupported
    }
}

export default function AdminChatCenter({ currentUser }: { currentUser: any }) {
    const [conversations, setConversations] = useState<Conversation[]>([])
    const [loadingConversations, setLoadingConversations] = useState(true)
    const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null)
    const selectedRoomIdRef = useRef<string | null>(null)
    const [searchQuery, setSearchQuery] = useState('')
    const [filterTab, setFilterTab] = useState<'all' | 'unread' | 'orders'>('all')

    // Active room messages state
    const [messages, setMessages] = useState<any[]>([])
    const [loadingMessages, setLoadingMessages] = useState(false)
    const [replyText, setReplyText] = useState('')
    const [sending, setSending] = useState(false)
    const [aiLoading, setAiLoading] = useState(false)
    const [suggestions, setSuggestions] = useState<string[]>([])
    const [soundEnabled, setSoundEnabled] = useState(true)

    const chatScrollRef = useRef<HTMLDivElement>(null)

    // Helper to switch active conversation and keep ref in sync
    const selectRoom = (roomId: string) => {
        selectedRoomIdRef.current = roomId
        setSelectedRoomId(roomId)
    }

    // Scroll to bottom helper
    const scrollToBottom = () => {
        if (chatScrollRef.current) {
            chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight
        }
        setTimeout(() => {
            if (chatScrollRef.current) {
                chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight
            }
        }, 100)
    }

    // Auto-scroll whenever messages list updates
    useEffect(() => {
        if (messages.length > 0) {
            scrollToBottom()
        }
    }, [messages.length])

    // Fetch all store conversations
    const fetchConversations = async (showSilent = false) => {
        if (!showSilent) setLoadingConversations(true)
        try {
            const res = await axios.get('/api/admin/chat-conversations')
            if (Array.isArray(res.data)) {
                setConversations(res.data)
            }
        } catch (error) {
            console.error('Failed to load conversations:', error)
        } finally {
            if (!showSilent) setLoadingConversations(false)
        }
    }

    // Initial load and periodic refresh
    useEffect(() => {
        fetchConversations()
        const interval = setInterval(() => fetchConversations(true), 5000)
        return () => clearInterval(interval)
    }, [])

    // Selected conversation
    const selectedConversation = conversations.find(c => c.roomId === selectedRoomId) || null

    // Load messages when selectedRoomId changes
    useEffect(() => {
        if (!selectedRoomId) {
            setMessages([])
            return
        }

        let isMounted = true
        setLoadingMessages(true)
        setSuggestions([])

        axios.post('/api/chat/messages', { roomId: selectedRoomId })
            .then(res => {
                if (isMounted && Array.isArray(res.data)) {
                    setMessages(res.data)
                    scrollToBottom()
                }
            })
            .catch(err => console.error('Failed to load messages for room:', err))
            .finally(() => {
                if (isMounted) setLoadingMessages(false)
            })

        // Join socket room
        const socket = getSocket()
        if (socket) {
            socket.emit('join-room', selectedRoomId)
        }

        return () => {
            isMounted = false
        }
    }, [selectedRoomId])

    // Global socket listener for new store messages
    useEffect(() => {
        const socket = getSocket()
        if (!socket) return

        const handleIncomingMessage = (msg: any) => {
            if (!msg || !msg.roomId) return

            // If it's for currently opened room, append it
            if (msg.roomId === selectedRoomId) {
                if (msg.senderRole === 'admin') return
                const msgKey = String(msg.clientMsgId || msg._id || '')
                setMessages(prev => {
                    if (msgKey && prev.some(m => String(m.clientMsgId || m._id || '') === msgKey)) return prev
                    return [...prev, msg]
                })
                scrollToBottom()
            }

            // If incoming is from a customer, play chime and notify
            if (msg.senderRole !== 'admin') {
                if (soundEnabled) playMessagePing()
                toast.custom((t) => (
                    <div 
                        onClick={() => {
                            selectRoom(msg.roomId)
                            toast.dismiss(t.id)
                        }}
                        className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-sm w-full bg-white shadow-2xl rounded-2xl pointer-events-auto flex ring-1 ring-black/5 p-3.5 border border-emerald-100 cursor-pointer hover:bg-emerald-50/50 transition`}
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700 shrink-0 font-black">
                                <MessageSquare size={18} />
                            </div>
                            <div className="overflow-hidden">
                                <p className="text-xs font-black text-gray-800 flex items-center gap-1.5">
                                    <span>{msg.senderName || 'Customer'}</span>
                                    <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-bold">New Message</span>
                                </p>
                                <p className="text-xs text-gray-600 truncate mt-0.5">{msg.text}</p>
                            </div>
                        </div>
                    </div>
                ), { duration: 4500, position: 'top-right' })
            }

            // Silently refresh conversations list so previews & unread badges update
            fetchConversations(true)
        }

        socket.on('send-message', handleIncomingMessage)
        socket.on('admin-store-message', handleIncomingMessage)

        return () => {
            socket.off('send-message', handleIncomingMessage)
            socket.off('admin-store-message', handleIncomingMessage)
        }
    }, [selectedRoomId, soundEnabled])

    // Mark single conversation as read
    const handleMarkAsRead = async (roomId?: string) => {
        const targetRoom = roomId || selectedRoomIdRef.current || selectedRoomId
        if (!targetRoom) return

        // Update local state immediately
        setConversations(prev => prev.map(c => {
            if (c.roomId === targetRoom) {
                return { ...c, unreadCount: 0 }
            }
            return c
        }))

        try {
            await axios.post('/api/admin/mark-read', { roomId: targetRoom })
            toast.success('Marked as read', { duration: 2000 })
        } catch (e) {
            console.error('Failed to mark read:', e)
        }
    }

    // Mark all conversations as read
    const handleMarkAllAsRead = async () => {
        setConversations(prev => prev.map(c => ({ ...c, unreadCount: 0 })))
        try {
            await axios.post('/api/admin/mark-read', { all: true })
            toast.success('All conversations marked as read', { duration: 2500 })
        } catch (e) {
            console.error('Failed to mark all read:', e)
        }
    }

    // Delete a single message from the active chat
    const handleDeleteSingleMessage = async (messageId: string) => {
        if (!confirm('Are you sure you want to delete this message?')) return
        try {
            await axios.delete('/api/chat/messages', { data: { messageId } })
            setMessages(prev => prev.filter(m => m._id !== messageId))
            toast.success('Message deleted', { duration: 2000 })
            fetchConversations(true)
        } catch (error) {
            console.error('Failed to delete message:', error)
            toast.error('Failed to delete message')
        }
    }

    // Delete entire conversation and all its messages
    const handleDeleteEntireChat = async (roomId: string) => {
        if (!confirm('Are you sure you want to delete this ENTIRE conversation? All messages will be permanently removed.')) return
        try {
            await axios.delete('/api/chat/messages', { data: { roomId } })
            toast.success('Conversation deleted', { duration: 2500 })
            selectedRoomIdRef.current = null
            setSelectedRoomId(null)
            setMessages([])
            setConversations(prev => prev.filter(c => c.roomId !== roomId))
            fetchConversations(true)
        } catch (error) {
            console.error('Failed to delete chat:', error)
            toast.error('Failed to delete conversation')
        }
    }

    // Ban or unban customer directly from chat center
    const handleToggleCustomerBan = async (customer: Customer) => {
        if (!customer?._id || customer._id === 'unknown') {
            toast.error("User ID not available for this conversation.")
            return
        }
        const isCurrentlyBanned = Boolean(customer.isBanned)

        if (isCurrentlyBanned) {
            if (!confirm(`Are you sure you want to UNBAN ${customer.name}? Their store access will be restored immediately.`)) return
            try {
                await axios.post('/api/admin/toggle-ban', {
                    userId: customer._id,
                    isBanned: false
                })
                setConversations(prev => prev.map(c => {
                    if (c.customer?._id === customer._id) {
                        return { ...c, customer: { ...c.customer, isBanned: false, banReason: "" } }
                    }
                    return c
                }))
                toast.success(`✅ ${customer.name} unbanned successfully!`)
            } catch (e: any) {
                toast.error(e.response?.data?.message || "Failed to unban user")
            }
        } else {
            const reason = prompt(`Enter reason for banning ${customer.name} (shown to them):`, "Violation of store conduct policies")
            if (reason === null) return
            const trimmedReason = reason.trim() || "Violation of store conduct policies"
            try {
                await axios.post('/api/admin/toggle-ban', {
                    userId: customer._id,
                    isBanned: true,
                    banReason: trimmedReason
                })
                setConversations(prev => prev.map(c => {
                    if (c.customer?._id === customer._id) {
                        return { ...c, customer: { ...c.customer, isBanned: true, banReason: trimmedReason } }
                    }
                    return c
                }))
                toast.error(`🚫 ${customer.name} has been banned from the store.`)
            } catch (e: any) {
                toast.error(e.response?.data?.message || "Failed to ban user")
            }
        }
    }

    // Send reply as Store Admin
    const handleSendReply = async (textToSend?: string) => {
        const text = (textToSend ?? replyText).trim()
        const activeRoomId = selectedRoomIdRef.current || selectedRoomId
        if (!text || !activeRoomId) return

        const clientMsgId = 'msg_' + Date.now() + '_' + Math.random().toString(36).slice(2, 9)
        const payload = {
            _id: clientMsgId,
            clientMsgId,
            roomId: activeRoomId,
            text,
            senderId: currentUser?._id || currentUser?.id || 'admin',
            senderName: currentUser?.name || 'Grocery Store Support',
            senderRole: 'admin',
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }

        // Optimistic UI update
        setMessages(prev => [...prev, payload])
        setReplyText('')
        setSending(true)
        scrollToBottom()

        // Clear unread badge locally for this room
        setConversations(prev => prev.map(c => {
            if (c.roomId === activeRoomId) {
                return {
                    ...c,
                    unreadCount: 0,
                    lastMessage: {
                        text,
                        time: payload.time,
                        senderRole: 'admin',
                        senderName: payload.senderName,
                        createdAt: new Date().toISOString()
                    }
                }
            }
            return c
        }))

        try {
            // Save to database
            const res = await axios.post('/api/chat/save', payload)
            if (res.data && res.data._id) {
                setMessages(prev => prev.map(m => (m._id === clientMsgId || m.clientMsgId === clientMsgId) ? { ...res.data, clientMsgId } : m))
            }

            // Emit via socket
            const socket = getSocket()
            if (socket) {
                socket.emit('send-message', res.data || payload)
            }

            toast.success('Reply sent to customer', { duration: 2000 })
        } catch (error) {
            console.error('Failed to send reply:', error)
            toast.error('Failed to deliver reply')
        } finally {
            setSending(false)
        }
    }

    // AI suggestion handler for Store Admin
    const fetchAiSuggestions = async () => {
        setAiLoading(true)
        try {
            const lastCustomerMsg = messages.filter(m => m.senderRole !== 'admin').at(-1)
            const res = await axios.post('/api/chat/ai-suggestions', {
                message: lastCustomerMsg?.text || 'Hello, I have an issue with my order',
                role: 'admin'
            })
            if (Array.isArray(res.data) && res.data.length > 0) {
                setSuggestions(res.data)
            } else {
                setSuggestions([
                    "Hello! We are looking into your order right now.",
                    "Your groceries are being packed fresh at Central Mart.",
                    "A delivery partner will be picking up your order shortly.",
                    "Please let us know if you need to modify or cancel your order."
                ])
            }
        } catch (e) {
            setSuggestions([
                "Hello! We are looking into your order right now.",
                "Your groceries are packed and ready for dispatch.",
                "How can we best assist you with your delivery today?"
            ])
        } finally {
            setAiLoading(false)
        }
    }

    // Store quick replies
    const adminQuickReplies = [
        "👋 Hello! Grocery Support here, how can I help you?",
        "🏪 We are currently hand-packing your grocery items.",
        "🛵 Your order is ready and being assigned to a rider.",
        "✓ I checked with our inventory and confirmed this item is available.",
        "💳 Your refund request has been received and initiated.",
        "🙏 Thank you for shopping with Grocery Central Mart!"
    ]

    // Filter conversations
    const filteredConversations = conversations.filter(c => {
        const query = searchQuery.toLowerCase()
        const matchesQuery = 
            (c.customer?.name || '').toLowerCase().includes(query) ||
            (c.customer?.mobile || '').includes(query) ||
            (c.customer?.email || '').toLowerCase().includes(query) ||
            (c.lastMessage?.text || '').toLowerCase().includes(query) ||
            (c.order?._id || '').includes(query)

        if (!matchesQuery) return false

        if (filterTab === 'unread') return c.unreadCount > 0
        if (filterTab === 'orders') return Boolean(c.order)
        return true
    })

    const totalUnread = conversations.reduce((sum, c) => sum + (c.unreadCount || 0), 0)

    return (
        <div className="min-h-screen bg-[#f8fafc] pt-20 pb-12">
            <div className="w-[96%] max-w-7xl mx-auto space-y-4">
                {/* Top Nav & Breadcrumb */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-gray-100 shadow-xs">
                    <div className="flex items-center gap-3">
                        <Link 
                            href="/" 
                            className="w-9 h-9 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 transition"
                            title="Back to Dashboard"
                        >
                            <ArrowLeft size={18} />
                        </Link>
                        <div>
                            <h1 className="text-xl sm:text-2xl font-black text-gray-800 flex items-center gap-2">
                                <MessageSquare className="text-green-600" size={24} />
                                Store Customer Support
                                {totalUnread > 0 && (
                                    <span className="bg-red-500 text-white text-xs font-black px-2.5 py-0.5 rounded-full animate-pulse">
                                        {totalUnread} Unread
                                    </span>
                                )}
                            </h1>
                            <p className="text-xs text-gray-500">Live chat inbox for customer inquiries and grocery order support</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => setSoundEnabled(prev => !prev)}
                            className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                                soundEnabled ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-gray-50 text-gray-500 border-gray-200'
                            }`}
                            title="Play sound notification when customer sends message"
                        >
                            {soundEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />}
                            <span>{soundEnabled ? 'Sound Alert: ON' : 'Sound: Muted'}</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => fetchConversations()}
                            className="px-3 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                            title="Refresh conversations"
                        >
                            <RefreshCw size={14} className={loadingConversations ? 'animate-spin' : ''} />
                            <span className="hidden sm:inline">Refresh</span>
                        </button>
                    </div>
                </div>

                {/* 2-Pane Chat Interface */}
                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden grid grid-cols-1 lg:grid-cols-12 h-[calc(100vh-170px)] min-h-[580px] max-h-[880px]">
                    
                    {/* LEFT PANE: Conversations List */}
                    <div className="lg:col-span-4 border-r border-gray-100 flex flex-col h-full min-h-0 bg-gray-50/40 overflow-hidden">
                        {/* Search & Tabs */}
                        <div className="p-3.5 border-b border-gray-100 space-y-2.5 bg-white">
                            <div className="relative">
                                <Search className="absolute left-3 top-2.5 text-gray-400 w-4 h-4" />
                                <input
                                    type="text"
                                    placeholder="Search customer, phone, text..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-9 pr-4 py-2 bg-gray-50 rounded-xl border border-gray-200 focus:ring-2 focus:ring-green-500 outline-none text-xs font-medium"
                                />
                                {searchQuery && (
                                    <button 
                                        onClick={() => setSearchQuery('')}
                                        className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                                    >
                                        <X size={14} />
                                    </button>
                                )}
                            </div>

                            {/* Filter Tabs */}
                            <div className="flex bg-gray-100 p-1 rounded-xl text-[11px] font-bold">
                                <button
                                    onClick={() => setFilterTab('all')}
                                    className={`flex-1 py-1 rounded-lg transition ${
                                        filterTab === 'all' ? 'bg-white text-gray-800 shadow-xs' : 'text-gray-500 hover:text-gray-800'
                                    }`}
                                >
                                    All ({conversations.length})
                                </button>
                                <button
                                    onClick={() => setFilterTab('unread')}
                                    className={`flex-1 py-1 rounded-lg transition flex items-center justify-center gap-1 ${
                                        filterTab === 'unread' ? 'bg-white text-emerald-700 shadow-xs' : 'text-gray-500 hover:text-gray-800'
                                    }`}
                                >
                                    <span>Unread</span>
                                    {totalUnread > 0 && (
                                        <span className="bg-red-500 text-white text-[9px] px-1.5 rounded-full font-black">
                                            {totalUnread}
                                        </span>
                                    )}
                                </button>
                                <button
                                    onClick={() => setFilterTab('orders')}
                                    className={`flex-1 py-1 rounded-lg transition ${
                                        filterTab === 'orders' ? 'bg-white text-gray-800 shadow-xs' : 'text-gray-500 hover:text-gray-800'
                                    }`}
                                >
                                    Orders
                                </button>
                            </div>

                            {totalUnread > 0 && (
                                <div className="flex justify-end pt-0.5">
                                    <button
                                        type="button"
                                        onClick={handleMarkAllAsRead}
                                        className="text-[10px] font-bold text-emerald-700 hover:text-emerald-900 flex items-center gap-1 cursor-pointer"
                                    >
                                        <CheckCheck size={12} /> Mark all as read
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Conversations Scrollable List */}
                        <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
                            {loadingConversations ? (
                                <div className="p-8 text-center text-gray-400 text-xs space-y-2">
                                    <RefreshCw size={20} className="animate-spin mx-auto text-emerald-600" />
                                    <p>Loading conversations...</p>
                                </div>
                            ) : filteredConversations.length === 0 ? (
                                <div className="p-8 text-center text-gray-400 text-xs space-y-2">
                                    <MessageSquare size={28} className="mx-auto text-gray-300" />
                                    <p className="font-bold text-gray-600">No conversations found</p>
                                    <p className="text-[11px]">When customers message the store, their inquiries will show up here.</p>
                                </div>
                            ) : (
                                filteredConversations.map((conv) => {
                                    const isSelected = conv.roomId === selectedRoomId
                                    const isCustomerMsg = conv.lastMessage.senderRole !== 'admin'

                                    return (
                                        <div
                                            key={conv.roomId}
                                            onClick={() => selectRoom(conv.roomId)}
                                            className={`p-3.5 transition cursor-pointer relative flex items-start gap-3 select-none ${
                                                isSelected 
                                                    ? 'bg-emerald-50/70 border-l-4 border-emerald-600' 
                                                    : 'hover:bg-white bg-white/40'
                                            }`}
                                        >
                                            {/* Avatar */}
                                            <div className="w-10 h-10 rounded-2xl bg-emerald-100 flex items-center justify-center shrink-0 text-emerald-700 font-black relative overflow-hidden">
                                                {conv.customer?.image ? (
                                                    <Image 
                                                        src={conv.customer.image} 
                                                        alt={conv.customer.name || 'User'} 
                                                        width={40} 
                                                        height={40} 
                                                        className="w-full h-full object-cover" 
                                                    />
                                                ) : (
                                                    <span>{(conv.customer?.name || 'C')[0].toUpperCase()}</span>
                                                )}
                                                {conv.unreadCount > 0 && (
                                                    <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-red-500 rounded-full border-2 border-white" />
                                                )}
                                            </div>

                                            {/* Details */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between gap-1">
                                                    <h4 className={`text-xs font-black truncate flex items-center gap-1.5 ${isSelected ? 'text-emerald-950' : 'text-gray-800'}`}>
                                                        <span>{conv.customer?.name || 'Customer'}</span>
                                                        {conv.customer?.isBanned && (
                                                            <span className="text-[9px] font-black bg-rose-600 text-white px-1.5 py-0.5 rounded-full shrink-0">
                                                                BANNED
                                                            </span>
                                                        )}
                                                    </h4>
                                                    <span className="text-[10px] text-gray-400 shrink-0 font-medium">
                                                        {conv.lastMessage.time}
                                                    </span>
                                                </div>

                                                {/* Phone / Subtitle */}
                                                <p className="text-[11px] text-gray-400 truncate">
                                                    {conv.customer?.mobile || conv.customer?.email || 'Store Visitor'}
                                                </p>

                                                {/* Last Message Snippet */}
                                                <p className={`text-xs truncate mt-0.5 ${
                                                    conv.unreadCount > 0 ? 'font-bold text-gray-800' : 'text-gray-500'
                                                }`}>
                                                    {!isCustomerMsg && <span className="text-emerald-600 font-semibold">You: </span>}
                                                    {conv.lastMessage.text}
                                                </p>

                                                {/* Badges Row */}
                                                <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                                                    {conv.order && (
                                                        <span className="bg-amber-100 text-amber-800 text-[9px] font-black px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
                                                            <Package size={10} /> Order #{conv.order._id.slice(-6).toUpperCase()}
                                                        </span>
                                                    )}
                                                    {conv.unreadCount > 0 && (
                                                        <span className="bg-red-500 text-white text-[9px] font-black px-2 py-0.2 rounded-full">
                                                            {conv.unreadCount} new
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })
                            )}
                        </div>
                    </div>

                    {/* RIGHT PANE: Chat View */}
                    <div className="lg:col-span-8 flex flex-col h-full min-h-0 bg-white overflow-hidden relative">
                        {selectedConversation ? (
                            <>
                                {/* Chat Header */}
                                <div className="p-3.5 sm:px-5 border-b border-gray-100 flex items-center justify-between bg-white shrink-0">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-green-600 text-white flex items-center justify-center font-black shadow-sm text-sm">
                                            {(selectedConversation.customer?.name || 'C')[0].toUpperCase()}
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-black text-gray-800 flex items-center gap-2">
                                                <span>{selectedConversation.customer?.name || 'Customer'}</span>
                                                {selectedConversation.customer?.isBanned ? (
                                                    <span className="text-[10px] font-black bg-rose-600 text-white px-2 py-0.5 rounded-full flex items-center gap-1 shadow-xs">
                                                        <Ban size={11} /> BANNED
                                                    </span>
                                                ) : (
                                                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                                                )}
                                            </h3>
                                            <p className="text-xs text-gray-500 flex items-center gap-2">
                                                <span>{selectedConversation.customer?.mobile || 'No Phone'}</span>
                                                {selectedConversation.customer?.email && (
                                                    <>
                                                        <span>•</span>
                                                        <span className="truncate max-w-[150px] sm:max-w-none">{selectedConversation.customer.email}</span>
                                                    </>
                                                )}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex items-center gap-2 flex-wrap justify-end">
                                        {/* Ban / Unban Account Button */}
                                        {selectedConversation.customer?._id && selectedConversation.customer._id !== 'unknown' && (
                                            selectedConversation.customer?.isBanned ? (
                                                <button
                                                    type="button"
                                                    onClick={() => handleToggleCustomerBan(selectedConversation.customer)}
                                                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl transition flex items-center gap-1.5 cursor-pointer active:scale-95 shadow-sm"
                                                    title="Unban customer and restore their platform access"
                                                >
                                                    <CheckCircle2 size={13} />
                                                    <span>Unban User</span>
                                                </button>
                                            ) : (
                                                <button
                                                    type="button"
                                                    onClick={() => handleToggleCustomerBan(selectedConversation.customer)}
                                                    className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl transition flex items-center gap-1.5 border border-rose-200 cursor-pointer active:scale-95"
                                                    title="Ban customer from store access"
                                                >
                                                    <Ban size={13} />
                                                    <span className="hidden sm:inline">Ban User</span>
                                                </button>
                                            )
                                        )}

                                        {/* Mark as Read Button */}
                                        <button
                                            type="button"
                                            onClick={() => handleMarkAsRead(selectedConversation.roomId)}
                                            className={`px-3 py-1.5 font-bold text-xs rounded-xl transition flex items-center gap-1.5 border cursor-pointer active:scale-95 ${
                                                selectedConversation.unreadCount > 0
                                                    ? 'bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-300 shadow-xs'
                                                    : 'bg-gray-50 hover:bg-gray-100 text-gray-600 border-gray-200'
                                            }`}
                                            title="Mark this customer conversation as read"
                                        >
                                            <CheckCheck size={14} className={selectedConversation.unreadCount > 0 ? 'text-amber-700' : 'text-emerald-600'} />
                                            <span>{selectedConversation.unreadCount > 0 ? 'Mark Read' : 'Read'}</span>
                                        </button>

                                        {/* Delete Entire Chat */}
                                        <button
                                            type="button"
                                            onClick={() => handleDeleteEntireChat(selectedConversation.roomId)}
                                            className="px-2.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 font-bold text-xs rounded-xl transition flex items-center gap-1.5 border border-red-200 cursor-pointer active:scale-95"
                                            title="Delete entire chat history with this customer"
                                        >
                                            <Trash2 size={13} />
                                            <span className="hidden sm:inline">Delete Chat</span>
                                        </button>

                                        {/* Close Chat Window */}
                                        <button
                                            type="button"
                                            onClick={() => {
                                                selectedRoomIdRef.current = null
                                                setSelectedRoomId(null)
                                            }}
                                            className="px-2.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl transition flex items-center gap-1.5 cursor-pointer active:scale-95"
                                            title="Close active chat window"
                                        >
                                            <X size={14} />
                                            <span className="hidden sm:inline">Close</span>
                                        </button>

                                        {selectedConversation.customer?.mobile && (
                                            <a
                                                href={`tel:${selectedConversation.customer.mobile}`}
                                                className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs rounded-xl transition flex items-center gap-1.5 border border-emerald-200"
                                            >
                                                <Phone size={14} />
                                                <span className="hidden sm:inline">Call Customer</span>
                                            </a>
                                        )}
                                        {selectedConversation.order && (
                                            <Link
                                                href={`/admin/manage-orders`}
                                                className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl transition flex items-center gap-1.5"
                                            >
                                                <Package size={14} />
                                                <span className="hidden sm:inline">View Order #{selectedConversation.order._id.slice(-6).toUpperCase()}</span>
                                            </Link>
                                        )}
                                    </div>
                                </div>

                                {/* Suspended Account Warning Banner */}
                                {selectedConversation.customer?.isBanned && (
                                    <div className="bg-rose-50 border-b border-rose-200 px-4 py-2.5 flex items-center justify-between text-xs text-rose-900 shrink-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="font-black px-2 py-0.5 rounded-full bg-rose-600 text-white text-[10px]">
                                                RESTRICTED / BANNED
                                            </span>
                                            <span className="font-bold">
                                                Reason: {selectedConversation.customer.banReason || 'Store policy violation'}
                                            </span>
                                        </div>
                                        <span className="text-[11px] text-rose-600 font-semibold hidden md:inline">
                                            User is on the appeal screen and can read & reply to your messages
                                        </span>
                                    </div>
                                )}

                                {/* Order summary ribbon if order related */}
                                {selectedConversation.order && (
                                    <div className="bg-amber-50/70 border-b border-amber-100 px-4 py-2 flex items-center justify-between text-xs text-amber-900 font-medium shrink-0">
                                        <div className="flex items-center gap-2">
                                            <Package size={14} className="text-amber-600" />
                                            <span>
                                                Order <b>#{selectedConversation.order._id.slice(-6).toUpperCase()}</b> • Status: <b className="capitalize">{selectedConversation.order.status}</b>
                                            </span>
                                        </div>
                                        <span className="font-black text-amber-950">
                                            Total: ₹{selectedConversation.order.totalAmount}
                                        </span>
                                    </div>
                                )}

                                {/* Messages Stream */}
                                <div 
                                    ref={chatScrollRef}
                                    className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-5 space-y-3 bg-[#fafafa]/50 scroll-smooth"
                                >
                                    {loadingMessages ? (
                                        <div className="flex items-center justify-center h-full">
                                            <RefreshCw size={24} className="animate-spin text-emerald-600" />
                                        </div>
                                    ) : messages.length === 0 ? (
                                        <div className="text-center py-12 text-gray-400 space-y-2">
                                            <MessageSquare size={36} className="mx-auto text-gray-300" />
                                            <p className="font-bold text-gray-600">No messages yet in this conversation</p>
                                            <p className="text-xs">Type a message below to greet the customer.</p>
                                        </div>
                                    ) : (
                                        messages.map((m, i) => {
                                            const isAdmin = m.senderRole === 'admin'
                                            return (
                                                <div 
                                                    key={m._id || i}
                                                    className={`group flex flex-col ${isAdmin ? 'items-end' : 'items-start'}`}
                                                >
                                                    <span className="text-[10px] text-gray-400 px-1 mb-0.5 font-medium">
                                                        {isAdmin ? 'Store Support' : (m.senderName || 'Customer')} • {m.time}
                                                    </span>
                                                    <div className={`relative flex items-center gap-1.5 ${isAdmin ? 'flex-row-reverse' : 'flex-row'}`}>
                                                        <div className={`max-w-[85%] sm:max-w-[70%] px-4 py-2.5 rounded-2xl text-xs leading-relaxed shadow-xs ${
                                                            isAdmin 
                                                                ? 'bg-emerald-600 text-white rounded-tr-xs font-medium' 
                                                                : 'bg-white text-gray-800 border border-gray-100 rounded-tl-xs'
                                                        }`}>
                                                            {m.text}
                                                        </div>
                                                        {m._id && !String(m._id).startsWith('temp_') && (
                                                            <button
                                                                type="button"
                                                                onClick={() => handleDeleteSingleMessage(m._id)}
                                                                className="opacity-0 group-hover:opacity-100 transition p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg cursor-pointer shrink-0"
                                                                title="Delete this message"
                                                            >
                                                                <Trash2 size={12} />
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            )
                                        })
                                    )}
                                </div>

                                {/* Smart Quick Replies & AI Bar */}
                                <div className="p-3 bg-white border-t border-gray-100 space-y-2 shrink-0 sticky bottom-0 z-10">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                                            Store Quick Replies
                                        </span>
                                        <button
                                            type="button"
                                            onClick={fetchAiSuggestions}
                                            disabled={aiLoading}
                                            className="inline-flex items-center gap-1 text-[11px] font-extrabold text-purple-600 bg-purple-50 hover:bg-purple-100 px-2.5 py-0.5 rounded-full transition cursor-pointer"
                                        >
                                            <Sparkles size={12} className={aiLoading ? 'animate-spin' : ''} />
                                            <span>{aiLoading ? 'Thinking...' : 'AI Suggestions'}</span>
                                        </button>
                                    </div>

                                    {/* AI suggestions if present */}
                                    {suggestions.length > 0 && (
                                        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                                            {suggestions.map((s, idx) => (
                                                <button
                                                    key={idx}
                                                    type="button"
                                                    onClick={() => handleSendReply(s)}
                                                    className="bg-purple-100/80 hover:bg-purple-200 text-purple-900 border border-purple-200 text-[11px] font-semibold px-2.5 py-1 rounded-xl shrink-0 transition cursor-pointer"
                                                >
                                                    ✨ {s}
                                                </button>
                                            ))}
                                        </div>
                                    )}

                                    {/* Pre-set chips */}
                                    <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                                        {adminQuickReplies.map((r, idx) => (
                                            <button
                                                key={idx}
                                                type="button"
                                                onClick={() => handleSendReply(r)}
                                                className="bg-gray-100 hover:bg-emerald-50 hover:text-emerald-800 text-gray-600 text-[11px] font-medium px-2.5 py-1 rounded-xl shrink-0 transition cursor-pointer border border-transparent hover:border-emerald-200"
                                            >
                                                {r}
                                            </button>
                                        ))}
                                    </div>

                                    {/* Message Input Box */}
                                    <form 
                                        onSubmit={(e) => {
                                            e.preventDefault()
                                            handleSendReply()
                                        }}
                                        className="flex items-center gap-2 pt-1"
                                    >
                                        <input
                                            type="text"
                                            value={replyText}
                                            onChange={(e) => setReplyText(e.target.value)}
                                            placeholder={`Reply to ${selectedConversation.customer?.name || 'Customer'} as Grocery Store...`}
                                            className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-2xl text-xs font-medium focus:ring-2 focus:ring-green-500 outline-none"
                                        />
                                        <button
                                            type="submit"
                                            disabled={!replyText.trim() || sending}
                                            className="w-10 h-10 rounded-2xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white flex items-center justify-center transition shrink-0 cursor-pointer shadow-sm active:scale-95"
                                        >
                                            <Send size={16} />
                                        </button>
                                    </form>
                                </div>
                            </>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-gray-400 space-y-3">
                                <div className="w-16 h-16 rounded-3xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                                    <MessageSquare size={32} />
                                </div>
                                <h3 className="text-base font-black text-gray-700">No Chat Selected</h3>
                                <p className="text-xs text-gray-400 max-w-sm">
                                    Select an inquiry from the customer conversation list on the left to review messages and reply in real time.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
