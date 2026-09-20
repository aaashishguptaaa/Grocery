'use client'

import React, { useEffect, useState } from 'react'
import { motion } from 'motion/react'
import { ArrowLeft, Heart, ShoppingBag } from 'lucide-react'
import { useRouter } from 'next/navigation'
import GroceryItemCard from '@/components/GroceryItemCard'

export default function WishlistPage() {
    const router = useRouter()
    const [wishlist, setWishlist] = useState<any[]>([])

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const saved = JSON.parse(localStorage.getItem('snapcart_wishlist') || '[]')
            setWishlist(saved)
        }
    }, [])

    return (
        <div className="pt-28 min-h-screen bg-gray-50/50 pb-24">
            <div className="w-[92%] md:w-[85%] max-w-5xl mx-auto">
                <button
                    onClick={() => router.push('/')}
                    className="inline-flex items-center gap-2 text-green-700 hover:text-green-800 font-bold transition mb-6 cursor-pointer"
                >
                    <ArrowLeft size={20} /> Back to Store
                </button>

                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-black text-gray-800 flex items-center gap-2">
                            <Heart className="text-red-500 fill-red-500" /> My Saved Wishlist
                        </h1>
                        <p className="text-sm text-gray-500 mt-1">Your favorite products saved to buy later</p>
                    </div>
                    <span className="text-xs font-bold text-gray-500 bg-white border px-3.5 py-1.5 rounded-full shadow-sm">
                        {wishlist.length} Items Saved
                    </span>
                </div>

                {wishlist.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
                        {wishlist.map((item) => (
                            <GroceryItemCard key={item._id} item={item} />
                        ))}
                    </div>
                ) : (
                    <div className="bg-white rounded-3xl p-16 text-center border border-gray-100 shadow-sm space-y-4">
                        <Heart size={56} className="text-gray-200 mx-auto" />
                        <h3 className="text-xl font-bold text-gray-700">Your Wishlist is Empty</h3>
                        <p className="text-sm text-gray-400 max-w-sm mx-auto">
                            Click the ❤️ icon on any grocery item on the home page to save it here for later!
                        </p>
                        <button
                            onClick={() => router.push('/')}
                            className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-2xl shadow-lg transition cursor-pointer"
                        >
                            Explore Groceries
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}