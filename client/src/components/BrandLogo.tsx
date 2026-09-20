'use client'

import React from 'react'
import Image from 'next/image'

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
        sm: { icon: 28, text: 'text-lg', badge: 'text-[9px]' },
        md: { icon: 36, text: 'text-xl sm:text-2xl', badge: 'text-[10px]' },
        lg: { icon: 44, text: 'text-2xl sm:text-3xl', badge: 'text-xs' }
    }[size]

    return (
        <div className={`inline-flex items-center gap-2.5 group cursor-pointer ${className}`}>
            {/* 🛒 Fresh Grocery Cart Icon */}
            <div 
                className="relative shrink-0 rounded-2xl overflow-hidden shadow-sm group-hover:scale-105 group-hover:rotate-3 transition-transform duration-200"
                style={{ width: dimensions.icon, height: dimensions.icon }}
            >
                <Image
                    src="/grocery-logo.svg"
                    alt="Grocery"
                    width={dimensions.icon}
                    height={dimensions.icon}
                    className="object-contain w-full h-full"
                    priority
                />
            </div>

            {/* Typography: grocery ⚡ 10 min */}
            {showText && (
                <div className="flex flex-col leading-none select-none">
                    <div className="flex items-center gap-1">
                        <span className={`font-black tracking-tight ${lightText ? 'text-white' : 'text-gray-900 dark:text-white'} ${dimensions.text}`}>
                            grocery
                        </span>
                        <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
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
