'use client'
import React, { useEffect } from 'react'
import { motion } from "motion/react"
import { ArrowRight, CheckCircle, Package, ShoppingBag, PackageCheck, Home } from 'lucide-react'
import Link from 'next/link'
import { useDispatch } from 'react-redux'
import { clearCart } from '@/redux/cartSlice'

function OrderSuccess() {
    const dispatch = useDispatch()

    useEffect(() => {
        dispatch(clearCart())
        if (typeof window !== 'undefined') {
            try {
                localStorage.removeItem('snapcart_cart')
                localStorage.removeItem('cart')
            } catch (e) {
                console.error(e)
            }
        }
    }, [dispatch])

    return (
        <div className='flex flex-col items-center justify-center min-h-[82vh] px-6 text-center bg-gradient-to-b from-green-50 via-emerald-50/40 to-white relative overflow-hidden'>
            <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{
                    type: "spring",
                    damping: 10,
                    stiffness: 100
                }}
                className='relative'
            >
                <CheckCircle className='text-green-600 w-24 h-24 md:w-28 md:h-28' />
                <motion.div
                    className='absolute inset-0'
                    initial={{ opacity: 0, scale: 0.6 }}
                    animate={{ opacity: [0.3, 0, 0.3], scale: [1, 0.6, 1] }}
                    transition={{
                        repeat: Infinity,
                        duration: 2,
                        ease: "easeInOut"
                    }}
                >
                    <div className='w-full h-full rounded-full bg-green-700 blur-2xl' />
                </motion.div>
            </motion.div>

            <motion.h1
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.3 }}
                className='text-3xl md:text-4xl font-extrabold text-green-700 mt-6 tracking-tight'
            >
                Order Placed Successfully!
            </motion.h1>

            <motion.p
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.6 }}
                className='text-gray-600 mt-3 text-sm md:text-base max-w-md leading-relaxed'
            >
                Thank you for shopping with Grocery! Your order has been placed and is being packed. You can continue shopping for more fresh items or view details in <Link href="/user/my-orders" className="font-semibold text-green-700 hover:underline">My Orders</Link>.
            </motion.p>

            <motion.div
                initial={{ y: 40, opacity: 0 }}
                animate={{ y: [0, -8, 0], opacity: 1 }}
                transition={{ delay: 0.8, duration: 2, repeat: Infinity, ease: "easeInOut" }}
                className="mt-8"
            >
                <div className="w-16 h-16 rounded-2xl bg-green-100 text-green-600 flex items-center justify-center mx-auto shadow-xs">
                    <Package className='w-9 h-9' />
                </div>
            </motion.div>

            {/* Buttons: Primary to Home Storefront, Secondary to Orders */}
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1, duration: 0.4 }}
                className="mt-10 flex flex-col sm:flex-row items-center gap-3 w-full max-w-sm justify-center"
            >
                <Link href="/" className="w-full sm:w-auto">
                    <motion.div
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.95 }}
                        className='flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white text-sm sm:text-base font-bold px-7 py-3.5 rounded-full shadow-lg hover:shadow-xl transition-all cursor-pointer'
                    >
                        <ShoppingBag size={18} />
                        <span>Continue Shopping</span>
                        <ArrowRight size={18} />
                    </motion.div>
                </Link>

                <Link href="/user/my-orders" className="w-full sm:w-auto">
                    <motion.div
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.95 }}
                        className='flex items-center justify-center gap-2 bg-white hover:bg-gray-100 text-gray-700 border border-gray-200 text-sm sm:text-base font-bold px-6 py-3.5 rounded-full shadow-xs transition-all cursor-pointer'
                    >
                        <PackageCheck size={18} className="text-green-600" />
                        <span>My Orders</span>
                    </motion.div>
                </Link>
            </motion.div>

            {/* Decorative background confetti particles */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: [0.2, 0.6, 0.2] }}
                transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut",
                }}
                className="absolute top-0 left-0 w-full h-full pointer-events-none"
            >
                <div className='absolute top-20 left-[10%] w-2.5 h-2.5 bg-green-400 rounded-full animate-bounce' />
                <div className='absolute top-32 left-[30%] w-2 h-2 bg-emerald-400 rounded-full animate-pulse' />
                <div className='absolute top-24 left-[50%] w-2.5 h-2.5 bg-green-400 rounded-full animate-bounce' />
                <div className='absolute top-16 left-[70%] w-2 h-2 bg-emerald-400 rounded-full animate-pulse' />
                <div className='absolute top-28 left-[85%] w-2 h-2 bg-green-400 rounded-full animate-bounce' />
            </motion.div>
        </div>
    )
}

export default OrderSuccess
