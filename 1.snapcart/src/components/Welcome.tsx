'use client'

import React from 'react'
import { motion } from 'motion/react'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import BrandLogo from './BrandLogo'
import RunningDeliveryRider from './RunningDeliveryRider'

interface WelcomeProps {
    nextStep: (step: number) => void
}

export default function Welcome({ nextStep }: WelcomeProps) {
    return (
        <div className="w-full text-center space-y-6">
            {/* Clean Brand Header */}
            <div className="flex justify-center">
                <BrandLogo size="md" lightText={false} showTagline={false} />
            </div>

            {/* Live Animated Delivery Partner */}
            <div className="py-1">
                <RunningDeliveryRider />
            </div>

            {/* Clean, Punchy Headline */}
            <div>
                <h1 className="text-2xl sm:text-[26px] font-black text-slate-900 dark:text-white tracking-tight">
                    Fresh groceries in 10 minutes
                </h1>
            </div>

            {/* Classy High-Impact Action Button */}
            <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => nextStep(2)}
                className="w-full h-12 rounded-2xl bg-gradient-to-r from-emerald-600 via-green-600 to-emerald-500 hover:from-emerald-700 hover:to-green-700 text-white font-black text-xs sm:text-sm shadow-md shadow-emerald-600/25 flex items-center justify-center gap-2 cursor-pointer transition-all"
            >
                <span>Get Started</span>
                <ArrowRight size={15} />
            </motion.button>

            {/* Footer with subtle divider */}
            <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800/80 text-center">
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    Already have an account?{' '}
                    <Link
                        href="/login"
                        className="font-black text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 hover:dark:text-emerald-300 transition hover:underline ml-0.5"
                    >
                        Sign In
                    </Link>
                </p>
            </div>
        </div>
    )
}