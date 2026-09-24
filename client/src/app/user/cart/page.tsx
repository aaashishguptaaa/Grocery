'use client'

import React from 'react'
import { motion } from 'motion/react'
import { ArrowLeft, Minus, Plus, ShoppingCart, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from '@/redux/store'
import { decreaseQuantity, increaseQuantity, removeFromCart } from '@/redux/cartSlice'
import Image from 'next/image'

export default function CartPage() {
    const router = useRouter()
    const dispatch = useDispatch()
    const { cartData } = useSelector((state: RootState) => state.cart)
    const { userData } = useSelector((state: RootState) => state.user)

    React.useEffect(() => {
        if (userData?.isBanned) {
            router.push('/account-suspended')
        }
    }, [userData, router])

    const hasOutOfStockItems = Array.isArray(cartData) && cartData.some((item: any) => item.inStock === false)

    const subtotal = Array.isArray(cartData)
        ? cartData.reduce((sum, item) => sum + (Number(item.price) * (Number(item.quantity) || 1)), 0)
        : 0

    return (
        <div className="pt-28 min-h-screen bg-gray-50/50 pb-24">
            <div className="w-[92%] md:w-[85%] max-w-5xl mx-auto">
                <button
                    onClick={() => router.push('/')}
                    className="inline-flex items-center gap-2 text-green-700 hover:text-green-800 font-bold transition mb-6 cursor-pointer"
                >
                    <ArrowLeft size={20} /> Back to home
                </button>

                <h1 className="text-3xl font-black text-gray-800 mb-8 flex items-center gap-2">
                    🛒 Your Shopping Cart
                </h1>

                {cartData && cartData.length > 0 ? (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        {/* Cart Items List */}
                        <div className="lg:col-span-7 space-y-4">
                            {cartData.map((item) => (
                                <div
                                    key={item._id}
                                    className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex items-center justify-between gap-4"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-gray-50 shrink-0">
                                            {item.image ? (
                                                <Image src={item.image} alt={item.name} fill className="object-cover" />
                                            ) : (
                                                <ShoppingCart className="text-gray-300 m-auto mt-4" size={24} />
                                            )}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-bold text-gray-800 text-base">{item.name}</h3>
                                                {item.inStock === false && (
                                                    <span className="text-[10px] font-black uppercase bg-red-100 text-red-700 px-2 py-0.5 rounded-md">
                                                        Out of Stock
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-xs text-gray-400">{item.unit}</p>
                                            <p className="text-sm font-extrabold text-green-700 mt-1">
                                                ₹{Number(item.price) * (item.quantity || 1)}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Quantity Controls */}
                                    <div className="flex items-center gap-3">
                                        <div className="flex items-center bg-gray-100 rounded-xl px-2 py-1 gap-3">
                                            <button
                                                onClick={() => dispatch(decreaseQuantity(item._id))}
                                                className="text-gray-600 hover:text-green-700 p-1"
                                            >
                                                <Minus size={14} />
                                            </button>
                                            <span className="font-bold text-sm text-gray-800">{item.quantity}</span>
                                            <button
                                                onClick={() => dispatch(increaseQuantity(item._id))}
                                                className="text-gray-600 hover:text-green-700 p-1"
                                            >
                                                <Plus size={14} />
                                            </button>
                                        </div>

                                        <button
                                            onClick={() => dispatch(removeFromCart(item._id))}
                                            className="text-red-400 hover:text-red-600 p-1.5 transition"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Order Summary */}
                        <div className="lg:col-span-5">
                            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-4 sticky top-28">
                                <h2 className="text-lg font-bold text-gray-800">Order Summary</h2>

                                <div className="space-y-2 text-sm text-gray-600 pb-3 border-b border-gray-100">
                                    <div className="flex justify-between">
                                        <span>Subtotal</span>
                                        <span className="font-semibold text-gray-800">₹{subtotal}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Delivery Fee</span>
                                        <span className="font-semibold text-green-600">FREE</span>
                                    </div>
                                </div>

                                <div className="flex justify-between text-base font-bold text-gray-800 pt-1">
                                    <span>Final Total</span>
                                    <span className="text-green-700 text-2xl font-black">₹{subtotal}</span>
                                </div>

                                {hasOutOfStockItems && (
                                    <div className="p-3 bg-red-50 text-red-700 rounded-2xl border border-red-200 text-xs font-bold flex items-center gap-2">
                                        <span>⚠️</span>
                                        <span>Some items in your cart are currently out of stock. Please remove them to proceed.</span>
                                    </div>
                                )}

                                <button
                                    onClick={() => router.push('/user/checkout')}
                                    disabled={Boolean(hasOutOfStockItems)}
                                    className="w-full py-4 bg-green-600 hover:bg-green-700 text-white font-black rounded-2xl shadow-xl transition flex items-center justify-center gap-2 cursor-pointer text-base disabled:bg-gray-300 disabled:cursor-not-allowed"
                                >
                                    Proceed to Checkout
                                </button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="bg-white rounded-3xl p-16 text-center border border-gray-100 shadow-sm space-y-4">
                        <ShoppingCart size={56} className="text-gray-200 mx-auto" />
                        <h3 className="text-xl font-bold text-gray-700">Your Cart is Empty</h3>
                        <p className="text-sm text-gray-400 max-w-sm mx-auto">
                            Add some fresh groceries to your cart to proceed with checkout!
                        </p>
                        <button
                            onClick={() => router.push('/')}
                            className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-2xl shadow-lg transition cursor-pointer"
                        >
                            Start Shopping
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}