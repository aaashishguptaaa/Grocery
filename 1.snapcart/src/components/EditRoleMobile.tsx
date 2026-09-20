'use client'

import React, { CSSProperties, useEffect, useState } from 'react'
import { motion } from 'motion/react'
import { ArrowRight, Check, Crown, Loader2, Sparkles } from 'lucide-react'
import axios from 'axios'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import BrandLogo from './BrandLogo'

// Farm-fresh groceries falling gently
const GROCERY_ITEMS = [
    { emoji: '🥑', left: '4%', size: 'text-3xl sm:text-4xl', duration: 12, delay: -2, anim: 'fallSwayRight' },
    { emoji: '🥛', left: '12%', size: 'text-2xl sm:text-3xl', duration: 14, delay: -8, anim: 'fallNormal' },
    { emoji: '🍞', left: '20%', size: 'text-3xl sm:text-4xl', duration: 11, delay: -4, anim: 'fallSwayLeft' },
    { emoji: '🍓', left: '29%', size: 'text-2xl sm:text-3xl', duration: 13, delay: -10, anim: 'fallSwayRight' },
    { emoji: '🥦', left: '38%', size: 'text-3xl sm:text-4xl', duration: 15, delay: -6, anim: 'fallNormal' },
    { emoji: '🍊', left: '48%', size: 'text-3xl sm:text-4xl', duration: 13.5, delay: -9, anim: 'fallSwayRight' },
    { emoji: '🥕', left: '58%', size: 'text-2xl sm:text-3xl', duration: 12, delay: -11, anim: 'fallSwayLeft' },
    { emoji: '🍎', left: '68%', size: 'text-3xl sm:text-4xl', duration: 11.5, delay: -7, anim: 'fallNormal' },
    { emoji: '🍌', left: '78%', size: 'text-3xl sm:text-4xl', duration: 13, delay: -8.5, anim: 'fallSwayRight' },
    { emoji: '🍉', left: '88%', size: 'text-3xl sm:text-4xl', duration: 16, delay: -12, anim: 'fallSwayLeft' },
    { emoji: '🍇', left: '95%', size: 'text-2xl sm:text-3xl', duration: 13, delay: -7.2, anim: 'fallSwayLeft' },
]

