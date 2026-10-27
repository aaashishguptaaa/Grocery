'use client'

import React from 'react'
import { ShoppingCart } from 'lucide-react'

interface BrandLogoProps {
    size?: 'sm' | 'md' | 'lg'
    showText?: boolean
    showTagline?: boolean
    lightText?: boolean
    className?: string
}

export default function BrandLogo({
    size = 'md',
    showText = true,
    showTagline = true,
    lightText = true,
    className = ''
}: BrandLogoProps) {
    const dimensions = {
        sm: { box: 'w-7 h-7 rounded-xl', iconSize: 15, text: 'text-lg', badge: 'text-[9px]' },
        md: { box: 'w-9 h-9 sm:w-10 sm:h-10 rounded-2xl', iconSize: 20, text: 'text-xl sm:text-2xl', badge: 'text-[10px]' },
        lg: { box: 'w-11 h-11 rounded-2xl', iconSize: 24, text: 'text-2xl sm:text-3xl', badge: 'text-xs' }
    }[size]

    return (
        <div className={`inline-flex items-center gap-2.5 group cursor-pointer ${className}`}>
            {/* 🛒 Fresh Grocery Cart Logo — Native SVG (Zero network request, never breaks or shows error image) */}
            <div 
                className={`relative shrink-0 flex items-center justify-center bg-gradient-to-br from-emerald-400 via-green-500 to-emerald-600 text-white shadow-md shadow-green-900/20 group-hover:scale-105 group-hover:rotate-3 transition-transform duration-200 border border-white/20 ${dimensions.box}`}
            >
                <ShoppingCart size={dimensions.iconSize} className="text-white drop-shadow-xs" strokeWidth={2.5} />
            </div>

            {/* Typography: grocery ⚡ 10 min */}
            {showText && (
                <div className="flex flex-col leading-none select-none">
                    <div className="flex items-center gap-1">
                        <span className={`font-black tracking-tight ${lightText ? 'text-white' : 'text-gray-900 dark:text-white'} ${dimensions.text}`}>
                            grocery
                        </span>
                    </div>
                    {showTagline && (
                        <span className={`font-black uppercase tracking-widest ${lightText ? 'text-green-200' : 'text-green-700 dark:text-emerald-400'} ${dimensions.badge} mt-0.5`}>
                            10-Min Delivery
                        </span>
                    )}
                </div>
            )}
        </div>
    )
}
