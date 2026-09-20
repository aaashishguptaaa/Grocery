'use client'

import React, { CSSProperties, FormEvent, useState } from 'react'
import { motion } from 'motion/react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { ArrowLeft, ArrowRight, EyeIcon, EyeOff, Loader2, Lock, Mail, ShieldCheck, Sparkles, Zap } from 'lucide-react'
import googleImage from '@/assets/google.png'
import BrandLogo from '@/components/BrandLogo'

// Curated farm-fresh groceries falling at GPU-accelerated 60fps with negative delays
const GROCERY_ITEMS = [
    // Layer 1: Sharp Foreground Groceries
    { emoji: '🥑', left: '3%', size: 'text-3xl sm:text-4xl', duration: 12, delay: -2, anim: 'fallSwayRight' },
    { emoji: '🥛', left: '9%', size: 'text-2xl sm:text-3xl', duration: 14, delay: -8, anim: 'fallNormal' },
    { emoji: '🍞', left: '16%', size: 'text-3xl sm:text-4xl', duration: 11, delay: -4, anim: 'fallSwayLeft' },
    { emoji: '🍓', left: '22%', size: 'text-2xl sm:text-3xl', duration: 13, delay: -10, anim: 'fallSwayRight' },
    { emoji: '🥦', left: '28%', size: 'text-3xl sm:text-4xl', duration: 15, delay: -6, anim: 'fallNormal' },
    { emoji: '🧀', left: '35%', size: 'text-2xl sm:text-3xl', duration: 12, delay: -1, anim: 'fallSwayLeft' },
    { emoji: '🍊', left: '42%', size: 'text-3xl sm:text-4xl', duration: 13.5, delay: -9, anim: 'fallSwayRight' },
    { emoji: '🥐', left: '49%', size: 'text-2xl sm:text-3xl', duration: 14.5, delay: -5, anim: 'fallNormal' },
    { emoji: '🥕', left: '56%', size: 'text-2xl sm:text-3xl', duration: 12, delay: -11, anim: 'fallSwayLeft' },
    { emoji: '☕', left: '63%', size: 'text-2xl sm:text-3xl', duration: 15, delay: -3, anim: 'fallSwayRight' },
    { emoji: '🍎', left: '70%', size: 'text-3xl sm:text-4xl', duration: 11.5, delay: -7, anim: 'fallNormal' },
    { emoji: '🥚', left: '77%', size: 'text-2xl sm:text-3xl', duration: 14, delay: -2.5, anim: 'fallSwayLeft' },
    { emoji: '🍌', left: '84%', size: 'text-3xl sm:text-4xl', duration: 13, delay: -8.5, anim: 'fallSwayRight' },
    { emoji: '🍪', left: '91%', size: 'text-2xl sm:text-3xl', duration: 12.5, delay: -4.5, anim: 'fallNormal' },
    { emoji: '🍉', left: '97%', size: 'text-3xl sm:text-4xl', duration: 16, delay: -12, anim: 'fallSwayLeft' },

    // Layer 2: Midground Pantry & Produce
    { emoji: '🍇', left: '6%', size: 'text-2xl sm:text-3xl', duration: 13, delay: -7.2, anim: 'fallSwayLeft' },
    { emoji: '🍋', left: '19%', size: 'text-2xl sm:text-3xl', duration: 12, delay: -11.5, anim: 'fallNormal' },
    { emoji: '🧃', left: '32%', size: 'text-2xl sm:text-3xl', duration: 14.5, delay: -3.8, anim: 'fallSwayRight' },
    { emoji: '🍫', left: '46%', size: 'text-2xl sm:text-3xl', duration: 13.5, delay: -8.2, anim: 'fallNormal' },
    { emoji: '🌽', left: '60%', size: 'text-2xl sm:text-3xl', duration: 14, delay: -1.5, anim: 'fallSwayLeft' },
    { emoji: '🍅', left: '74%', size: 'text-2xl sm:text-3xl', duration: 12.5, delay: -6.8, anim: 'fallSwayRight' },
    { emoji: '🍄', left: '88%', size: 'text-2xl sm:text-3xl', duration: 15.5, delay: -10.2, anim: 'fallNormal' },

    // Layer 3: Soft Depth Layer (Farther, smaller, soft blur for 3D realism)
    { emoji: '🍯', left: '1%', size: 'text-xl sm:text-2xl', duration: 19, delay: -5, anim: 'fallNormal', opacity: 'opacity-40 blur-[0.6px]' },
    { emoji: '🍒', left: '13%', size: 'text-xl sm:text-2xl', duration: 17, delay: -13, anim: 'fallSwayRight', opacity: 'opacity-40 blur-[0.6px]' },
    { emoji: '🍍', left: '26%', size: 'text-xl sm:text-2xl', duration: 21, delay: -9, anim: 'fallSwayLeft', opacity: 'opacity-40 blur-[0.6px]' },
    { emoji: '🫒', left: '39%', size: 'text-xl sm:text-2xl', duration: 18, delay: -2, anim: 'fallNormal', opacity: 'opacity-40 blur-[0.6px]' },
    { emoji: '🥭', left: '53%', size: 'text-xl sm:text-2xl', duration: 20, delay: -15, anim: 'fallSwayRight', opacity: 'opacity-40 blur-[0.6px]' },
    { emoji: '🥬', left: '67%', size: 'text-xl sm:text-2xl', duration: 22, delay: -8, anim: 'fallSwayLeft', opacity: 'opacity-40 blur-[0.6px]' },
    { emoji: '🍆', left: '81%', size: 'text-xl sm:text-2xl', duration: 19, delay: -14, anim: 'fallNormal', opacity: 'opacity-40 blur-[0.6px]' },
    { emoji: '🍑', left: '95%', size: 'text-xl sm:text-2xl', duration: 20.5, delay: -6.5, anim: 'fallSwayLeft', opacity: 'opacity-40 blur-[0.6px]' },
]

