'use client'

import React from 'react'
import { motion } from 'motion/react'
import Link from 'next/link'
import { Sparkles, Zap, ShieldCheck, Heart } from 'lucide-react'
import BrandLogo from './BrandLogo'

export default function Footer() {
    return (
        <footer className="w-[94%] sm:w-[92%] max-w-6xl mx-auto my-8 sm:my-10">
            {/* 🌟 Cool, Vibrant Emerald Gradient Bar */}
            <motion.div
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-green-700 via-emerald-600 to-green-800 text-white p-4 sm:p-5 shadow-xl shadow-green-900/20 border border-green-400/40"
            >
                {/* 🌊 Subtle Ambient Glow Lights */}
                <div className="absolute -top-10 -left-10 w-40 h-40 rounded-full bg-emerald-300/25 blur-2xl pointer-events-none" />
                <div className="absolute -bottom-10 -right-10 w-40 h-40 rounded-full bg-teal-300/20 blur-2xl pointer-events-none" />

                {/* Inner Content Strip */}
                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-4">
                    
                    {/* Left: Brand Identity */}
                    <div className="flex items-center gap-3 text-center md:text-left flex-wrap justify-center md:justify-start">
                        <Link href="/" className="inline-flex items-center gap-2 group cursor-pointer">
                            <BrandLogo size="md" />
                        </Link>
                    </div>

                    {/* Center / Right: Colorful Cool Feature Badges */}
                    <div className="flex items-center gap-2 sm:gap-3 flex-wrap justify-center">
                        <div className="flex items-center gap-1.5 bg-white/15 backdrop-blur-md px-3 py-1.5 rounded-2xl border border-white/25 text-xs font-bold text-white shadow-2xs">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-300 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-400"></span>
                            </span>
                            <span className="text-amber-200">⚡ 10 Min</span> Delivery
                        </div>

                        <div className="flex items-center gap-1.5 bg-white/15 backdrop-blur-md px-3 py-1.5 rounded-2xl border border-white/25 text-xs font-bold text-white shadow-2xs">
                            <Sparkles size={13} className="text-emerald-200" />
                            <span>100% Organic</span>
                        </div>

                        <div className="hidden sm:flex items-center gap-1.5 bg-white/15 backdrop-blur-md px-3 py-1.5 rounded-2xl border border-white/25 text-xs font-bold text-white shadow-2xs">
                            <ShieldCheck size={14} className="text-teal-200" />
                            <span>Safe Checkout</span>
                        </div>
                    </div>

                </div>
            </motion.div>
        </footer>
    )
}
