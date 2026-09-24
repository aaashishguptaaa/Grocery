'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { 
    Bike, CheckCircle2, Clock, ShieldCheck, 
    RefreshCw, LogOut, Phone, Mail, Sparkles, 
    AlertCircle, ArrowRight, ShieldAlert
} from 'lucide-react'
import { signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import BrandLogo from './BrandLogo'
import { getSocket } from '@/lib/socket'

interface DeliveryPendingApprovalProps {
    user: {
        _id?: string
        name: string
        email: string
        mobile?: string
        role?: string
        isApproved?: boolean
        deliveryApprovalStatus?: string
        createdAt?: string
    }
}

export default function DeliveryPendingApproval({ user }: DeliveryPendingApprovalProps) {
    const router = useRouter()
    const [isChecking, setIsChecking] = useState(false)
    const [statusMessage, setStatusMessage] = useState<string | null>(null)
    const [isApprovedNow, setIsApprovedNow] = useState(Boolean(user?.isApproved))
    const [approvalStatus, setApprovalStatus] = useState(user?.deliveryApprovalStatus || 'pending')

    const playCelebrationChime = () => {
        try {
            const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
            const now = ctx.currentTime
            const osc1 = ctx.createOscillator()
            const osc2 = ctx.createOscillator()
            const gainNode = ctx.createGain()

            osc1.type = 'triangle'
            osc1.frequency.setValueAtTime(523.25, now) // C5
            osc1.frequency.exponentialRampToValueAtTime(783.99, now + 0.15) // G5

            osc2.type = 'sine'
            osc2.frequency.setValueAtTime(659.25, now + 0.15) // E5
            osc2.frequency.exponentialRampToValueAtTime(1046.50, now + 0.35) // C6

            gainNode.gain.setValueAtTime(0.01, now)
            gainNode.gain.linearRampToValueAtTime(0.3, now + 0.05)
            gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.5)

            osc1.connect(gainNode)
            osc2.connect(gainNode)
            gainNode.connect(ctx.destination)

            osc1.start(now)
            osc1.stop(now + 0.2)
            osc2.start(now + 0.15)
            osc2.stop(now + 0.5)
        } catch (e) {
            // AudioContext fallback
        }
    }

    const checkStatus = useCallback(async (manual = false) => {
        if (manual) setIsChecking(true)
        try {
            const res = await axios.get('/api/delivery/approval-status')
            if (res.data) {
                const approved = Boolean(res.data.isApproved)
                setApprovalStatus(res.data.deliveryApprovalStatus || (approved ? 'approved' : 'pending'))
                
                if (approved) {
                    setIsApprovedNow(true)
                    playCelebrationChime()
                    setTimeout(() => {
                        window.location.reload()
                    }, 2200)
                    return
                }
                if (manual) {
                    setStatusMessage('Application still under review. We will notify you once approved!')
                    setTimeout(() => setStatusMessage(null), 4000)
                }
            }
        } catch (e) {
            console.error('Failed to query status:', e)
        } finally {
            if (manual) setIsChecking(false)
        }
    }, [])

    // Real-time socket & polling check
    useEffect(() => {
        if (isApprovedNow) return

        // 1. Socket listener
        try {
            const socket = getSocket()
            if (socket) {
                const handleApprovalChanged = (data: any) => {
                    const targetId = data?.userId?.toString()
                    const myId = user?._id?.toString()
                    if (targetId && myId && targetId === myId) {
                        if (data.isApproved) {
                            setIsApprovedNow(true)
                            playCelebrationChime()
                            setTimeout(() => {
                                window.location.reload()
                            }, 2000)
                        } else {
                            setApprovalStatus(data.status || 'pending')
                        }
                    }
                }

                socket.on('delivery-approval-status-changed', handleApprovalChanged)
                return () => {
                    socket.off('delivery-approval-status-changed', handleApprovalChanged)
                }
            }
        } catch (e) {
            console.error('Socket init error:', e)
        }

        // 2. Fallback polling every 4 seconds
        const interval = setInterval(() => {
            checkStatus(false)
        }, 4000)

        return () => clearInterval(interval)
    }, [checkStatus, isApprovedNow, user?._id])

    return (
        <div className="min-h-screen bg-gradient-to-b from-[#f2fbf5] via-[#f8fafc] to-[#fefdf0] dark:from-[#060b14] dark:via-[#091122] dark:to-[#080d19] flex flex-col items-center justify-center p-4 sm:p-6 transition-colors duration-300">
            {/* Ambient Aurora Glow */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full bg-emerald-200/35 dark:bg-emerald-500/10 blur-[130px]" />
                <div className="absolute -bottom-32 -right-32 w-[520px] h-[520px] rounded-full bg-amber-200/30 dark:bg-amber-500/10 blur-[140px]" />
            </div>

            {/* Approved Celebration Modal Overlay */}
            <AnimatePresence>
                {isApprovedNow && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4"
                    >
                        <motion.div
                            initial={{ y: 20 }}
                            animate={{ y: 0 }}
                            className="bg-white dark:bg-slate-900 rounded-[32px] p-8 sm:p-10 max-w-md w-full text-center shadow-2xl border border-emerald-400"
                        >
                            <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto mb-4 text-4xl shadow-inner">
                                🎉
                            </div>
                            <h2 className="text-2xl font-black text-gray-900 dark:text-white">
                                You Are Approved!
                            </h2>
                            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-300 mt-2 font-medium">
                                Store administration has verified your delivery partner profile. Unlocking your delivery dashboard now...
                            </p>
                            <div className="mt-6 flex justify-center">
                                <div className="inline-flex items-center gap-2 bg-emerald-600 text-white text-xs font-black px-5 py-2.5 rounded-full shadow-md">
                                    <Sparkles size={16} /> Opening Dashboard...
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Main Pending Card */}
            <motion.div
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="relative z-10 w-full max-w-[560px] bg-white/95 dark:bg-slate-900/90 backdrop-blur-2xl rounded-[36px] border border-white/80 dark:border-slate-800 shadow-[0_25px_70px_-15px_rgba(245,158,11,0.22),0_10px_30px_-5px_rgba(15,23,42,0.06)] p-7 sm:p-10 text-center overflow-hidden"
            >
                {/* Top Amber-Emerald Accent Ribbon */}
                <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-amber-400 via-emerald-500 to-green-600" />

                {/* Header Logo */}
                <div className="flex justify-center mb-6">
                    <BrandLogo size="md" lightText={false} showTagline={false} />
                </div>

                {/* Animated Rider Badge */}
                <div className="relative inline-flex items-center justify-center mb-5">
                    <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-amber-50 dark:bg-amber-950/40 border-2 border-amber-200 dark:border-amber-800/80 flex items-center justify-center text-4xl sm:text-5xl shadow-sm">
                        🛵
                    </div>
                    <span className="absolute -bottom-1 -right-1 bg-amber-500 text-white text-[10px] font-black px-2.5 py-1 rounded-full shadow-md flex items-center gap-1">
                        <Clock size={11} className="animate-spin" /> Pending
                    </span>
                </div>

                {/* Title & Description */}
                <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tight">
                    Delivery Partner Under Review
                </h1>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-2 font-medium max-w-md mx-auto leading-relaxed">
                    To maintain strict safety and reliable deliveries, all delivery partner registrations require manual verification by the store administration.
                </p>

                {/* Status Callout Banner */}
                <div className="my-6 p-4 rounded-2xl bg-amber-50/90 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/60 text-left">
                    <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-extrabold text-xs">
                        <ShieldAlert size={16} className="text-amber-600 shrink-0" />
                        <span>Awaiting Store Admin Verification</span>
                    </div>
                    <p className="text-[11px] text-amber-700 dark:text-amber-400 font-medium mt-1 pl-6">
                        Only verified delivery partners can access active orders and go online. Please wait while the admin verifies your details.
                    </p>
                </div>

                {/* Applicant Summary */}
                <div className="bg-gray-50/90 dark:bg-slate-800/70 rounded-2xl p-4 text-left border border-gray-100 dark:border-slate-700/60 space-y-2 mb-6">
                    <div className="text-[10px] font-black uppercase text-gray-400 tracking-wider">
                        Applicant Information
                    </div>
                    <div className="flex items-center justify-between text-xs font-bold text-gray-700 dark:text-gray-200">
                        <span>Partner Name:</span>
                        <span className="font-black text-gray-900 dark:text-white">{user.name}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs font-bold text-gray-700 dark:text-gray-200">
                        <span>Email:</span>
                        <span className="text-gray-600 dark:text-gray-300">{user.email}</span>
                    </div>
                    {user.mobile && (
                        <div className="flex items-center justify-between text-xs font-bold text-gray-700 dark:text-gray-200">
                            <span>Phone Number:</span>
                            <span className="text-gray-900 dark:text-white font-mono">{user.mobile}</span>
                        </div>
                    )}
                    <div className="flex items-center justify-between text-xs font-bold text-gray-700 dark:text-gray-200">
                        <span>Current Status:</span>
                        <span className="inline-flex items-center gap-1 text-[11px] font-black text-amber-600 bg-amber-100 dark:bg-amber-900/50 px-2.5 py-0.5 rounded-full">
                            <Clock size={11} /> {approvalStatus === 'rejected' ? 'Approval Denied' : 'Pending Verification'}
                        </span>
                    </div>
                </div>

                {/* Verification Pipeline Steps */}
                <div className="space-y-2.5 text-left mb-6">
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-slate-800/60 border border-gray-100 dark:border-slate-700 shadow-2xs">
                        <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />
                        <div>
                            <div className="text-xs font-bold text-gray-800 dark:text-white">1. Account Registered</div>
                            <div className="text-[10px] text-gray-400">Mobile number & profile details saved</div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 p-3 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 shadow-2xs">
                        <div className="w-4 h-4 rounded-full border-2 border-amber-500 border-t-transparent animate-spin shrink-0" />
                        <div>
                            <div className="text-xs font-extrabold text-amber-800 dark:text-amber-300">2. Admin Verification (Current Step)</div>
                            <div className="text-[10px] text-amber-600/80 dark:text-amber-400/80">Store admin reviews and approves your account</div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50/60 dark:bg-slate-800/30 border border-dashed border-gray-200 dark:border-slate-700 opacity-60">
                        <Bike size={18} className="text-gray-400 shrink-0" />
                        <div>
                            <div className="text-xs font-bold text-gray-600 dark:text-gray-400">3. Dashboard & Orders Unlocked</div>
                            <div className="text-[10px] text-gray-400">Receive live delivery assignments and earn</div>
                        </div>
                    </div>
                </div>

                {/* Status Message Toast */}
                {statusMessage && (
                    <motion.div
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-4 p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 text-emerald-700 dark:text-emerald-300 text-xs font-bold"
                    >
                        {statusMessage}
                    </motion.div>
                )}

                {/* Action Buttons */}
                <div className="space-y-3">
                    <button
                        onClick={() => checkStatus(true)}
                        disabled={isChecking}
                        className="w-full h-12 rounded-2xl bg-gradient-to-r from-emerald-600 via-green-600 to-emerald-500 hover:from-emerald-700 hover:to-green-700 text-white font-black text-xs sm:text-sm shadow-md shadow-emerald-600/25 flex items-center justify-center gap-2 cursor-pointer transition active:scale-98 disabled:opacity-60"
                    >
                        <RefreshCw size={15} className={isChecking ? 'animate-spin' : ''} />
                        <span>{isChecking ? 'Checking status...' : 'Check Approval Status'}</span>
                    </button>

                    <button
                        onClick={() => signOut({ callbackUrl: '/login' })}
                        className="w-full h-11 rounded-2xl bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition"
                    >
                        <LogOut size={14} />
                        <span>Sign Out / Switch Account</span>
                    </button>
                </div>
            </motion.div>
        </div>
    )
}
