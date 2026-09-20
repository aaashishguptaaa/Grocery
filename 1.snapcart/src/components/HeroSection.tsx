'use client'

import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Heart, ShoppingBag, Sparkles, Zap } from 'lucide-react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

const slides = [
    {
        title: "Fresh Groceries in 10 Minutes 🥦",
        subtitle: "Farm-fresh fruits, vegetables & daily essentials delivered to your doorstep.",
        btnText: "Shop Now",
        btnIcon: ShoppingBag,
        action: "scroll-products",
        bg: "https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=1400&auto=format&fit=crop",
        badge: "⚡ 10 MIN DELIVERY",
        badgeColor: "bg-amber-400 text-amber-900",
    },
    {
        title: "Shop Anytime, Anywhere 📱",
        subtitle: "Seamless online grocery shopping experience right at your fingertips.",
        btnText: "Explore Items",
        btnIcon: Sparkles,
        action: "scroll-products",
        bg: "https://images.unsplash.com/photo-1578916171728-46686eac8d58?q=80&w=1400&auto=format&fit=crop",
        badge: "✨ 500+ Products",
        badgeColor: "bg-green-400 text-green-900",
    },
    {
        title: "Fast & Reliable Delivery 🛵",
        subtitle: "Live GPS tracking from the mart straight to your doorstep.",
        btnText: "My Wishlist ❤️",
        btnIcon: Heart,
        action: "wishlist",
        bg: "https://images.unsplash.com/photo-1617347454431-f49d7ff5c3b1?q=80&w=1400&auto=format&fit=crop",
        badge: "📍 Live Tracking",
        badgeColor: "bg-blue-400 text-blue-900",
    }
]

export default function HeroSection() {
    const [current, setCurrent] = useState(0)
    const [touchStart, setTouchStart] = useState<number | null>(null)
    const router = useRouter()

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrent((prev) => (prev + 1) % slides.length)
        }, 5000)
        return () => clearInterval(timer)
    }, [])

    const handleButtonClick = (action: string) => {
        if (action === "scroll-products") {
            document.getElementById("products")?.scrollIntoView({ behavior: "smooth" })
        } else if (action === "wishlist") {
            router.push("/user/wishlist")
        }
    }

    const goToSlide = (i: number) => setCurrent(i)
    const prev = () => setCurrent((c) => (c - 1 + slides.length) % slides.length)
    const next = () => setCurrent((c) => (c + 1) % slides.length)

    return (
        <div className="pt-3 sm:pt-24 w-[96%] sm:w-[94%] md:w-[92%] max-w-7xl mx-auto mt-1 sm:mt-3">
            {/* ── Hero Carousel ── */}
            <div className="relative h-52 sm:h-72 md:h-80 lg:h-96 xl:h-[420px] rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl shadow-green-900/20"
                onTouchStart={(e) => setTouchStart(e.targetTouches[0].clientX)}
                onTouchEnd={(e) => {
                    if (touchStart === null) return
                    const diff = touchStart - e.changedTouches[0].clientX
                    if (Math.abs(diff) > 40) diff > 0 ? next() : prev()
                    setTouchStart(null)
                }}
            >
                <AnimatePresence mode="wait">
                    <motion.div
                        key={current}
                        initial={{ opacity: 0, scale: 1.04 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.65, ease: "easeInOut" }}
                        className="absolute inset-0"
                    >
                        {/* Background image */}
                        <Image
                            src={slides[current].bg}
                            alt={slides[current].title}
                            fill
                            className="object-cover"
                            priority={current === 0}
                            sizes="(max-width: 768px) 100vw, 90vw"
                        />
                        {/* Gradient overlay */}
                        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-black/20" />

                        {/* Content */}
                        <div className="relative z-10 h-full flex flex-col justify-center px-6 sm:px-10 md:px-14 max-w-2xl">
                            {/* Badge */}
                            <motion.span
                                initial={{ y: 16, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.15 }}
                                className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black mb-3 w-fit ${slides[current].badgeColor}`}
                            >
                                {slides[current].badge}
                            </motion.span>

                            <motion.h1
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.22 }}
                                className="text-xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-white leading-tight tracking-tight drop-shadow-lg"
                            >
                                {slides[current].title}
                            </motion.h1>

                            <motion.p
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.3 }}
                                className="text-xs sm:text-sm md:text-base text-gray-200 mt-2 mb-4 max-w-md leading-relaxed"
                            >
                                {slides[current].subtitle}
                            </motion.p>

                            <motion.button
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.38 }}
                                whileTap={{ scale: 0.96 }}
                                onClick={() => handleButtonClick(slides[current].action)}
                                className="flex items-center gap-2 bg-white hover:bg-green-50 text-green-800 font-black px-5 py-2.5 sm:px-7 sm:py-3 rounded-xl sm:rounded-2xl shadow-lg hover:shadow-xl transition-all text-sm sm:text-base w-fit cursor-pointer"
                            >
                                {React.createElement(slides[current].btnIcon, { size: 18, className: "text-green-700" })}
                                {slides[current].btnText}
                            </motion.button>
                        </div>
                    </motion.div>
                </AnimatePresence>

                {/* Nav arrows – desktop only */}
                <button onClick={prev} className="hidden md:flex absolute left-4 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/20 hover:bg-white/40 backdrop-blur-sm text-white rounded-full items-center justify-center transition z-20 cursor-pointer">‹</button>
                <button onClick={next} className="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/20 hover:bg-white/40 backdrop-blur-sm text-white rounded-full items-center justify-center transition z-20 cursor-pointer">›</button>

                {/* Dot indicators */}
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-20">
                    {slides.map((_, i) => (
                        <button
                            key={i}
                            onClick={() => goToSlide(i)}
                            className={`h-2 rounded-full transition-all cursor-pointer ${current === i ? "w-6 bg-white" : "w-2 bg-white/50"}`}
                        />
                    ))}
                </div>
            </div>

            {/* ── ETA Strip ── */}
            <div className="mt-3 flex items-center gap-2 sm:gap-4 overflow-x-auto [scrollbar-width:none] pb-1">
                {[
                    { icon: "⚡", text: "10 Min Delivery" },
                    { icon: "🌿", text: "100% Fresh" },
                    { icon: "🔒", text: "Secure Payments" },
                    { icon: "🛵", text: "Live Tracking" },
                    { icon: "↩️", text: "Easy Returns" },
                ].map(({ icon, text }) => (
                    <div key={text} className="flex items-center gap-1.5 bg-white rounded-xl px-3 py-2 shadow-sm border border-gray-100 shrink-0">
                        <span className="text-sm">{icon}</span>
                        <span className="text-xs font-semibold text-gray-700 whitespace-nowrap">{text}</span>
                    </div>
                ))}
            </div>
        </div>
    )
}