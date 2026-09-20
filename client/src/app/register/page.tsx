'use client'

import React, { CSSProperties, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import Welcome from '@/components/Welcome'
import RegisterForm from '@/components/RegisterForm'

// Curated farm-fresh groceries falling smoothly at 60fps
const GROCERY_ITEMS = [
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
    { emoji: '🍇', left: '6%', size: 'text-2xl sm:text-3xl', duration: 13, delay: -7.2, anim: 'fallSwayLeft' },
    { emoji: '🍋', left: '19%', size: 'text-2xl sm:text-3xl', duration: 12, delay: -11.5, anim: 'fallNormal' },
    { emoji: '🧃', left: '32%', size: 'text-2xl sm:text-3xl', duration: 14.5, delay: -3.8, anim: 'fallSwayRight' },
    { emoji: '🍫', left: '46%', size: 'text-2xl sm:text-3xl', duration: 13.5, delay: -8.2, anim: 'fallNormal' },
    { emoji: '🌽', left: '60%', size: 'text-2xl sm:text-3xl', duration: 14, delay: -1.5, anim: 'fallSwayLeft' },
    { emoji: '🍅', left: '74%', size: 'text-2xl sm:text-3xl', duration: 12.5, delay: -6.8, anim: 'fallSwayRight' },
    { emoji: '🍄', left: '88%', size: 'text-2xl sm:text-3xl', duration: 15.5, delay: -10.2, anim: 'fallNormal' },
]

export default function Register() {
    const [step, setStep] = useState(1)

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

            {/* ── Ambient Aurora Glow ── */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-32 -left-32 w-[520px] h-[520px] rounded-full bg-emerald-200/35 dark:bg-emerald-500/10 blur-[130px]" />
                <div className="absolute -bottom-32 -right-32 w-[550px] h-[550px] rounded-full bg-amber-200/30 dark:bg-amber-500/10 blur-[140px]" />
            </div>

            {/* ── GPU-Accelerated Falling Groceries ── */}
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
            <div className="relative z-20 w-full max-w-[440px] bg-white/95 dark:bg-slate-900/90 backdrop-blur-2xl rounded-[32px] border border-white/80 dark:border-slate-800 shadow-[0_20px_60px_-15px_rgba(22,163,74,0.18),0_10px_25px_-5px_rgba(15,23,42,0.04)] dark:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.85)] p-7 sm:p-9 transition-colors duration-300 overflow-hidden">
                {/* Top Subtle Emerald & Amber Accent Ribbon */}
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 via-green-400 to-amber-400" />

                {/* Animated Step Switcher */}
                <AnimatePresence mode="wait">
                    {step === 1 ? (
                        <motion.div
                            key="step-welcome"
                            initial={{ opacity: 0, x: -16 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 16 }}
                            transition={{ duration: 0.28, ease: 'easeInOut' }}
                        >
                            <Welcome nextStep={setStep} />
                        </motion.div>
                    ) : (
                        <motion.div
                            key="step-register-form"
                            initial={{ opacity: 0, x: 16 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -16 }}
                            transition={{ duration: 0.28, ease: 'easeInOut' }}
                        >
                            <RegisterForm previousStep={setStep} />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    )
}
