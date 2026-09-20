'use client'

import React from 'react'
import Image from 'next/image'

interface AgrLogoProps {
    size?: 'sm' | 'md' | 'lg'
    showText?: boolean
    lightText?: boolean
    className?: string
}

export default function AgrLogo({
    size = 'md',
    showText = true,
    lightText = true,
    className = ''
}: AgrLogoProps) {
    const iconDimensions = {
        sm: { width: 28, height: 28, title: 'text-base', sub: 'text-[9px]' },
        md: { width: 36, height: 36, title: 'text-xl sm:text-2xl', sub: 'text-[10px]' },
        lg: { width: 44, height: 44, title: 'text-2xl sm:text-3xl', sub: 'text-xs' },
    }[size]

    return (
        <div className={`inline-flex items-center gap-2.5 ${className}`}>
            {/* Modern Clean Grocery Bag Emblem */}
            <div 
                className="relative shrink-0 rounded-2xl overflow-hidden shadow-xs group-hover:scale-105 transition-transform duration-200" 
                style={{ width: iconDimensions.width, height: iconDimensions.height }}
            >
                <Image
                    src="/agr-logo.svg"
                    alt="A.G.R. Grocery"
                    width={iconDimensions.width}
                    height={iconDimensions.height}
                    className="object-contain w-full h-full drop-shadow-xs"
                    priority
                />
            </div>

            {/* Typography: A.G.R. GROCERY */}
            {showText && (
                <div className="flex flex-col leading-none select-none">
                    <div className="flex items-center gap-1.5">
                        <span className={`font-black tracking-tight ${lightText ? 'text-white' : 'text-gray-900'} ${iconDimensions.title}`}>
                            A.G.R.
                        </span>
                        <span className="font-extrabold tracking-wide text-amber-300 text-sm sm:text-lg uppercase">
                            Grocery
                        </span>
                    </div>
                    <span className={`font-black uppercase tracking-widest ${lightText ? 'text-green-200' : 'text-green-700'} ${iconDimensions.sub} mt-0.5`}>
                        10-Min Supermarket
                    </span>
                </div>
            )}
        </div>
    )
}
