'use client'

import React, { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { X, Send, Sparkles, Loader2, Bot, Phone, KeyRound, Store, Truck, User } from 'lucide-react'
import { getSocket } from '@/lib/socket'
import axios from 'axios'
import toast from 'react-hot-toast'

export interface ChatModalProps {
    isOpen: boolean
    onClose: () => void
    roomId: string
    title: string
    subtitle?: string
    partnerRole: 'deliveryBoy' | 'admin' | 'user'
    partnerName?: string
    partnerPhone?: string
    orderId?: string
    currentUser: {
        _id?: string
        name?: string
        role?: string
    }
    deliveryOtp?: string
    onMessagesRead?: () => void
}

export default function ChatModal({
    isOpen,
    onClose,
    roomId,
    title,
    subtitle,
    partnerRole,
    partnerName,
    partnerPhone,
    orderId,
    currentUser,
    deliveryOtp,
    onMessagesRead
}: ChatModalProps) {
    const [messages, setMessages] = useState<any[]>([])
    const [newMessage, setNewMessage] = useState('')
    const [loadingMessages, setLoadingMessages] = useState(false)
    const [aiLoading, setAiLoading] = useState(false)
    const [suggestions, setSuggestions] = useState<string[]>([])
    const [isSending, setIsSending] = useState(false)
    const isSendingRef = useRef(false)
    const processedMsgIds = useRef<Set<string>>(new Set())
    const chatScrollRef = useRef<HTMLDivElement>(null)

    // Scroll to bottom
    const scrollToBottom = () => {
        setTimeout(() => {
            if (chatScrollRef.current) {
                chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight
            }
        }, 80)
    }

    // Default quick replies based on role & context
    const getQuickReplies = (): string[] => {
        if (currentUser?.role === 'deliveryBoy') {
            return [
                "🛵 I am 2 mins away with your groceries",
                "🔔 Reached outside your doorstep! Please come out",
                "🔑 Please keep your 4-digit OTP ready",
                "📞 Calling your phone now",
                "🚦 In traffic, will reach shortly"
            ]
        }
        if (partnerRole === 'admin') {
            return [
                "🏪 Is my grocery order packed?",
                "🍎 Can I replace or add an item?",
                "⏰ When will my order be dispatched?",
                "💳 Payment / Refund inquiry",
                "📦 Everything looks good, thank you!"
            ]
        }
        if (currentUser?.role === 'admin') {
            return [
                "👋 Hello! Grocery Central Mart at your service",
                "🏪 We are hand-packing fresh groceries for you now",
                "🛵 Your order is ready and being assigned to a rider",
                "✓ Checking with the store inventory right now",
                "🙏 Glad to assist you with your order!"
            ]
        }
        // Customer chatting with Delivery Boy
        return [
            "🔔 Please ring the bell when you arrive",
            "🏢 You can leave it at the security / reception",
            "🏃 Coming down in 1 minute",
            "📞 Call me if you cannot find the address",
            "🔑 I have my OTP ready"
        ]
    }

    // Load messages from DB on open
    useEffect(() => {
        if (!isOpen || !roomId) return

        let isSubscribed = true
        setLoadingMessages(true)

        axios.post('/api/chat/messages', { roomId })
            .then(res => {
                if (isSubscribed && Array.isArray(res.data)) {
                    // Populate processedMsgIds with loaded message IDs
                    res.data.forEach((m: any) => {
                        if (m._id) processedMsgIds.current.add(String(m._id))
                        if (m.clientMsgId) processedMsgIds.current.add(String(m.clientMsgId))
                    })
                    setMessages(res.data)
                    scrollToBottom()
                }
            })
            .catch(err => console.error('Failed to load chat messages:', err))
            .finally(() => {
                if (isSubscribed) setLoadingMessages(false)
            })

        // Mark incoming unread messages as read for this room
        if (roomId && partnerRole) {
            axios.post('/api/chat/unread', { roomId, senderRole: partnerRole }).catch(() => {})
            onMessagesRead?.()
        }

        // Join socket room
        const socket = getSocket()
        if (socket) {
            socket.emit('join-room', roomId)
            const cleanId = roomId.replace(/^order_/, '')
            if (roomId.startsWith('order_')) {
                socket.emit('join-room', cleanId)
            } else if (!roomId.startsWith('store_')) {
                socket.emit('join-room', `order_${cleanId}`)
            }

            const handleIncoming = (msg: any) => {
                if (!msg) return

                // 1. Ignore own echoed messages - sender already rendered them optimistically
                const myId = String(currentUser?._id || '')
                if (msg.senderId && myId && String(msg.senderId) === myId) {
                    return
                }

                const msgRoom = String(msg?.roomId || '')
                const msgClean = msgRoom.replace(/^order_/, '')
                const currentClean = roomId.replace(/^order_/, '')

                const isMatch = msgRoom === String(roomId) || 
                                (msgClean && msgClean === currentClean) ||
                                (msg?.orderId && String(msg.orderId) === currentClean)

                if (isMatch) {
                    const msgKey = String(msg.clientMsgId || msg._id || '')
                    if (msgKey && processedMsgIds.current.has(msgKey)) return
                    if (msgKey) processedMsgIds.current.add(msgKey)

                    setMessages(prev => {
                        // Prevent identical message instance from being duplicated
                        if (msgKey && prev.some(m => String(m.clientMsgId || m._id || '') === msgKey)) return prev
                        return [...prev, msg]
                    })
                    scrollToBottom()
                    // Immediately mark as read since user is actively viewing this room
                    if (partnerRole) {
                        axios.post('/api/chat/unread', { roomId, senderRole: partnerRole }).catch(() => {})
                        onMessagesRead?.()
                    }
                }
            }

            socket.on('send-message', handleIncoming)
            return () => {
                isSubscribed = false
                socket.off('send-message', handleIncoming)
            }
        }

        return () => {
            isSubscribed = false
        }
    }, [isOpen, roomId, partnerRole])

    useEffect(() => {
        scrollToBottom()
    }, [messages])

    // Send a message
    const handleSend = async (textToSend?: string) => {
        if (isSendingRef.current) return
        const text = (textToSend ?? newMessage).trim()
        if (!text) return

        isSendingRef.current = true
        setIsSending(true)

        const clientMsgId = 'msg_' + Date.now() + '_' + Math.random().toString(36).slice(2, 9)
        const formattedTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

        const payload = {
            _id: clientMsgId,
            clientMsgId,
            roomId,
            text,
            senderId: currentUser?._id,
            senderName: currentUser?.name || 'User',
            senderRole: currentUser?.role || 'user',
            time: formattedTime
        }

        // Register clientMsgId so echoes of this exact message are dropped
        processedMsgIds.current.add(clientMsgId)

        // Optimistic update
        setMessages(prev => [...prev, payload])
        setNewMessage('')
        scrollToBottom()

        try {
            // Always persist to database
            await axios.post('/api/chat/save', payload)

            // Emit to real-time socket
            const socket = getSocket()
            if (socket) {
                socket.emit('send-message', payload)
            }
        } catch (e) {
            console.error('Failed to send message:', e)
            toast.error('Failed to deliver message')
        } finally {
            setTimeout(() => {
                isSendingRef.current = false
                setIsSending(false)
            }, 250)
        }
    }

    // AI suggestion handler
    const fetchAiSuggestions = async () => {
        setAiLoading(true)
        try {
            const lastMsg = messages.filter(m => String(m.senderId) !== String(currentUser?._id)).at(-1)
            const res = await axios.post('/api/chat/ai-suggestions', {
                message: lastMsg?.text || 'Hello, I have a question about delivery',
                role: currentUser?.role === 'deliveryBoy' ? 'delivery_boy' : 'user'
            })
            if (Array.isArray(res.data) && res.data.length > 0) {
                setSuggestions(res.data)
            } else {
                setSuggestions(getQuickReplies().slice(0, 3))
            }
        } catch (e) {
            setSuggestions(getQuickReplies().slice(0, 3))
        } finally {
            setAiLoading(false)
        }
    }

    if (!isOpen) return null

    const partnerIcon = partnerRole === 'admin'
        ? <Store size={20} className="text-amber-700" />
        : partnerRole === 'deliveryBoy'
        ? <Truck size={20} className="text-blue-700" />
        : <User size={20} className="text-green-700" />

    const partnerBg = partnerRole === 'admin'
        ? 'bg-amber-100'
        : partnerRole === 'deliveryBoy'
        ? 'bg-blue-100'
        : 'bg-green-100'

    return (
        <AnimatePresence>
            <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-[9999] flex items-center justify-center p-3 sm:p-4">
                <motion.div
                    initial={{ scale: 0.94, opacity: 0, y: 10 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.94, opacity: 0, y: 10 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 350 }}
                    className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-gray-100 h-[88vh] max-h-[640px]"
                >
                    {/* Header */}
                    <div className="p-4 bg-gradient-to-r from-gray-900 via-gray-800 to-green-900 text-white flex items-center justify-between shadow-md shrink-0">
                        <div className="flex items-center gap-3">
                            <div className={`w-11 h-11 rounded-2xl ${partnerBg} flex items-center justify-center shrink-0 border border-white/20`}>
                                {partnerIcon}
                            </div>
                            <div>
                                <h3 className="font-black text-sm sm:text-base flex items-center gap-2">
                                    <span>{title}</span>
                                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                                </h3>
                                <p className="text-[11px] text-gray-300 line-clamp-1">
                                    {subtitle || (partnerRole === 'admin' ? 'Central Mart Store Support' : partnerRole === 'deliveryBoy' ? 'Delivery Partner' : 'Customer')}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            {partnerPhone && (
                                <a
                                    href={`tel:${partnerPhone}`}
                                    className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
                                    title={`Call ${partnerName || 'Partner'}`}
                                >
                                    <Phone size={16} />
                                </a>
                            )}
                            <button
                                onClick={onClose}
                                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition cursor-pointer"
                            >
                                <X size={18} />
                            </button>
                        </div>
                    </div>

                    {/* Delivery OTP Notice Banner (STRICTLY for CUSTOMER only, never for delivery rider) */}
                    {deliveryOtp && currentUser?.role === "user" && (
                        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 flex items-center justify-between text-xs shrink-0">
                            <span className="font-bold text-amber-900 flex items-center gap-1.5">
                                <KeyRound size={14} className="text-amber-600" />
                                <span>Your Delivery OTP (Share with rider upon arrival):</span>
                            </span>
                            <span className="font-mono font-black text-emerald-700 bg-white px-3 py-0.5 rounded-lg border border-amber-300 tracking-widest text-sm">
                                {deliveryOtp}
                            </span>
                        </div>
                    )}

                    {/* Chat Messages Body */}
                    <div
                        ref={chatScrollRef}
                        className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#f8fafc]"
                    >
                        {loadingMessages ? (
                            <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-2">
                                <Loader2 size={24} className="animate-spin text-green-600" />
                                <span className="text-xs font-semibold">Connecting to conversation...</span>
                            </div>
                        ) : messages.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-center p-6 space-y-2 text-gray-400">
                                <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center text-gray-400">
                                    <Bot size={24} />
                                </div>
                                <p className="font-bold text-gray-700 text-sm">Start your conversation</p>
                                <p className="text-xs text-gray-400 max-w-xs">
                                    Send a quick message below or tap one of the suggested replies to coordinate in real time.
                                </p>
                            </div>
                        ) : (
                            messages.map((msg, idx) => {
                                const isMe = String(msg.senderId) === String(currentUser?._id)
                                return (
                                    <motion.div
                                        key={msg._id || idx}
                                        initial={{ opacity: 0, y: 8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                                    >
                                        {!isMe && msg.senderName && (
                                            <span className="text-[10px] font-bold text-gray-500 mb-0.5 ml-1">
                                                {msg.senderName}
                                                {msg.senderRole === 'admin' ? ' (Store)' : msg.senderRole === 'deliveryBoy' ? ' (Rider)' : ''}
                                            </span>
                                        )}
                                        <div
                                            className={`max-w-[82%] px-4 py-2.5 rounded-2xl text-xs sm:text-sm shadow-xs ${
                                                isMe
                                                    ? 'bg-green-600 text-white rounded-br-none font-medium'
                                                    : 'bg-white text-gray-800 border border-gray-200 rounded-bl-none font-medium'
                                            }`}
                                        >
                                            <p className="leading-relaxed whitespace-pre-wrap break-words">{msg.text}</p>
                                            <p className={`text-[9px] mt-1 text-right font-medium ${isMe ? 'text-green-100' : 'text-gray-400'}`}>
                                                {msg.time || ''}
                                            </p>
                                        </div>
                                    </motion.div>
                                )
                            })
                        )}
                    </div>

                    {/* Quick Replies & AI Suggestions Strip */}
                    <div className="bg-white border-t border-gray-100 px-3 py-2 shrink-0">
                        <div className="flex items-center justify-between mb-1.5">
                            <span className="text-[10px] font-black uppercase tracking-wider text-gray-400">Quick Replies</span>
                            <button
                                type="button"
                                onClick={fetchAiSuggestions}
                                disabled={aiLoading}
                                className="text-[10px] font-extrabold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 px-2 py-0.5 rounded-lg flex items-center gap-1 transition cursor-pointer"
                            >
                                <Sparkles size={11} className={aiLoading ? 'animate-spin' : ''} />
                                <span>{aiLoading ? 'Thinking...' : 'AI Suggest'}</span>
                            </button>
                        </div>

                        <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                            {(suggestions.length > 0 ? suggestions : getQuickReplies()).map((chip, i) => (
                                <button
                                    key={i}
                                    type="button"
                                    disabled={isSending}
                                    onClick={() => handleSend(chip)}
                                    className="whitespace-nowrap text-[11px] font-semibold bg-gray-50 hover:bg-green-50 hover:text-green-700 hover:border-green-300 disabled:opacity-50 disabled:pointer-events-none text-gray-700 px-2.5 py-1 rounded-xl border border-gray-200 transition cursor-pointer shrink-0 active:scale-95"
                                >
                                    {chip}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Text Input Footer */}
                    <form
                        onSubmit={(e) => {
                            e.preventDefault()
                            handleSend()
                        }}
                        className="p-3 bg-white border-t border-gray-100 flex items-center gap-2 shrink-0"
                    >
                        <input
                            type="text"
                            placeholder="Type your message..."
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            className="flex-1 bg-gray-100 text-gray-800 text-xs sm:text-sm px-4 py-2.5 rounded-2xl outline-none focus:ring-2 focus:ring-green-500 transition"
                        />
                        <button
                            type="submit"
                            disabled={!newMessage.trim() || isSending}
                            className="w-10 h-10 rounded-2xl bg-green-600 hover:bg-green-700 disabled:bg-gray-200 text-white flex items-center justify-center transition cursor-pointer shrink-0 shadow-sm active:scale-95"
                        >
                            <Send size={16} />
                        </button>
                    </form>
                </motion.div>
            </div>
        </AnimatePresence>
    )
}