export default function EditRoleMobile() {
    const [roles, setRoles] = useState([
        {
            id: 'user',
            label: 'Customer',
            emoji: '🛒',
            tag: 'Shop & Eat',
            gradient: 'from-emerald-50 via-green-50/50 to-white dark:from-emerald-950/40 dark:via-slate-900 dark:to-slate-900',
            activeBorder: 'border-emerald-500 shadow-[0_8px_24px_-4px_rgba(16,185,129,0.3)] ring-2 ring-emerald-500/25',
            badgeBg: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300',
        },
        {
            id: 'deliveryBoy',
            label: 'Delivery Boy',
            emoji: '🛵',
            tag: 'Ride & Earn',
            gradient: 'from-amber-50 via-orange-50/50 to-white dark:from-amber-950/40 dark:via-slate-900 dark:to-slate-900',
            activeBorder: 'border-amber-500 shadow-[0_8px_24px_-4px_rgba(245,158,11,0.3)] ring-2 ring-amber-500/25',
            badgeBg: 'bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-300',
        },
    ])
    const [selectedRole, setSelectedRole] = useState('')
    const [mobile, setMobile] = useState('')
    const [loading, setLoading] = useState(false)
    const { update } = useSession()
    const router = useRouter()

    useEffect(() => {
        const checkForAdmin = async () => {
            try {
                const result = await axios.get('/api/check-for-admin')
                if (!result.data.adminExist) {
                    setRoles((prev) => [
                        {
                            id: 'admin',
                            label: 'Store Admin',
                            emoji: '👑',
                            tag: 'Manage All',
                            gradient: 'from-purple-50 via-indigo-50/50 to-white dark:from-purple-950/40 dark:via-slate-900 dark:to-slate-900',
                            activeBorder: 'border-purple-500 shadow-[0_8px_24px_-4px_rgba(168,85,247,0.3)] ring-2 ring-purple-500/25',
                            badgeBg: 'bg-purple-100 text-purple-700 dark:bg-purple-900/60 dark:text-purple-300',
                        },
                        ...prev,
                    ])
                }
            } catch (error) {
                console.log(error)
            }
        }
        checkForAdmin()
    }, [])

    const handleEdit = async (e?: React.FormEvent) => {
        if (e) e.preventDefault()
        if (mobile.trim().length !== 10 || !selectedRole || loading) return

        setLoading(true)
        try {
            await axios.post('/api/user/edit-role-mobile', {
                role: selectedRole,
                mobile: mobile.trim(),
            })
            await update({ role: selectedRole })
            router.push('/')
            router.refresh()
        } catch (error) {
            console.log(error)
            setLoading(false)
        }
    }

    const isValid = selectedRole !== '' && mobile.trim().length === 10

    return (
        <div className="relative min-h-screen w-full bg-gradient-to-b from-[#f2fbf5] via-[#f8fafc] to-[#fefdf0] dark:from-[#060b14] dark:via-[#091122] dark:to-[#080d19] flex flex-col items-center justify-center p-4 sm:p-6 overflow-hidden select-none transition-colors duration-300">
            {/* ── Keyframes for GPU falling animation ── */}
            <style>{`
                @keyframes fallNormal {
                    0% { transform: translate3d(0, -15vh, 0) rotate(0deg); }
                    50% { transform: translate3d(0, 50vh, 0) rotate(180deg); }
                    100% { transform: translate3d(0, 115vh, 0) rotate(360deg); }
                }
                @keyframes fallSwayLeft {
                    0% { transform: translate3d(0, -15vh, 0) rotate(0deg); }
                    35% { transform: translate3d(-20px, 35vh, 0) rotate(-90deg); }
                    70% { transform: translate3d(15px, 75vh, 0) rotate(-180deg); }
                    100% { transform: translate3d(0, 115vh, 0) rotate(-360deg); }
                }
                @keyframes fallSwayRight {
                    0% { transform: translate3d(0, -15vh, 0) rotate(0deg); }
                    35% { transform: translate3d(20px, 35vh, 0) rotate(90deg); }
                    70% { transform: translate3d(-15px, 75vh, 0) rotate(180deg); }
                    100% { transform: translate3d(0, 115vh, 0) rotate(360deg); }
                }
            `}</style>

            {/* ── Ambient Aurora Glow ── */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-32 -left-32 w-[520px] h-[520px] rounded-full bg-emerald-200/35 dark:bg-emerald-500/10 blur-[130px]" />
                <div className="absolute -bottom-32 -right-32 w-[550px] h-[550px] rounded-full bg-amber-200/30 dark:bg-amber-500/10 blur-[140px]" />
            </div>

            {/* ── GPU Falling Produce ── */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
                {GROCERY_ITEMS.map((item, index) => {
                    const style: CSSProperties = {
                        left: item.left,
                        animation: `${item.anim} ${item.duration}s linear ${item.delay}s infinite`,
                        willChange: 'transform',
                        contain: 'layout style',
                    }

                    return (
                        <div
                            key={index}
                            style={style}
                            className={`absolute top-0 select-none pointer-events-none drop-shadow-xs ${item.size} opacity-85`}
                        >
                            {item.emoji}
                        </div>
                    )
                })}
            </div>

            {/* ── Cute & Classy Glassmorphic Card (Enlarged) ── */}
            <motion.div
                initial={{ opacity: 0, y: 16, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
                className="relative z-20 w-full max-w-[540px] sm:max-w-[580px] bg-white/95 dark:bg-slate-900/90 backdrop-blur-2xl rounded-[36px] border border-white/80 dark:border-slate-800 shadow-[0_25px_70px_-15px_rgba(22,163,74,0.2),0_10px_30px_-5px_rgba(15,23,42,0.06)] dark:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.85)] p-8 sm:p-11 transition-colors duration-300 overflow-hidden"
            >
                {/* Top Emerald & Amber Ribbon */}
                <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-emerald-500 via-green-400 to-amber-400" />

                {/* ── Header ── */}
                <div className="text-center space-y-2 mb-8">
                    <div className="flex items-center justify-center">
                        <BrandLogo size="lg" lightText={false} showTagline={false} />
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                        Select Your Role
                    </h1>
                </div>

                <form onSubmit={handleEdit} className="space-y-6">
                    {/* ── Cute Role Selection Cards ── */}
                    <div className="grid grid-cols-2 gap-4">
                        {roles.map((role) => {
                            const isSelected = selectedRole === role.id

                            return (
                                <motion.button
                                    key={role.id}
                                    type="button"
                                    whileHover={{ scale: 1.03, y: -2 }}
                                    whileTap={{ scale: 0.96 }}
                                    onClick={() => setSelectedRole(role.id)}
                                    className={`relative p-6 sm:p-7 rounded-[28px] border-2 transition-all duration-200 cursor-pointer flex flex-col items-center justify-center text-center bg-gradient-to-b ${role.gradient} ${
                                        isSelected
                                            ? role.activeBorder
                                            : 'border-slate-200/80 dark:border-slate-700/80 hover:border-slate-300 shadow-xs'
                                    }`}
                                >
                                    {/* Cute Checkmark Badge in Corner */}
                                    {isSelected && (
                                        <motion.div
                                            initial={{ scale: 0, rotate: -20 }}
                                            animate={{ scale: 1, rotate: 0 }}
                                            transition={{ type: 'spring', stiffness: 500, damping: 22 }}
                                            className="absolute top-3 right-3 w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-xs"
                                        >
                                            <Check size={14} strokeWidth={3} />
                                        </motion.div>
                                    )}

                                    {/* Cute Bouncy Emoji Avatar */}
                                    <motion.div
                                        animate={isSelected ? { y: [0, -5, 0] } : { y: 0 }}
                                        transition={{ repeat: isSelected ? Infinity : 0, duration: 1.5, ease: 'easeInOut' }}
                                        className="w-18 h-18 sm:w-20 sm:h-20 rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-800 shadow-[0_6px_18px_rgba(0,0,0,0.06)] dark:shadow-none flex items-center justify-center text-4xl sm:text-5xl mb-3.5 border border-slate-100 dark:border-slate-700"
                                    >
                                        {role.emoji}
                                    </motion.div>

                                    {/* Role Name */}
                                    <h3 className="text-base sm:text-lg font-black text-slate-800 dark:text-white">
                                        {role.label}
                                    </h3>

                                    {/* Cute Pill Tag */}
                                    <span className={`text-xs font-extrabold px-3 py-1 rounded-full mt-2 ${role.badgeBg}`}>
                                        {role.tag}
                                    </span>
                                </motion.button>
                            )
                        })}
                    </div>

                    {/* ── Cute Phone Number Input ── */}
                    <div className="space-y-2 text-left pt-1">
                        <label className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                            <span>Phone Number</span>
                            <span className="text-emerald-500">*</span>
                        </label>

                        <div className="relative flex items-center bg-slate-50/90 dark:bg-slate-800/80 border-2 border-slate-200/80 dark:border-slate-700/80 focus-within:border-emerald-500 focus-within:bg-white focus-within:dark:bg-slate-800 rounded-2xl p-2 transition-all shadow-inner/5 focus-within:shadow-[0_4px_20px_rgba(16,185,129,0.18)]">
                            {/* Cute Flag Badge */}
                            <div className="flex items-center gap-2 px-3.5 py-2.5 bg-white dark:bg-slate-700/90 rounded-xl shadow-xs border border-slate-200/60 dark:border-slate-600 text-xs sm:text-sm font-black text-slate-700 dark:text-slate-200 shrink-0 select-none">
                                <span className="text-base">🇮🇳</span>
                                <span>+91</span>
                            </div>

                            {/* Number Input */}
                            <input
                                type="tel"
                                maxLength={10}
                                placeholder="10-digit number"
                                required
                                value={mobile}
                                onChange={(e) => {
                                    const val = e.target.value.replace(/\D/g, '').slice(0, 10)
                                    setMobile(val)
                                }}
                                className="w-full h-11 px-3.5 bg-transparent text-sm sm:text-base font-bold text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none tracking-widest"
                            />

                            {/* Completed Check icon */}
                            {mobile.length === 10 && (
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className="pr-2 text-emerald-500"
                                >
                                    <div className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-950/80 flex items-center justify-center">
                                        <Check size={14} strokeWidth={3} />
                                    </div>
                                </motion.div>
                            )}
                        </div>
                    </div>

                    {/* ── Cute Bouncy Action Button ── */}
                    <motion.button
                        whileHover={isValid ? { scale: 1.02 } : {}}
                        whileTap={isValid ? { scale: 0.96 } : {}}
                        type="submit"
                        disabled={!isValid || loading}
                        className={`w-full h-13 sm:h-14 rounded-2xl font-black text-sm sm:text-base transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer mt-3 ${
                            isValid
                                ? 'bg-gradient-to-r from-emerald-600 via-green-600 to-emerald-500 hover:from-emerald-700 hover:to-green-700 text-white shadow-emerald-600/30'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed shadow-none border border-slate-200/60 dark:border-slate-700/60'
                        }`}
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                <span>Setting up...</span>
                            </>
                        ) : isValid ? (
                            <>
                                <span>Continue to Store</span>
                                <ArrowRight size={17} />
                            </>
                        ) : (
                            <span>Select role & enter phone ✨</span>
                        )}
                    </motion.button>
                </form>
            </motion.div>
        </div>
    )
}
