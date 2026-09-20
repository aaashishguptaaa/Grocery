'use client'

import React from 'react'
import { motion } from 'motion/react'

export default function RunningDeliveryRider() {
    return (
        <div className="relative w-full max-w-[280px] mx-auto py-1 flex flex-col items-center justify-center select-none">
            {/* ── Soft Ambient Glow Behind Rider ── */}
            <div className="absolute w-32 h-32 rounded-full bg-gradient-to-tr from-emerald-500/15 via-green-400/10 to-amber-400/10 blur-xl pointer-events-none" />

            {/* ── Floating & Bouncing Scooter Group ── */}
            <motion.div
                animate={{
                    y: [0, -4, 0],
                    rotate: [0, 0.7, -0.4, 0],
                }}
                transition={{
                    repeat: Infinity,
                    duration: 0.7,
                    ease: 'easeInOut',
                }}
                className="relative z-10 flex items-center justify-center"
            >
                <svg
                    width="144"
                    height="98"
                    viewBox="0 0 144 98"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="drop-shadow-sm"
                >
                    {/* Wind motion trails behind */}
                    <g opacity="0.6">
                        <line x1="8" y1="42" x2="22" y2="42" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeDasharray="3 3" />
                        <line x1="2" y1="52" x2="16" y2="52" stroke="#34d399" strokeWidth="1.5" strokeLinecap="round" />
                        <line x1="10" y1="62" x2="20" y2="62" stroke="#fbbf24" strokeWidth="1.5" strokeLinecap="round" />
                    </g>

                    {/* Scooter Frame */}
                    <path
                        d="M32 68 H62 L74 54 H94 L98 68 H112"
                        stroke="#059669"
                        strokeWidth="4.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />

                    {/* Floorboard */}
                    <rect x="54" y="66" width="28" height="4.5" rx="2.25" fill="#047857" />

                    {/* Steering Column & Handlebar */}
                    <path
                        d="M94 54 L100 32 M96 32 H106"
                        stroke="#10b981"
                        strokeWidth="3.5"
                        strokeLinecap="round"
                    />

                    {/* Headlight with warm glow */}
                    <circle cx="105" cy="38" r="3.5" fill="#fbbf24" />
                    <path
                        d="M108 36 L132 28 L132 48 L108 40 Z"
                        fill="url(#lightBeam)"
                        opacity="0.35"
                    />

                    {/* Grocery Delivery Insulated Box */}
                    <rect x="24" y="34" width="28" height="26" rx="5" fill="#16a34a" />
                    <rect x="27" y="37" width="22" height="20" rx="3.5" fill="#15803d" />
                    {/* Grocery box handle/strap */}
                    <path d="M33 34 V30 C33 29 35 28 38 28 C41 28 43 29 43 30 V34" stroke="#15803d" strokeWidth="2" strokeLinecap="round" />

                    {/* Farm Fresh Goodies Peeking Out */}
                    {/* Carrot */}
                    <path d="M33 33 L28 22 L36 24 Z" fill="#f97316" />
                    <path d="M28 22 L26 17 M29 21 L30 16" stroke="#22c55e" strokeWidth="1.5" strokeLinecap="round" />
                    {/* French Baguette */}
                    <rect x="37" y="19" width="4.5" height="17" rx="2.25" transform="rotate(14 37 19)" fill="#d97706" />
                    {/* Fresh Crisp Greens */}
                    <circle cx="44" cy="29" r="4.5" fill="#22c55e" />
                    <circle cx="41" cy="27" r="3" fill="#4ade80" />

                    {/* Rider Body & Jacket */}
                    <path
                        d="M64 50 C64 42 70 38 76 38 C82 38 84 44 82 50 Z"
                        fill="#065f46"
                    />
                    {/* Rider Arm Reaching Handlebars */}
                    <path
                        d="M76 43 L90 39 L100 34"
                        stroke="#047857"
                        strokeWidth="3.5"
                        strokeLinecap="round"
                    />

                    {/* Rider Helmet */}
                    <circle cx="78" cy="24" r="11" fill="#10b981" />
                    <path d="M74 22 H88 V28 C88 30 84 32 80 32 C76 32 74 30 74 28 Z" fill="#0f172a" opacity="0.85" />
                    {/* Helmet Visor Reflection */}
                    <path d="M78 24 H84" stroke="#38bdf8" strokeWidth="1.5" strokeLinecap="round" opacity="0.8" />
                    {/* Helmet Sport Stripe */}
                    <path d="M70 22 C72 16 82 16 86 22" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" />

                    {/* Rear Wheel (Spinning) */}
                    <g className="animate-[spin_0.75s_linear_infinite]" style={{ transformOrigin: '36px 76px' }}>
                        <circle cx="36" cy="76" r="13" stroke="#1e293b" strokeWidth="4.5" fill="#f8fafc" />
                        <circle cx="36" cy="76" r="4.5" fill="#059669" />
                        <line x1="36" y1="65" x2="36" y2="87" stroke="#94a3b8" strokeWidth="1.5" />
                        <line x1="25" y1="76" x2="47" y2="76" stroke="#94a3b8" strokeWidth="1.5" />
                    </g>

                    {/* Front Wheel (Spinning) */}
                    <g className="animate-[spin_0.75s_linear_infinite]" style={{ transformOrigin: '106px 76px' }}>
                        <circle cx="106" cy="76" r="13" stroke="#1e293b" strokeWidth="4.5" fill="#f8fafc" />
                        <circle cx="106" cy="76" r="4.5" fill="#059669" />
                        <line x1="106" y1="65" x2="106" y2="87" stroke="#94a3b8" strokeWidth="1.5" />
                        <line x1="95" y1="76" x2="117" y2="76" stroke="#94a3b8" strokeWidth="1.5" />
                    </g>

                    {/* Gradient Definitions */}
                    <defs>
                        <linearGradient id="lightBeam" x1="108" y1="38" x2="132" y2="38" gradientUnits="userSpaceOnUse">
                            <stop stopColor="#fbbf24" stopOpacity="0.8" />
                            <stop offset="1" stopColor="#fbbf24" stopOpacity="0" />
                        </linearGradient>
                    </defs>
                </svg>
            </motion.div>

            {/* ── Dynamic Soft Shadow Beneath Wheels ── */}
            <motion.div
                animate={{
                    scaleX: [0.92, 1.06, 0.92],
                    opacity: [0.3, 0.18, 0.3],
                }}
                transition={{
                    repeat: Infinity,
                    duration: 0.7,
                    ease: 'easeInOut',
                }}
                className="w-24 h-1.5 bg-slate-800/30 dark:bg-black/50 rounded-full blur-[2px] mt-0.5"
            />
        </div>
    )
}