export default function Login() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [loading, setLoading] = useState(false)
    const [errorMessage, setErrorMessage] = useState<string | null>(null)
    const router = useRouter()

    const handleLogin = async (e: FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setErrorMessage(null)

        try {
            const result = await signIn('credentials', {
                email,
                password,
                redirect: false
            })

            if (result?.error) {
                setErrorMessage('Invalid email or password. Please try again.')
                setLoading(false)
            } else {
                router.push('/')
                router.refresh()
            }
        } catch (error) {
            setErrorMessage('An unexpected error occurred. Please try again.')
            setLoading(false)
        }
    }

    const formValid = email.trim() !== '' && password.trim() !== ''

    return (
        <div className="relative min-h-screen w-full bg-gradient-to-b from-[#f2fbf5] via-[#f8fafc] to-[#fefdf0] dark:from-[#060b14] dark:via-[#091122] dark:to-[#080d19] flex flex-col items-center justify-center p-4 sm:p-6 overflow-hidden select-none transition-colors duration-300">
            
            {/* ── Keyframes defined directly in component for 100% GPU composition ── */}
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

            {/* ── Soft Ambient Aurora Backing (Light & Dark) ── */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-32 -left-32 w-[520px] h-[520px] rounded-full bg-emerald-200/35 dark:bg-emerald-500/10 blur-[130px]" />
                <div className="absolute -bottom-32 -right-32 w-[550px] h-[550px] rounded-full bg-amber-200/30 dark:bg-amber-500/10 blur-[140px]" />
            </div>

            {/* ── GPU-Accelerated Falling Groceries (Zero-Lag 60fps) ── */}
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
                            className={`absolute top-0 select-none pointer-events-none drop-shadow-xs ${item.size} ${item.opacity || 'opacity-85'}`}
                        >
                            {item.emoji}
                        </div>
                    )
                })}
            </div>

            {/* ── Floating Header: Back to Store ── */}
            <div className="relative z-20 mb-5">
                <Link
                    href="/"
                    className="group inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 dark:bg-slate-800/80 hover:bg-white dark:hover:bg-slate-800 backdrop-blur-md border border-white/90 dark:border-slate-700/80 shadow-[0_4px_12px_rgba(0,0,0,0.04)] hover:shadow-md text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-emerald-700 hover:dark:text-emerald-400 transition"
                >
                    <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
                    <span>Back to Store</span>
                </Link>
            </div>

            {/* ── Google Stitch Luxury Glassmorphic Card ── */}
            <motion.div
                initial={{ opacity: 0, y: 16, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.45, ease: 'easeOut' }}
                className="relative z-20 w-full max-w-[430px] bg-white/95 dark:bg-slate-900/90 backdrop-blur-2xl rounded-[32px] border border-white/80 dark:border-slate-800 shadow-[0_20px_60px_-15px_rgba(22,163,74,0.18),0_10px_25px_-5px_rgba(15,23,42,0.04)] dark:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.85)] p-7 sm:p-9 transition-colors duration-300 overflow-hidden"
            >
                {/* Top Subtle Emerald & Amber Accent Ribbon */}
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 via-green-400 to-amber-400" />

                {/* ── Card Header ── */}
                <div className="text-center space-y-2 mb-6">
                    <div className="flex items-center justify-center">
                        <BrandLogo size="md" lightText={false} showTagline={false} />
                    </div>
                    <h1 className="text-2xl sm:text-[26px] font-black text-slate-900 dark:text-white tracking-tight">
                        Welcome Back
                    </h1>
                </div>

                {/* ── Inline Animated Error Toast ── */}
                {errorMessage && (
                    <motion.div
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-4 p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-xs font-semibold text-center flex items-center justify-center gap-2"
                    >
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                        <span>{errorMessage}</span>
                    </motion.div>
                )}

                {/* ── Form ── */}
                <form onSubmit={handleLogin} className="space-y-4">
                    {/* Email Input */}
                    <div className="space-y-1 text-left">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                            Email
                        </label>
                        <input
                            type="email"
                            placeholder="name@example.com"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full h-12 bg-slate-50/90 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/80 focus:bg-white focus:dark:bg-slate-800 rounded-2xl px-4 text-xs sm:text-sm font-semibold text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-4 focus:ring-emerald-500/15 focus:border-emerald-500 outline-none transition-all shadow-inner/5"
                        />
                    </div>

                    {/* Password Input */}
                    <div className="space-y-1 text-left">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                            Password
                        </label>
                        <div className="relative">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                placeholder="••••••••"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full h-12 bg-slate-50/90 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/80 focus:bg-white focus:dark:bg-slate-800 rounded-2xl pl-4 pr-11 text-xs sm:text-sm font-semibold text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-4 focus:ring-emerald-500/15 focus:border-emerald-500 outline-none transition-all shadow-inner/5"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3.5 top-3.5 p-0.5 text-slate-400 dark:text-slate-500 hover:text-slate-600 hover:dark:text-slate-300 transition cursor-pointer"
                                aria-label="Toggle password visibility"
                            >
                                {showPassword ? <EyeOff size={17} /> : <EyeIcon size={17} />}
                            </button>
                        </div>
                    </div>

                    {/* ── High-Impact Primary CTA Button ── */}
                    <motion.button
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.98 }}
                        type="submit"
                        disabled={loading}
                        className={`w-full h-12 rounded-2xl font-black text-xs sm:text-sm transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer ${
                            formValid
                                ? 'bg-gradient-to-r from-emerald-600 via-green-600 to-emerald-500 hover:from-emerald-700 hover:to-green-700 text-white shadow-emerald-600/30'
                                : 'bg-emerald-600/80 hover:bg-emerald-600 text-white shadow-emerald-600/20'
                        }`}
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span>Signing in...</span>
                            </>
                        ) : (
                            <>
                                <span>Sign In</span>
                                <ArrowRight size={15} />
                            </>
                        )}
                    </motion.button>
                </form>

                {/* ── Stitch Divider ── */}
                <div className="relative my-5">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-slate-200/70 dark:border-slate-800" />
                    </div>
                    <div className="relative flex justify-center text-[10px]">
                        <span className="px-3 bg-white dark:bg-slate-900 text-slate-400 dark:text-slate-500 font-extrabold uppercase tracking-widest transition-colors">
                            or continue with
                        </span>
                    </div>
                </div>

                {/* ── Google One-Tap Authentication ── */}
                <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    type="button"
                    onClick={() => signIn('google', { callbackUrl: '/' })}
                    className="w-full h-12 flex items-center justify-center gap-3 bg-white dark:bg-slate-800/90 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/80 rounded-2xl text-xs sm:text-sm font-extrabold text-slate-700 dark:text-slate-200 transition-all shadow-xs hover:shadow-sm cursor-pointer"
                >
                    <Image src={googleImage} width={18} height={18} alt="Google" className="shrink-0" />
                    <span>Continue with Google</span>
                </motion.button>

                {/* ── Create Account Link ── */}
                <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800/80 text-center">
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                        Don&apos;t have an account?{' '}
                        <Link
                            href="/register"
                            className="font-black text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 hover:dark:text-emerald-300 transition hover:underline ml-0.5"
                        >
                            Sign Up
                        </Link>
                    </p>
                </div>
            </motion.div>
        </div>
    )
}
