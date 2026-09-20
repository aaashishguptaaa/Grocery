'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Check, Clock, Loader2, Package, ShoppingBag, ShoppingCart, Sparkles, Tag, X, Zap } from 'lucide-react'
import Image from 'next/image'
import axios from 'axios'
import { useDispatch, useSelector } from 'react-redux'
import { addToCart, increaseQuantity } from '@/redux/cartSlice'
import { RootState } from '@/redux/store'
import toast from 'react-hot-toast'

const groceryPacks = [
    { label: "🥛 Daily Breakfast Pack", query: "Fresh milk, brown bread, butter, eggs and jam" },
    { label: "🥔 Weekly Veggie Basket", query: "Fresh onions, potatoes, tomatoes, ginger and green chillies" },
    { label: "🌾 Monthly Ration Restock", query: "Atta, basmati rice, toor dal, cooking oil and salt" },
    { label: "🍿 Snacks & Cold Drinks", query: "Potato chips, chocolate biscuits, soft drinks and snacks" },
    { label: "🧼 Home Cleaning Pack", query: "Dishwash liquid, detergent, bath soap, and surface cleaner" },
    { label: "🍎 Fresh Fruit Platter", query: "Fresh apples, bananas, seasonal oranges and fruits" }
]

export default function AiRecipeAssistant() {
    const [isOpen, setIsOpen] = useState(false)
    const [listText, setListText] = useState("")
    const [loading, setLoading] = useState(false)
    const [bundleData, setBundleData] = useState<any>(null)
    const [addedSuccess, setAddedSuccess] = useState(false)

    const dispatch = useDispatch()
    const cartState = useSelector((state: RootState) => state.cart)
    const cartData = cartState?.cartData || []

    const handleSearchList = async (customPrompt?: string) => {
        const target = customPrompt || listText
        if (!target || target.trim() === "") {
            toast.error("Please enter or paste your grocery shopping list!")
            return
        }

        setLoading(true)
        setBundleData(null)
        setAddedSuccess(false)

        try {
            const res = await axios.post("/api/ai/recipe-to-cart", {
                query: target
            })

            if (res.data) {
                setBundleData(res.data)
            }
        } catch (error: any) {
            console.error("Grocery List Error:", error)
            toast.error(error?.response?.data?.error || "Could not match your grocery list. Please try again.")
        } finally {
            setLoading(false)
        }
    }

    const handleAddAllToCart = () => {
        if (!bundleData?.matchedProducts || bundleData.matchedProducts.length === 0) {
            toast.error("No matching supermarket products in stock.")
            return
        }

        let addedCount = 0
        bundleData.matchedProducts.forEach((item: any) => {
            const exists = cartData.some((c: any) => c._id === item._id?.toString())
            if (exists) {
                dispatch(increaseQuantity(item._id?.toString()))
            } else {
                dispatch(addToCart({
                    ...item,
                    _id: item._id?.toString(),
                    quantity: 1
                }))
            }
            addedCount++
        })

        setAddedSuccess(true)
        toast.success(`🎉 Added ${addedCount} grocery items to your cart!`, {
            duration: 4000,
            icon: '🛒'
        })
    }

    const totalEstimatedCost = bundleData?.matchedProducts?.reduce((sum: number, p: any) => sum + (Number(p.price) || 0), 0) || 0

    return (
        <>
            {/* 🌟 Floating Glow Smart Grocery List Pill */}
            <motion.button
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsOpen(true)}
                className="fixed bottom-20 sm:bottom-7 right-4 sm:right-7 z-40 bg-gradient-to-r from-green-600 via-emerald-600 to-green-700 text-white px-4 py-2.5 sm:px-5 sm:py-3 rounded-full shadow-2xl shadow-green-900/30 border-2 border-white/40 flex items-center gap-2 text-xs sm:text-sm font-black cursor-pointer group"
            >
                <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-300 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-400"></span>
                </span>
                <Sparkles size={16} className="text-amber-300 group-hover:rotate-12 transition-transform" />
                <span>Smart Grocery List</span>
            </motion.button>

            {/* 🛒 Instant Grocery List Matcher Drawer */}
            <AnimatePresence>
                {isOpen && (
                    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsOpen(false)}
                            className="fixed inset-0 bg-black/60 backdrop-blur-xs"
                        />

                        {/* Modal Box */}
                        <motion.div
                            initial={{ y: "100%", opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: "100%", opacity: 0 }}
                            transition={{ type: "spring", damping: 25, stiffness: 300 }}
                            className="relative w-full sm:max-w-2xl bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[90vh] overflow-hidden flex flex-col z-10"
                        >
                            {/* Modal Header */}
                            <div className="p-4 sm:p-5 bg-gradient-to-r from-green-700 via-green-600 to-emerald-700 text-white flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center">
                                        <ShoppingCart size={20} className="text-amber-300" />
                                    </div>
                                    <div>
                                        <h2 className="text-base sm:text-lg font-black tracking-tight flex items-center gap-1.5">
                                            Snapcart Smart List
                                            <span className="bg-amber-400 text-green-950 text-[10px] font-black px-2 py-0.5 rounded-full">
                                                10-Min Supermarket
                                            </span>
                                        </h2>
                                        <p className="text-xs text-green-100">
                                            Paste your home grocery list — we match items from our aisles and fill your cart in seconds!
                                        </p>
                                    </div>
                                </div>

                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center text-white transition cursor-pointer"
                                >
                                    <X size={16} />
                                </button>
                            </div>

                            {/* Scrollable Content */}
                            <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1">
                                {/* Paste List Area */}
                                <div className="space-y-2">
                                    <label className="text-xs font-black uppercase text-gray-700 block">
                                        Paste or type your grocery list:
                                    </label>
                                    <div className="space-y-2">
                                        <textarea
                                            rows={2}
                                            placeholder="e.g. 2 packets milk, brown bread, 1kg potatoes, tomatoes and surf excel"
                                            value={listText}
                                            onChange={(e) => setListText(e.target.value)}
                                            className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-2xl text-xs sm:text-sm font-semibold focus:ring-2 focus:ring-green-500 focus:bg-white outline-none transition resize-none"
                                        />

                                        <div className="flex justify-between items-center">
                                            <span className="text-[11px] text-gray-400 font-medium">
                                                💡 Type multiple items separated by commas or words
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => handleSearchList()}
                                                disabled={loading}
                                                className="px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-black transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50 active:scale-95 shadow-md"
                                            >
                                                {loading ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />}
                                                <span>Find My Groceries</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Quick Shopping Packs */}
                                <div className="space-y-2">
                                    <span className="text-xs font-black uppercase text-gray-500 block">
                                        One-Tap Popular Grocery Packs:
                                    </span>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                        {groceryPacks.map((pack) => (
                                            <button
                                                key={pack.label}
                                                type="button"
                                                onClick={() => {
                                                    setListText(pack.query)
                                                    handleSearchList(pack.query)
                                                }}
                                                className="p-2.5 bg-gray-50 hover:bg-green-50 hover:text-green-800 text-gray-700 rounded-2xl transition cursor-pointer border border-gray-200/80 text-left active:scale-95 group"
                                            >
                                                <span className="text-xs font-bold block">{pack.label}</span>
                                                <span className="text-[10px] text-gray-400 font-medium line-clamp-1 group-hover:text-green-600">
                                                    {pack.query}
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Loading state */}
                                {loading && (
                                    <div className="p-8 text-center space-y-3 bg-green-50/50 rounded-3xl border border-green-100">
                                        <Loader2 size={32} className="animate-spin text-green-600 mx-auto" />
                                        <p className="text-sm font-extrabold text-gray-800">
                                            Scanning Snapcart Supermarket Shelves...
                                        </p>
                                        <p className="text-xs text-gray-400">
                                            Matching your requested groceries with fresh items in stock!
                                        </p>
                                    </div>
                                )}

                                {/* Results Box */}
                                {bundleData && !loading && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 15 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="space-y-4 pt-2"
                                    >
                                        {/* Bundle Summary */}
                                        <div className="bg-green-50/70 border border-green-200 rounded-2xl p-4 flex items-center justify-between">
                                            <div>
                                                <h3 className="text-sm sm:text-base font-black text-green-950">
                                                    🧺 {bundleData.bundleTitle || "Matched Grocery Pack"}
                                                </h3>
                                                <p className="text-xs text-green-900 mt-0.5">
                                                    {bundleData.summary}
                                                </p>
                                            </div>
                                            <div className="text-right shrink-0">
                                                <span className="text-xs font-black text-green-700 bg-white px-2.5 py-1 rounded-xl border border-green-200 shadow-2xs">
                                                    {bundleData.matchedProducts?.length || 0} Items
                                                </span>
                                            </div>
                                        </div>

                                        {/* Supermarket Products Matched */}
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <h4 className="text-xs font-black uppercase text-gray-700 flex items-center gap-1.5">
                                                    <Package size={14} className="text-green-600" />
                                                    <span>Available in Mart ({bundleData.matchedProducts?.length || 0})</span>
                                                </h4>
                                                <span className="text-xs font-black text-green-700">
                                                    Est. Total: ₹{totalEstimatedCost}
                                                </span>
                                            </div>

                                            {bundleData.matchedProducts && bundleData.matchedProducts.length > 0 ? (
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                                    {bundleData.matchedProducts.map((prod: any) => (
                                                        <div
                                                            key={prod._id}
                                                            className="flex items-center gap-3 p-2.5 bg-white border border-gray-100 rounded-2xl shadow-2xs"
                                                        >
                                                            <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-gray-50 border border-gray-100 shrink-0">
                                                                <Image
                                                                    src={prod.image}
                                                                    alt={prod.name}
                                                                    fill
                                                                    className="object-cover"
                                                                />
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <h5 className="text-xs font-extrabold text-gray-800 truncate">
                                                                    {prod.name}
                                                                </h5>
                                                                <p className="text-[11px] text-gray-400 font-semibold">
                                                                    {prod.unit}
                                                                </p>
                                                            </div>
                                                            <div className="text-xs font-black text-green-700 shrink-0">
                                                                ₹{prod.price}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="text-xs text-gray-400 italic">
                                                    No direct grocery matches found for your query. Try individual product names like milk, bread, or tomato.
                                                </p>
                                            )}
                                        </div>

                                        {/* Unmatched Items callout */}
                                        {bundleData.unmatchedItems && bundleData.unmatchedItems.length > 0 && (
                                            <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200 text-xs text-amber-900">
                                                <span className="font-bold">Not currently in stock: </span>
                                                {bundleData.unmatchedItems.join(", ")}
                                            </div>
                                        )}
                                    </motion.div>
                                )}
                            </div>

                            {/* Modal Footer: 1-Click Fill Cart */}
                            {bundleData?.matchedProducts && bundleData.matchedProducts.length > 0 && (
                                <div className="p-4 bg-white border-t border-gray-100">
                                    <button
                                        type="button"
                                        onClick={handleAddAllToCart}
                                        disabled={addedSuccess}
                                        className={`w-full py-3.5 rounded-2xl text-xs sm:text-sm font-black transition flex items-center justify-center gap-2 cursor-pointer shadow-lg active:scale-95 ${
                                            addedSuccess
                                                ? "bg-emerald-700 text-white"
                                                : "bg-green-600 hover:bg-green-700 text-white"
                                        }`}
                                    >
                                        {addedSuccess ? (
                                            <>
                                                <Check size={18} /> Added All Items to Cart!
                                            </>
                                        ) : (
                                            <>
                                                <ShoppingCart size={18} /> Add All Items to Cart (₹{totalEstimatedCost})
                                            </>
                                        )}
                                    </button>
                                </div>
                            )}
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    )
}
