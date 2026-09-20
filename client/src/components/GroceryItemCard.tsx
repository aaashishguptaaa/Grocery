'use client'

import React, { useEffect, useState, useRef } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'motion/react'
import { ChevronLeft, ChevronRight, Heart, Minus, Plus, ShoppingCart, Sparkles, Star, Tag, X, Check, Eye } from 'lucide-react'
import { useDispatch, useSelector } from 'react-redux'
import { addToCart, decreaseQuantity, increaseQuantity } from '@/redux/cartSlice'
import { RootState } from '@/redux/store'
import { IGrocery } from '@/models/grocery.model'
import { useRouter } from 'next/navigation'

export default function GroceryItemCard({ item }: { item: IGrocery }) {
    const dispatch = useDispatch()
    const router = useRouter()
    const { cartData } = useSelector((state: RootState) => state.cart)
    const [isWishlisted, setIsWishlisted] = useState(false)
    const [currentImageIndex, setCurrentImageIndex] = useState(0)
    const [showQuickView, setShowQuickView] = useState(false)

    // Touch and drag swipe state
    const [touchStartX, setTouchStartX] = useState<number | null>(null)
    const [touchEndX, setTouchEndX] = useState<number | null>(null)
    const [hasSwiped, setHasSwiped] = useState(false)

    const allImages = item.images && item.images.length > 0 ? item.images : (item.image ? [item.image] : [])

    const cartItem = cartData.find((i: any) => i._id?.toString() === item._id?.toString())
    const quantity = cartItem ? cartItem.quantity : 0

    // Calculate discount % if MRP is present
    const hasDiscount = item.mrp && Number(item.mrp) > Number(item.price)
    const discountPercent = hasDiscount
        ? Math.round(((Number(item.mrp) - Number(item.price)) / Number(item.mrp)) * 100)
        : 0

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const saved = JSON.parse(localStorage.getItem('snapcart_wishlist') || '[]')
            setIsWishlisted(saved.some((i: any) => i._id?.toString() === item._id?.toString()))
        }
    }, [item])

    const toggleWishlist = (e: React.MouseEvent) => {
        e.stopPropagation()
        if (typeof window !== 'undefined') {
            const saved = JSON.parse(localStorage.getItem('snapcart_wishlist') || '[]')
            let updated
            if (isWishlisted) {
                updated = saved.filter((i: any) => i._id?.toString() !== item._id?.toString())
            } else {
                updated = [...saved, item]
            }
            localStorage.setItem('snapcart_wishlist', JSON.stringify(updated))
            setIsWishlisted(!isWishlisted)
        }
    }

    const nextImage = (e?: React.MouseEvent) => {
        if (e) e.stopPropagation()
        if (allImages.length <= 1) return
        setCurrentImageIndex((prev) => (prev + 1) % allImages.length)
    }

    const prevImage = (e?: React.MouseEvent) => {
        if (e) e.stopPropagation()
        if (allImages.length <= 1) return
        setCurrentImageIndex((prev) => (prev - 1 + allImages.length) % allImages.length)
    }

    // Touch Handlers for Finger Swiping on Mobile
    const onTouchStart = (e: React.TouchEvent) => {
        setTouchEndX(null)
        setTouchStartX(e.targetTouches[0].clientX)
        setHasSwiped(false)
    }

    const onTouchMove = (e: React.TouchEvent) => {
        setTouchEndX(e.targetTouches[0].clientX)
    }

    const onTouchEnd = (e: React.TouchEvent) => {
        if (touchStartX === null || touchEndX === null) return
        const distance = touchStartX - touchEndX
        const minSwipeDistance = 35

        if (distance > minSwipeDistance && allImages.length > 1) {
            e.stopPropagation()
            setHasSwiped(true)
            nextImage()
        } else if (distance < -minSwipeDistance && allImages.length > 1) {
            e.stopPropagation()
            setHasSwiped(true)
            prevImage()
        }
    }

    const handleAdd = (e?: React.MouseEvent) => {
        if (e) e.stopPropagation()
        dispatch(addToCart({
            ...item,
            _id: item._id?.toString(),
            quantity: 1
        } as any))
    }

    const handleCategoryClick = (e: React.MouseEvent, cat: string) => {
        e.stopPropagation()
        router.push(`/?category=${encodeURIComponent(cat)}#products`)
    }

    const handleCardClick = () => {
        if (hasSwiped) return
        setShowQuickView(true)
    }

    return (
        <>
            <motion.div
                whileHover={{ y: -4 }}
                className='bg-white rounded-3xl p-3.5 sm:p-4 shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 flex flex-col justify-between relative group'
            >
                {/* Offer / Discount Badge */}
                {discountPercent > 0 && (
                    <span className='absolute top-3 left-3 z-10 bg-emerald-600 text-white text-[10px] font-black px-2 py-0.5 rounded-lg shadow-sm flex items-center gap-0.5'>
                        <Tag size={10} /> {discountPercent}% OFF
                    </span>
                )}

                {/* Heart Wishlist Button */}
                <button
                    onClick={toggleWishlist}
                    className='absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-white/90 backdrop-blur-md shadow-sm flex items-center justify-center hover:scale-110 transition cursor-pointer'
                >
                    <Heart
                        size={15}
                        className={isWishlisted ? "fill-red-500 text-red-500" : "text-gray-400 hover:text-red-500"}
                    />
                </button>

                {/* 📱 Product Image Gallery with Touch/Finger Swipe */}
                <div
                    onTouchStart={onTouchStart}
                    onTouchMove={onTouchMove}
                    onTouchEnd={onTouchEnd}
                    onClick={handleCardClick}
                    className='relative w-full h-36 sm:h-40 rounded-2xl overflow-hidden mb-3 bg-gray-50 flex items-center justify-center group/img cursor-pointer select-none'
                >
                    {allImages.length > 0 ? (
                        <Image
                            src={allImages[currentImageIndex]}
                            alt={item.name}
                            fill
                            className={`object-cover transition-all duration-300 ${item.inStock === false ? "grayscale-[60%] opacity-70" : ""}`}
                        />
                    ) : (
                        <ShoppingCart size={32} className="text-gray-300" />
                    )}

                    {/* Out of Stock Floating Badge */}
                    {item.inStock === false && (
                        <div className="absolute inset-0 bg-black/35 flex items-center justify-center pointer-events-none z-10">
                            <span className="bg-red-600 text-white text-[11px] font-black uppercase tracking-wider px-3 py-1 rounded-xl shadow-lg border border-white/20">
                                Out of Stock
                            </span>
                        </div>
                    )}

                    {/* Touch Swipe Mini Arrows (Visible on mobile & desktop hover) */}
                    {allImages.length > 1 && (
                        <>
                            <button
                                type="button"
                                onClick={prevImage}
                                className='absolute left-1.5 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-black/40 text-white flex items-center justify-center opacity-80 sm:opacity-0 group-hover/img:opacity-100 hover:bg-black/70 transition cursor-pointer z-10 shadow-xs'
                            >
                                <ChevronLeft size={14} />
                            </button>
                            <button
                                type="button"
                                onClick={nextImage}
                                className='absolute right-1.5 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-black/40 text-white flex items-center justify-center opacity-80 sm:opacity-0 group-hover/img:opacity-100 hover:bg-black/70 transition cursor-pointer z-10 shadow-xs'
                            >
                                <ChevronRight size={14} />
                            </button>

                            {/* Animated Dot Indicators */}
                            <div className='absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1 z-10 bg-black/40 px-2 py-0.5 rounded-full backdrop-blur-xs'>
                                {allImages.map((_, i) => (
                                    <span
                                        key={i}
                                        className={`w-1.5 h-1.5 rounded-full transition-all ${
                                            currentImageIndex === i ? "bg-white scale-125" : "bg-white/50"
                                        }`}
                                    />
                                ))}
                            </div>
                        </>
                    )}

                    {/* Quick View Pill Hint on Desktop Hover */}
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/img:opacity-100 transition flex items-center justify-center text-white text-xs font-bold pointer-events-none hidden sm:flex">
                        <span className="bg-white/90 text-gray-800 px-2.5 py-1 rounded-full shadow-md text-[11px] flex items-center gap-1">
                            <Eye size={12} /> View Details
                        </span>
                    </div>
                </div>

                {/* Product Info with Clickable Tags */}
                <div className='space-y-1'>
                    <div className="flex flex-wrap gap-1">
                        {(item.categories && item.categories.length > 0 ? item.categories : [item.category]).map((cat, idx) => (
                            <span
                                key={idx}
                                onClick={(e) => handleCategoryClick(e, cat)}
                                className='text-[9px] sm:text-[10px] uppercase font-bold text-green-700 bg-green-50 hover:bg-green-100 px-2 py-0.5 rounded-md cursor-pointer transition inline-block border border-green-100'
                            >
                                {cat}
                            </span>
                        ))}
                    </div>
                    <div className='flex items-center justify-between gap-1'>
                        <h3
                            onClick={handleCardClick}
                            className='font-bold text-gray-800 text-sm line-clamp-1 group-hover:text-green-700 transition cursor-pointer'
                        >
                            {item.name}
                        </h3>
                        {item.rating && item.rating.count > 0 && (
                            <span className="text-[10px] font-black bg-amber-50 text-amber-900 border border-amber-200 px-1.5 py-0.5 rounded flex items-center gap-0.5 shrink-0">
                                ⭐ {item.rating.average.toFixed(1)}
                            </span>
                        )}
                    </div>
                    <span className='text-xs text-gray-400 bg-gray-50 px-2 py-0.5 rounded-md inline-block'>
                        {item.unit}
                    </span>
                </div>

                {/* Price, MRP & Quantity Controls */}
                <div className='flex items-center justify-between mt-3 pt-3 border-t border-gray-50'>
                    <div className='flex items-baseline gap-1.5'>
                        <span className='font-black text-gray-900 text-base sm:text-lg'>
                            ₹{item.price}
                        </span>
                        {hasDiscount && (
                            <span className='text-xs text-gray-400 line-through'>
                                ₹{item.mrp}
                            </span>
                        )}
                    </div>

                    {item.inStock === false ? (
                        <button
                            disabled
                            className="bg-gray-100 text-gray-400 font-extrabold text-[11px] px-3 py-1.5 rounded-xl cursor-not-allowed border border-gray-200"
                        >
                            Out of Stock
                        </button>
                    ) : quantity > 0 ? (
                        <div className='flex items-center bg-green-600 text-white rounded-xl px-2 py-1 gap-2 shadow-md'>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation()
                                    dispatch(decreaseQuantity(item._id?.toString() || "" as any))
                                }}
                                className='w-5 h-5 flex items-center justify-center hover:bg-green-700 rounded-md transition cursor-pointer'
                            >
                                <Minus size={13} />
                            </button>
                            <span className='text-xs sm:text-sm font-extrabold min-w-3 text-center'>{quantity}</span>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation()
                                    dispatch(increaseQuantity(item._id?.toString() || "" as any))
                                }}
                                className='w-5 h-5 flex items-center justify-center hover:bg-green-700 rounded-md transition cursor-pointer'
                            >
                                <Plus size={13} />
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={handleAdd}
                            className='bg-green-600 hover:bg-green-700 text-white font-black text-xs px-3.5 py-1.5 rounded-xl transition flex items-center gap-1 shadow-sm hover:shadow-md cursor-pointer active:scale-95'
                        >
                            <Plus size={13} /> ADD
                        </button>
                    )}
                </div>
            </motion.div>

            {/* 🔍 PRODUCT QUICK VIEW & FULL DETAILS MODAL */}
            <AnimatePresence>
                {showQuickView && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-gray-100 relative max-h-[90vh] flex flex-col"
                        >
                            {/* Close Button */}
                            <button
                                type="button"
                                onClick={() => setShowQuickView(false)}
                                className="absolute top-3 right-3 z-20 w-8 h-8 rounded-full bg-white/90 text-gray-600 hover:text-black shadow-md flex items-center justify-center cursor-pointer"
                            >
                                <X size={18} />
                            </button>

                            {/* Modal Content Scrollable Area */}
                            <div className="overflow-y-auto p-5 sm:p-6 space-y-4">
                                {/* Big Image Carousel with Swiping */}
                                <div
                                    onTouchStart={onTouchStart}
                                    onTouchMove={onTouchMove}
                                    onTouchEnd={onTouchEnd}
                                    className="relative w-full h-64 sm:h-72 rounded-2xl overflow-hidden bg-gray-50 flex items-center justify-center select-none"
                                >
                                    {allImages.length > 0 && (
                                        <Image
                                            src={allImages[currentImageIndex]}
                                            alt={item.name}
                                            fill
                                            className="object-cover"
                                        />
                                    )}

                                    {discountPercent > 0 && (
                                        <span className="absolute top-3 left-3 bg-emerald-600 text-white text-xs font-black px-2.5 py-1 rounded-xl shadow-md">
                                            {discountPercent}% OFF
                                        </span>
                                    )}

                                    {allImages.length > 1 && (
                                        <>
                                            <button
                                                type="button"
                                                onClick={prevImage}
                                                className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 hover:bg-black/70 text-white flex items-center justify-center cursor-pointer shadow-md"
                                            >
                                                <ChevronLeft size={18} />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={nextImage}
                                                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 hover:bg-black/70 text-white flex items-center justify-center cursor-pointer shadow-md"
                                            >
                                                <ChevronRight size={18} />
                                            </button>
                                        </>
                                    )}
                                </div>

                                {/* Thumbnail Strip */}
                                {allImages.length > 1 && (
                                    <div className="flex gap-2 justify-center py-1">
                                        {allImages.map((img, i) => (
                                            <div
                                                key={i}
                                                onClick={() => setCurrentImageIndex(i)}
                                                className={`relative w-14 h-14 rounded-xl overflow-hidden border-2 cursor-pointer transition ${
                                                    currentImageIndex === i ? "border-green-600 scale-105" : "border-gray-200 opacity-70"
                                                }`}
                                            >
                                                <Image src={img} alt={`Thumb ${i}`} fill className="object-cover" />
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Title, Category & Unit */}
                                <div>
                                    <div className="flex flex-wrap gap-1.5 mb-1">
                                        {(item.categories && item.categories.length > 0 ? item.categories : [item.category]).map((cat, idx) => (
                                            <span key={idx} className="text-xs uppercase font-bold text-green-700 bg-green-50 px-2.5 py-0.5 rounded-md border border-green-200">
                                                {cat}
                                            </span>
                                        ))}
                                    </div>
                                    <h2 className="text-xl sm:text-2xl font-black text-gray-800 mt-1.5">
                                        {item.name}
                                    </h2>
                                    <p className="text-xs text-gray-500 font-medium mt-0.5">
                                        Unit Quantity: <span className="font-bold text-gray-700">{item.unit}</span>
                                    </p>
                                </div>

                                {/* Price & Savings Breakdown */}
                                <div className="p-3 bg-emerald-50/70 rounded-2xl border border-emerald-100 flex items-center justify-between">
                                    <div>
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-2xl font-black text-gray-900">₹{item.price}</span>
                                            {hasDiscount && (
                                                <span className="text-sm text-gray-400 line-through">₹{item.mrp}</span>
                                            )}
                                        </div>
                                        {hasDiscount && (
                                            <p className="text-[11px] font-bold text-emerald-700 mt-0.5">
                                                🎉 You save ₹{Number(item.mrp) - Number(item.price)} on this item!
                                            </p>
                                        )}
                                    </div>

                                    {item.rating && item.rating.count > 0 && (
                                        <div className="text-right">
                                            <span className="text-xs font-black bg-amber-100 text-amber-900 px-2 py-0.5 rounded-md flex items-center gap-1">
                                                ⭐ {item.rating.average.toFixed(1)}
                                            </span>
                                            <span className="text-[10px] text-gray-400 font-semibold block mt-0.5">
                                                ({item.rating.count} reviews)
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {/* Description / Highlights */}
                                {item.description && (
                                    <div className="space-y-1">
                                        <h4 className="text-xs font-black uppercase text-gray-500">Product Highlights</h4>
                                        <p className="text-xs text-gray-700 leading-relaxed bg-gray-50 p-3 rounded-xl border border-gray-100">
                                            {item.description}
                                        </p>
                                    </div>
                                )}

                                {/* Out of Stock Banner */}
                                {item.inStock === false && (
                                    <div className="p-3 bg-red-50 text-red-700 rounded-2xl border border-red-200 text-xs font-bold flex items-center gap-2">
                                        <span className="text-base">🚫</span>
                                        <span>This item is currently out of stock. Check back soon!</span>
                                    </div>
                                )}

                                {/* Fresh Guarantee Badge */}
                                <div className="grid grid-cols-2 gap-2 text-center text-[11px] font-bold text-gray-600">
                                    <div className="bg-gray-50 p-2 rounded-xl border border-gray-100 flex items-center justify-center gap-1.5">
                                        <span>⚡</span> 10 Min Fast Delivery
                                    </div>
                                    <div className="bg-gray-50 p-2 rounded-xl border border-gray-100 flex items-center justify-center gap-1.5">
                                        <span>🌿</span> 100% Quality Checked
                                    </div>
                                </div>
                            </div>

                            {/* Footer Add to Cart Controls */}
                            <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                                <div>
                                    <span className="text-[11px] text-gray-400 uppercase font-black block">Item Total</span>
                                    <span className="text-lg font-black text-gray-800">₹{item.price}</span>
                                </div>

                                {item.inStock === false ? (
                                    <button
                                        type="button"
                                        disabled
                                        className="px-6 py-2.5 bg-gray-200 text-gray-500 font-black text-xs rounded-2xl cursor-not-allowed flex items-center gap-1.5"
                                    >
                                        <span>🚫</span> Out of Stock
                                    </button>
                                ) : quantity > 0 ? (
                                    <div className="flex items-center bg-green-600 text-white rounded-2xl px-4 py-2 gap-4 shadow-lg">
                                        <button
                                            type="button"
                                            onClick={() => dispatch(decreaseQuantity(item._id?.toString() || "" as any))}
                                            className="w-6 h-6 flex items-center justify-center hover:bg-green-700 rounded-md transition cursor-pointer"
                                        >
                                            <Minus size={15} />
                                        </button>
                                        <span className="text-sm font-black min-w-4 text-center">{quantity}</span>
                                        <button
                                            type="button"
                                            onClick={() => dispatch(increaseQuantity(item._id?.toString() || "" as any))}
                                            className="w-6 h-6 flex items-center justify-center hover:bg-green-700 rounded-md transition cursor-pointer"
                                        >
                                            <Plus size={15} />
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={handleAdd}
                                        className="px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white font-black text-xs rounded-2xl shadow-lg transition flex items-center gap-2 cursor-pointer active:scale-95"
                                    >
                                        <ShoppingCart size={16} /> Add to Cart
                                    </button>
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    )
}