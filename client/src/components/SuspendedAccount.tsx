'use client'

import React, { useEffect, useRef, useState } from 'react'
import { signOut } from 'next-auth/react'
import axios from 'axios'
import { 
    AlertTriangle, Bot, CheckCircle2, Clock, LogOut, 
    MessageSquare, RefreshCw, Send, ShieldAlert, Sparkles, Store 
} from 'lucide-react'
import { getSocket } from '@/lib/socket'
import toast from 'react-hot-toast'
import BrandLogo from './BrandLogo'
import { useRouter } from 'next/navigation'

interface SuspendedAccountProps {
    user: {
        _id: string
        name: string
        email: string
        role: string
        mobile?: string
        isBanned?: boolean
        banReason?: string
        bannedAt?: string | Date
    }
}

export default function SuspendedAccount({ user }: SuspendedAccountProps) {
    const router = useRouter()
    const [messages, setMessages] = useState<any[]>([])
    const [loadingMessages, setLoadingMessages] = useState(true)
    const [appealText, setAppealText] = useState('')
    const [sending, setSending] = useState(false)
    const [unbannedAlert, setUnbannedAlert] = useState(false)
    const chatScrollRef = useRef<HTMLDivElement>(null)

    const roomId = `store_user_${user._id}`

    // Pleasant dual chime when store admin replies
    const playChime = () => {
        try {
            const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
            if (!AudioCtx) return
            const ctx = new AudioCtx()
            const osc = ctx.createOscillator()
            const gain = ctx.createGain()
            osc.connect(gain)
            gain.connect(ctx.destination)
            osc.type = "sine"
            osc.frequency.setValueAtTime(659.25, ctx.currentTime)
            osc.frequency.setValueAtTime(880, ctx.currentTime + 0.12)
            gain.gain.setValueAtTime(0.25, ctx.currentTime)
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6)
            osc.start()
            osc.stop(ctx.currentTime + 0.6)
        } catch (e) {}
    }

    const scrollToBottom = () => {
        setTimeout(() => {
            if (chatScrollRef.current) {
                chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight
            }
        }, 100)
    }

    // Load existing messages
    const fetchChatMessages = async () => {
        try {
            const res = await axios.post('/api/chat/messages', { roomId })
            if (Array.isArray(res.data)) {
                setMessages(res.data)
                scrollToBottom()
            }
        } catch (e) {
            console.error('Failed to load appeal messages:', e)
        } finally {
            setLoadingMessages(false)
        }
    }

    // Check if admin has unbanned the account
    const checkBanStatus = async () => {
        try {
            const res = await axios.get('/api/user/ban-status')
            if (res.data?.authenticated && !res.data.isBanned) {
                setUnbannedAlert(true)
                toast.success('🎉 Your account restriction has been lifted!', { duration: 5000 })
                setTimeout(() => {
                    window.location.href = '/'
                }, 1500)
            }
        } catch (e) {}
    }

    useEffect(() => {
        fetchChatMessages()

        // Poll ban status every 5s so when admin unbans, user is immediately restored
        const interval = setInterval(checkBanStatus, 5000)

        // Socket listener for admin replies and unban event
        const socket = getSocket()
        if (socket) {
            socket.emit('identity', user._id)
            socket.emit('join-room', roomId)

            const handleIncoming = (msg: any) => {
                if (String(msg?.roomId) === roomId) {
                    setMessages(prev => {
                        if (prev.some(m => m._id && msg._id && m._id === msg._id)) return prev
                        return [...prev, msg]
                    })
                    scrollToBottom()
                    if (msg.senderRole === 'admin') {
                        playChime()
                        toast('💬 Store Support replied to your appeal', { icon: '💬' })
                    }
                }
            }

            const handleBanChanged = (data: any) => {
                if (String(data?.userId) === String(user._id) && !data?.isBanned) {
                    setUnbannedAlert(true)
                    toast.success('🎉 Restriction lifted! Restoring your account access...', { duration: 4000 })
                    setTimeout(() => {
                        window.location.href = '/'
                    }, 1200)
                }
            }

            socket.on('send-message', handleIncoming)
            socket.on('admin-store-message', handleIncoming)
            socket.on('user-ban-status-changed', handleBanChanged)

            return () => {
                clearInterval(interval)
                socket.off('send-message', handleIncoming)
                socket.off('admin-store-message', handleIncoming)
                socket.off('user-ban-status-changed', handleBanChanged)
            }
        }

        return () => clearInterval(interval)
    }, [roomId, user._id])

    // Send appeal message
    const handleSendAppeal = async (textToSend?: string) => {
        const text = (textToSend ?? appealText).trim()
        if (!text) return

        const payload = {
            roomId,
            text,
            senderId: user._id,
            senderName: user.name || 'User',
            senderRole: user.role || 'user',
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }

        const tempId = 'temp_' + Date.now()
        setMessages(prev => [...prev, { ...payload, _id: tempId }])
        setAppealText('')
        setSending(true)
        scrollToBottom()

        try {
            const res = await axios.post('/api/chat/save', payload)
            if (res.data && res.data._id) {
                setMessages(prev => prev.map(m => m._id === tempId ? res.data : m))
            }

            const socket = getSocket()
            if (socket) {
                socket.emit('send-message', res.data || payload)
            }

            toast.success('Appeal message sent to Store Support', { duration: 2500 })
        } catch (e) {
            console.error('Failed to send appeal message:', e)
            toast.error('Failed to send message')
        } finally {
            setSending(false)
        }
    }

    const quickAppeals = [
        "👋 Hello! Why was my account restricted?",
        "🙏 I believe this suspension is a misunderstanding.",
        "📦 I have full proof and receipts for my orders.",
        "✓ I have reviewed the guidelines, please restore my account."
    ]

    return (
        <div className="min-h-screen bg-gradient-to-br from-rose-50 via-slate-50 to-amber-50/40 p-4 sm:p-6 flex flex-col items-center justify-center">
            {/* Unbanned Banner Modal */}
            {unbannedAlert && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
                    <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full text-center space-y-4 shadow-2xl border border-emerald-200">
                        <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto text-3xl shadow-sm">
                            🎉
                        </div>
                        <h2 className="text-xl font-black text-gray-900">Account Access Restored!</h2>
                        <p className="text-xs text-gray-500 font-medium">
                            The administrator has reviewed and unbanned your account. You can now use Central Mart normally.
                        </p>
                        <div className="flex items-center justify-center gap-2 text-xs font-bold text-emerald-700 animate-pulse">
                            <RefreshCw size={15} className="animate-spin" /> Redirecting to store...
                        </div>
                    </div>
                </div>
            )}

            <div className="w-full max-w-3xl space-y-4">
                {/* Top Nav Header */}
                <div className="bg-white p-4 sm:px-6 rounded-3xl border border-gray-100 shadow-sm flex items-center justify-between">
                    <BrandLogo size="md" />
                    <button
                        onClick={() => signOut({ callbackUrl: '/login' })}
                        className="inline-flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-rose-600 bg-gray-50 hover:bg-rose-50 px-3.5 py-2 rounded-xl transition cursor-pointer"
                    >
                        <LogOut size={14} /> Sign Out
                    </button>
                </div>

                {/* Suspension Notice Card */}
                <div className="bg-white rounded-3xl border border-rose-200 shadow-sm p-6 sm:p-7 space-y-4 relative overflow-hidden">
                    <div className="absolute -top-10 -right-10 w-36 h-36 bg-rose-500/10 rounded-full blur-2xl pointer-events-none" />

                    <div className="flex items-start gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0 shadow-sm">
                            <ShieldAlert size={30} />
                        </div>
                        <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                                <h1 className="text-xl sm:text-2xl font-black text-gray-900">
                                    Account Suspended
                                </h1>
                                <span className="bg-rose-600 text-white text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full shadow-xs">
                                    RESTRICTED
                                </span>
                            </div>
                            <p className="text-xs sm:text-sm text-gray-600 font-medium">
                                Hello <b>{user.name}</b>. Your {user.role === 'deliveryBoy' ? 'Delivery Partner' : 'Customer'} account access has been temporarily restricted by Central Mart Store Administration.
                            </p>
                        </div>
                    </div>

                    {/* Ban Details Box */}
                    <div className="bg-rose-50/80 border border-rose-200/80 rounded-2xl p-4 text-xs space-y-2">
                        <div className="flex items-center gap-2 text-rose-900 font-black">
                            <AlertTriangle size={15} className="text-rose-600 shrink-0" />
                            <span>Reason for restriction:</span>
                        </div>
                        <p className="text-rose-800 font-semibold pl-6 text-[13px]">
                            "{user.banReason || 'Violation of store terms, delivery protocol, or customer conduct policies.'}"
                        </p>
                        {user.bannedAt && (
                            <p className="text-[11px] text-rose-600/80 pl-6 flex items-center gap-1 font-medium">
                                <Clock size={11} /> Suspended on: {new Date(user.bannedAt).toLocaleString()}
                            </p>
                        )}
                    </div>

                    <p className="text-xs text-gray-500 leading-relaxed">
                        While your account is suspended, browsing, ordering, and delivery assignments are blocked. If you believe this is a misunderstanding or wish to resolve this issue, you can <b>directly message Central Mart Store Support</b> below.
                    </p>
                </div>

                {/* Built-in Appeal Live Chat */}
                <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden flex flex-col h-[460px]">
                    {/* Chat Header */}
                    <div className="bg-gray-50/80 border-b border-gray-100 p-4 flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                                <Store size={18} />
                            </div>
                            <div>
                                <h3 className="text-xs font-black text-gray-800">Central Mart Store Support</h3>
                                <p className="text-[10px] text-gray-500">Live appeal and dispute resolution channel</p>
                            </div>
                        </div>
                        <button
                            onClick={checkBanStatus}
                            className="text-xs font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 transition flex items-center gap-1.5 cursor-pointer active:scale-95"
                            title="Check if admin has unbanned your account"
                        >
                            <RefreshCw size={12} /> Check Status
                        </button>
                    </div>

                    {/* Messages Scroll Area */}
                    <div 
                        ref={chatScrollRef}
                        className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#fafafa]/40 scroll-smooth min-h-0"
                    >
                        {loadingMessages ? (
                            <div className="flex items-center justify-center h-full">
                                <RefreshCw size={20} className="animate-spin text-gray-400" />
                            </div>
                        ) : messages.length === 0 ? (
                            <div className="text-center py-10 text-gray-400 space-y-1.5">
                                <MessageSquare size={32} className="mx-auto text-gray-300" />
                                <p className="text-xs font-bold text-gray-600">No messages yet</p>
                                <p className="text-[11px]">Send a message to explain your situation to the store owner.</p>
                            </div>
                        ) : (
                            messages.map((m, i) => {
                                const isAdmin = m.senderRole === 'admin'
                                return (
                                    <div
                                        key={m._id || i}
                                        className={`flex flex-col ${isAdmin ? 'items-start' : 'items-end'}`}
                                    >
                                        <span className="text-[10px] text-gray-400 px-1 mb-0.5 font-medium">
                                            {isAdmin ? 'Central Mart Store Support' : 'You'} • {m.time}
                                        </span>
                                        <div className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-xs leading-relaxed shadow-2xs ${
                                            isAdmin 
                                                ? 'bg-emerald-600 text-white rounded-tl-xs font-medium' 
                                                : 'bg-white text-gray-800 border border-gray-200 rounded-tr-xs'
                                        }`}>
                                            {m.text}
                                        </div>
                                    </div>
                                )
                            })
                        )}
                    </div>

                    {/* Quick Appeal Chips & Input */}
                    <div className="p-3 bg-white border-t border-gray-100 space-y-2 shrink-0">
                        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                            {quickAppeals.map((chip, idx) => (
                                <button
                                    key={idx}
                                    type="button"
                                    onClick={() => handleSendAppeal(chip)}
                                    className="bg-gray-100 hover:bg-emerald-50 hover:text-emerald-800 text-gray-600 text-[11px] font-medium px-2.5 py-1 rounded-xl shrink-0 transition cursor-pointer border border-transparent hover:border-emerald-200"
                                >
                                    {chip}
                                </button>
                            ))}
                        </div>

                        <form
                            onSubmit={(e) => {
                                e.preventDefault()
                                handleSendAppeal()
                            }}
                            className="flex items-center gap-2 pt-0.5"
                        >
                            <input
                                type="text"
                                value={appealText}
                                onChange={(e) => setAppealText(e.target.value)}
                                placeholder="Explain why your account should be unbanned..."
                                className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-2xl text-xs font-medium focus:ring-2 focus:ring-green-500 outline-none"
                            />
                            <button
                                type="submit"
                                disabled={!appealText.trim() || sending}
                                className="w-10 h-10 rounded-2xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white flex items-center justify-center transition shrink-0 cursor-pointer shadow-sm active:scale-95"
                            >
                                <Send size={15} />
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    )
}
