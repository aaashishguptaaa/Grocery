'use client'

import React from 'react'
import HeroSection from './HeroSection'
import CategorySlider from './CategorySlider'
import GroceryItemCard from './GroceryItemCard'
import { IGrocery } from '@/models/grocery.model'
import { Search, ShoppingBag, Sparkles, Tag } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { motion } from 'motion/react'

export default function UserDashboard({
    groceryList = [],
    allGroceries = [],
    activeCategory,
    searchQuery
}: {
    groceryList: IGrocery[],
    allGroceries?: IGrocery[],
    activeCategory?: string,
    searchQuery?: string
}) {
    const router = useRouter()

    const recommendations = (allGroceries.length > 0 ? allGroceries : groceryList)
        .filter(item => !groceryList.some(g => g._id?.toString() === item._id?.toString()))
        .slice(0, 8)

    return (
        <div className="min-h-screen bg-[#f8fafc] pb-24 sm:pb-10">
            <HeroSection />
            <CategorySlider activeCategory={activeCategory} />

            {/* Main Products Section */}
            <div id="products" className="w-[96%] sm:w-[94%] md:w-[92%] max-w-7xl mx-auto mt-4 sm:mt-6 scroll-mt-28">

                {/* Section Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 sm:mb-6">
                    <div>
                        <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-gray-800 flex items-center gap-2 tracking-tight">
                            {searchQuery
                                ? <><Search size={22} className="text-green-600" /> Results for &ldquo;{searchQuery}&rdquo;</>
                                : activeCategory
                                    ? <><Tag size={22} className="text-green-600" /> {activeCategory}</>
                                    : <>✨ Popular Items</>
                            }
                        </h2>
                        <p className="text-xs sm:text-sm text-gray-400 mt-1">
                            {searchQuery
                                ? `${groceryList.length} item${groceryList.length !== 1 ? 's' : ''} found`
                                : activeCategory
                                    ? `Showing all products in ${activeCategory}`
                                    : "Handpicked essentials at the best prices"
                            }
                        </p>
                    </div>

                    {(searchQuery || activeCategory) && (
                        <button
                            onClick={() => router.push('/')}
                            className="inline-flex items-center gap-1.5 bg-green-100 hover:bg-green-200 text-green-800 text-xs font-bold px-4 py-2 rounded-xl transition shadow-sm cursor-pointer w-fit active:scale-95"
                        >
                            {searchQuery ? <Search size={13} /> : <Tag size={13} />}
                            Clear Filter ✕
                        </button>
                    )}
                </div>

                {/* Product Grid */}
                {groceryList.length > 0 ? (
                    <motion.div
                        className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 md:gap-5"
                        initial="hidden"
                        animate="visible"
                        variants={{
                            hidden: {},
                            visible: { transition: { staggerChildren: 0.04 } }
                        }}
                    >
                        {groceryList.map((item, i) => (
                            <motion.div
                                key={item._id?.toString()}
                                variants={{
                                    hidden: { opacity: 0, y: 18 },
                                    visible: { opacity: 1, y: 0, transition: { duration: 0.35 } }
                                }}
                            >
                                <GroceryItemCard item={item} />
                            </motion.div>
                        ))}
                    </motion.div>
                ) : (
                    <div className="bg-white rounded-3xl p-10 sm:p-16 text-center border border-gray-100 shadow-sm space-y-4">
                        <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto">
                            <ShoppingBag size={32} className="text-gray-300" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-700">No items found for &ldquo;{searchQuery || activeCategory}&rdquo;</h3>
                        <p className="text-xs text-gray-400">Don't worry! Explore our full grocery collection below.</p>
                        <button
                            onClick={() => router.push('/')}
                            className="px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white font-bold text-sm rounded-xl shadow transition cursor-pointer active:scale-95"
                        >
                            Explore All Groceries
                        </button>
                    </div>
                )}

                {/* Recommendations */}
                {recommendations.length > 0 && (
                    <div className="mt-12 pt-8 border-t border-gray-200/70">
                        <div className="flex items-center justify-between mb-5">
                            <div className="flex items-center gap-2.5">
                                <div className="p-2 bg-amber-100 text-amber-700 rounded-xl">
                                    <Sparkles size={18} />
                                </div>
                                <div>
                                    <h3 className="text-lg sm:text-xl font-extrabold text-gray-800">You May Also Like</h3>
                                    <p className="text-xs text-gray-400">Popular items customers love to add</p>
                                </div>
                            </div>
                            <button onClick={() => router.push('/')} className="text-xs font-bold text-green-600 hover:text-green-700 transition cursor-pointer">
                                See all →
                            </button>
                        </div>

                        {/* Horizontal scroll on mobile, grid on larger screens */}
                        <div className="flex gap-3 sm:gap-4 overflow-x-auto sm:grid sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 [scrollbar-width:none] pb-2">
                            {recommendations.map((item) => (
                                <div key={item._id?.toString()} className="min-w-[160px] sm:min-w-0 shrink-0 sm:shrink">
                                    <GroceryItemCard item={item} />
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}