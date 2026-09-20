'use client'

import React, { useRef, useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { motion } from 'motion/react'

const categories = [
    { name: "Fruits & Vegetables", icon: "🍎", bg: "bg-emerald-50 border-emerald-100 text-emerald-800" },
    { name: "Dairy & Eggs",        icon: "🥛", bg: "bg-amber-50 border-amber-100 text-amber-800" },
    { name: "Rice, Atta & Grains", icon: "🌾", bg: "bg-orange-50 border-orange-100 text-orange-800" },
    { name: "Snacks & Biscuits",   icon: "🍪", bg: "bg-pink-50 border-pink-100 text-pink-800" },
    { name: "Spices & Masalas",    icon: "🌶️", bg: "bg-red-50 border-red-100 text-red-800" },
    { name: "Beverages & Drinks",  icon: "🧃", bg: "bg-sky-50 border-sky-100 text-sky-800" },
    { name: "Personal Care",       icon: "🧴", bg: "bg-purple-50 border-purple-100 text-purple-800" },
    { name: "Household Essentials",icon: "🧼", bg: "bg-lime-50 border-lime-100 text-lime-800" },
    { name: "Instant & Packaged Food", icon: "🍜", bg: "bg-teal-50 border-teal-100 text-teal-800" },
    { name: "Baby & Pet Care",     icon: "🍼", bg: "bg-indigo-50 border-indigo-100 text-indigo-800" },
]

export default function CategorySlider({ activeCategory }: { activeCategory?: string }) {
    const sliderRef = useRef<HTMLDivElement>(null)
    const router = useRouter()
    const [canScrollLeft, setCanScrollLeft] = useState(false)
    const [canScrollRight, setCanScrollRight] = useState(true)
    const [isDragging, setIsDragging] = useState(false)
    const [startX, setStartX] = useState(0)
    const [scrollLeftState, setScrollLeftState] = useState(0)
    const [hasDragged, setHasDragged] = useState(false)

    const checkScrollButtons = () => {
        if (sliderRef.current) {
            const { scrollLeft, scrollWidth, clientWidth } = sliderRef.current
            setCanScrollLeft(scrollLeft > 5)
            setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 5)
        }
    }

    useEffect(() => {
        checkScrollButtons()
        const el = sliderRef.current
        if (el) {
            el.addEventListener('scroll', checkScrollButtons)
            return () => el.removeEventListener('scroll', checkScrollButtons)
        }
    }, [])

    const scroll = (direction: "left" | "right") => {
        if (sliderRef.current) {
            const { scrollLeft, clientWidth } = sliderRef.current
            sliderRef.current.scrollTo({
                left: direction === "left" ? scrollLeft - clientWidth * 0.7 : scrollLeft + clientWidth * 0.7,
                behavior: "smooth"
            })
        }
    }

    const handleCategoryClick = (catName: string) => {
        if (hasDragged) return
        if (activeCategory === catName) router.push('/')
        else router.push(`/?category=${encodeURIComponent(catName)}#products`)
    }

    const onMouseDown = (e: React.MouseEvent) => {
        if (!sliderRef.current) return
        setIsDragging(true); setHasDragged(false)
        setStartX(e.pageX - sliderRef.current.offsetLeft)
        setScrollLeftState(sliderRef.current.scrollLeft)
    }
    const onMouseMove = (e: React.MouseEvent) => {
        if (!isDragging || !sliderRef.current) return
        e.preventDefault()
        const walk = (e.pageX - sliderRef.current.offsetLeft - startX) * 1.5
        if (Math.abs(walk) > 5) setHasDragged(true)
        sliderRef.current.scrollLeft = scrollLeftState - walk
    }
    const stopDrag = () => setIsDragging(false)

    return (
        <div id="categories" data-section="categories" className='w-[96%] sm:w-[94%] md:w-[92%] max-w-7xl mx-auto my-6 sm:my-8'>
            {/* Header */}
            <div className='flex items-center justify-between mb-4'>
                <div>
                    <h2 className='text-lg sm:text-xl md:text-2xl font-black text-gray-800 tracking-tight'>
                        Shop by Category
                    </h2>
                    <p className='text-xs text-gray-400 font-medium hidden sm:block mt-0.5'>
                        Explore fresh grocery collections
                    </p>
                </div>
                {/* Arrows */}
                <div className='flex items-center gap-1.5'>
                    <button onClick={() => scroll("left")} disabled={!canScrollLeft}
                        className='w-8 h-8 rounded-full bg-white border border-gray-200 text-gray-600 shadow-sm hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition cursor-pointer active:scale-95'>
                        <ChevronLeft size={16} />
                    </button>
                    <button onClick={() => scroll("right")} disabled={!canScrollRight}
                        className='w-8 h-8 rounded-full bg-white border border-gray-200 text-gray-600 shadow-sm hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition cursor-pointer active:scale-95'>
                        <ChevronRight size={16} />
                    </button>
                </div>
            </div>

            {/* Scrollable track */}
            <div
                ref={sliderRef}
                onMouseDown={onMouseDown} onMouseMove={onMouseMove}
                onMouseUp={stopDrag} onMouseLeave={stopDrag}
                className={`flex gap-2 sm:gap-3 overflow-x-auto select-none scroll-smooth py-2 px-0.5
                    [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden overscroll-x-contain
                    ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
            >
                {/* All Items */}
                <motion.div
                    whileHover={{ y: -2 }} whileTap={{ scale: 0.96 }}
                    onClick={() => !hasDragged && router.push('/')}
                    className={`flex flex-col items-center justify-center min-w-[80px] sm:min-w-[96px] md:min-w-[108px]
                        h-[90px] sm:h-[104px] md:h-[114px] rounded-2xl border p-3 cursor-pointer transition-all shrink-0 text-center
                        ${!activeCategory
                            ? "bg-green-600 border-green-600 text-white shadow-lg shadow-green-200"
                            : "bg-white border-gray-100 text-gray-700 hover:border-green-200 hover:shadow-md shadow-sm"
                        }`}
                >
                    <span className='text-2xl sm:text-3xl mb-1.5'>🛒</span>
                    <span className='text-[10px] sm:text-[11px] font-black leading-tight'>All Items</span>
                </motion.div>

                {/* Category Cards */}
                {categories.map((cat, i) => {
                    const isSelected = activeCategory === cat.name
                    return (
                        <motion.div
                            key={i}
                            whileHover={{ y: -2 }} whileTap={{ scale: 0.96 }}
                            onClick={() => handleCategoryClick(cat.name)}
                            className={`flex flex-col items-center justify-center min-w-[80px] sm:min-w-[96px] md:min-w-[108px]
                                h-[90px] sm:h-[104px] md:h-[114px] rounded-2xl border p-3 cursor-pointer transition-all shrink-0 text-center
                                ${isSelected
                                    ? "bg-green-600 border-green-600 text-white shadow-lg shadow-green-200 scale-[1.04]"
                                    : `${cat.bg} hover:shadow-md shadow-sm hover:border-green-200`
                                }`}
                        >
                            <span className='text-2xl sm:text-3xl mb-1.5'>{cat.icon}</span>
                            <span className={`text-[10px] sm:text-[11px] font-bold leading-tight line-clamp-2 ${isSelected ? "text-white" : ""}`}>
                                {cat.name}
                            </span>
                        </motion.div>
                    )
                })}
            </div>
        </div>
    )
}