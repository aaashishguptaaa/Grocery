'use client'

import React, { useEffect, useState } from 'react'
import { motion } from "motion/react"
import { ArrowLeft, CheckCircle2, CreditCard, Crosshair, Home, Loader2, LocateFixed, MapPin, Phone, Search, ShieldCheck, Truck, User } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useSelector, useDispatch } from 'react-redux'
import { RootState } from '@/redux/store'
import { clearCart } from '@/redux/cartSlice'
import axios from 'axios'
import dynamic from 'next/dynamic'

const CheckOutMap = dynamic(() => import("@/components/CheckoutMap"), {
    ssr: false,
    loading: () => <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400">Loading Map...</div>
})

declare global {
    interface Window {
        Razorpay: any
    }
}

export default function CheckOut() {
    const router = useRouter()
    const dispatch = useDispatch()
    const { userData } = useSelector((state: RootState) => state.user)
    const { cartData } = useSelector((state: RootState) => state.cart)
    const [position, setPosition] = useState<[number, number]>([25.4358, 81.8463])
    const [paymentMethod, setPaymentMethod] = useState<"cod" | "online">("online")
    const [loading, setLoading] = useState(false)
    const [detectingLocation, setDetectingLocation] = useState(false)
    const [searchQuery, setSearchQuery] = useState("")
    const [searchLoading, setSearchLoading] = useState(false)

    // Address fields
    const [fullName, setFullName] = useState("")
    const [mobile, setMobile] = useState("")
    const [city, setCity] = useState("")
    const [state, setState] = useState("")
    const [pincode, setPincode] = useState("")
    const [fullAddress, setFullAddress] = useState("")

    useEffect(() => {
        if (userData) {
            setFullName(userData.name || "")
            setMobile(userData.mobile || "")
        }
    }, [userData])

    // Load Razorpay Checkout Script
    useEffect(() => {
        const script = document.createElement("script")
        script.src = "https://checkout.razorpay.com/v1/checkout.js"
        script.async = true
        document.body.appendChild(script)
        return () => {
            document.body.removeChild(script)
        }
    }, [])

    // Reverse Geocode
    const reverseGeocode = async (lat: number, lon: number) => {
        try {
            const res = await axios.get(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&addressdetails=1`)
            if (res.data) {
                const addr = res.data.address || {}
                setFullAddress(res.data.display_name || "")
                setCity(addr.city || addr.town || addr.village || addr.suburb || addr.county || "")
                setState(addr.state || "")
                setPincode(addr.postcode || "")
            }
        } catch (e) {
            console.log("Geocode error", e)
        }
    }

    const detectCurrentLocation = () => {
        if (typeof window !== "undefined" && navigator.geolocation) {
            setDetectingLocation(true)
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    const lat = pos.coords.latitude
                    const lon = pos.coords.longitude
                    setPosition([lat, lon])
                    reverseGeocode(lat, lon)
                    setDetectingLocation(false)
                },
                (err) => {
                    console.log("Geolocation error", err)
                    setDetectingLocation(false)
                },
                { enableHighAccuracy: true, timeout: 10000 }
            )
        }
    }

    useEffect(() => {
        detectCurrentLocation()
    }, [])

    const handleSearchLocation = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!searchQuery.trim()) return
        setSearchLoading(true)
        try {
            const res = await axios.get(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1`)
            if (res.data && res.data.length > 0) {
                const lat = parseFloat(res.data[0].lat)
                const lon = parseFloat(res.data[0].lon)
                setPosition([lat, lon])
                reverseGeocode(lat, lon)
            } else {
                alert("Location not found. Try dragging the map pin.")
            }
        } catch (e) {
            console.log(e)
        } finally {
            setSearchLoading(false)
        }
    }

    const subtotal = Array.isArray(cartData) ? cartData.reduce((sum, item) => sum + (Number(item.price) * (Number(item.quantity) || 1)), 0) : 0
    const finalTotal = subtotal

    const handlePlaceOrder = async () => {
        if (!fullName || !mobile || !city || !state || !pincode || !fullAddress) {
            alert("Please fill in complete delivery address details.")
            return
        }
        if (!cartData || cartData.length === 0) {
            alert("Your cart is empty!")
            return
        }

        const outOfStockItems = cartData.filter((item: any) => item.inStock === false)
        if (outOfStockItems.length > 0) {
            alert(`"${outOfStockItems[0].name}" is currently out of stock. Please remove it from your cart to proceed.`)
            router.push('/user/cart')
            return
        }

        const orderItems = cartData.map(item => ({
            grocery: item._id,
            name: item.name,
            price: String(item.price),
            unit: item.unit || "unit",
            image: item.image || "",
            quantity: Number(item.quantity) || 1
        }))

        const orderAddress = {
            fullName,
            mobile,
            city,
            state,
            pincode,
            fullAddress,
            latitude: position[0],
            longitude: position[1]
        }

        // 1. CASH ON DELIVERY
        if (paymentMethod === "cod") {
            setLoading(true)
            try {
                const res = await axios.post("/api/user/order", {
                    user: userData?._id,
                    items: orderItems,
                    totalAmount: finalTotal,
                    paymentMethod: "cod",
                    isPaid: false,
                    address: orderAddress
                })
                if (res.status === 200 || res.status === 201) {
                    dispatch(clearCart())
                    router.push(`/user/order-success?orderId=${res.data._id}`)
                }
            } catch (err) {
                console.error(err)
                alert("Failed to place COD order.")
            } finally {
                setLoading(false)
            }
            return
        }

        // 2. AUTOMATED RAZORPAY UPI / GPAY / CARDS
        setLoading(true)
        try {
            // Create Razorpay Order
            const orderRes = await axios.post("/api/user/razorpay", { amount: finalTotal })
            const razorpayOrder = orderRes.data

            const options = {
                key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_test_TVIByru02k54XI",
                amount: razorpayOrder.amount,
                currency: "INR",
                name: "Snapcart Grocery Store",
                description: `Order Payment of ₹${finalTotal}`,
                order_id: razorpayOrder.id,
                prefill: {
                    name: fullName,
                    contact: mobile,
                    email: userData?.email || ""
                },
                theme: {
                    color: "#16a34a"
                },
                handler: async function (response: any) {
                    // Send to backend to verify cryptographic signature & save order
                    try {
                        const verifyRes = await axios.post("/api/user/razorpay-verify", {
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                            orderData: {
                                items: orderItems,
                                totalAmount: finalTotal,
                                address: orderAddress
                            }
                        })

                        if (verifyRes.status === 201 || verifyRes.status === 200) {
                            dispatch(clearCart())
                            router.push(`/user/order-success?orderId=${verifyRes.data._id}`)
                        }
                    } catch (err) {
                        alert("Payment verification failed. Please contact support.")
                    }
                }
            }

            const rzp = new window.Razorpay(options)
            rzp.on("payment.failed", function (response: any) {
                alert(`Payment Failed: ${response.error.description}`)
            })
            rzp.open()
        } catch (error) {
            console.error("Razorpay initiation error:", error)
            alert("Could not start payment. Please try again.")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="pt-24 min-h-screen bg-green-50/50 pb-20">
            <div className="w-[92%] md:w-[85%] max-w-6xl mx-auto">
                <button
                    onClick={() => router.back()}
                    className="inline-flex items-center gap-2 text-green-700 hover:text-green-800 font-bold mb-6 transition cursor-pointer"
                >
                    <ArrowLeft size={20} /> Back to cart
                </button>

                <h1 className="text-3xl font-extrabold text-green-800 text-center mb-8">Checkout</h1>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Left: Address & Map */}
                    <div className="lg:col-span-7 space-y-6">
                        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-4">
                            <div className="flex justify-between items-center">
                                <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                    <MapPin className="text-green-600" /> Delivery Address
                                </h2>

                                <button
                                    type="button"
                                    onClick={detectCurrentLocation}
                                    disabled={detectingLocation}
                                    className="px-3.5 py-1.5 bg-green-50 hover:bg-green-100 text-green-700 font-bold text-xs rounded-full flex items-center gap-1.5 transition cursor-pointer"
                                >
                                    {detectingLocation ? <Loader2 className="animate-spin w-3.5 h-3.5" /> : <LocateFixed size={14} />}
                                    {detectingLocation ? "Detecting GPS..." : "Detect Live Location"}
                                </button>
                            </div>

                            <div className="space-y-3">
                                <div className="relative">
                                    <User className="absolute left-3.5 top-3.5 text-gray-400 w-4 h-4" />
                                    <input
                                        type="text"
                                        placeholder="Full Name"
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-green-500 outline-none text-sm"
                                    />
                                </div>

                                <div className="relative">
                                    <Phone className="absolute left-3.5 top-3.5 text-gray-400 w-4 h-4" />
                                    <input
                                        type="text"
                                        placeholder="Mobile Number"
                                        value={mobile}
                                        onChange={(e) => setMobile(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-green-500 outline-none text-sm"
                                    />
                                </div>

                                <div className="relative">
                                    <Home className="absolute left-3.5 top-3.5 text-gray-400 w-4 h-4" />
                                    <input
                                        type="text"
                                        placeholder="Full Address / Landmark"
                                        value={fullAddress}
                                        onChange={(e) => setFullAddress(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-green-500 outline-none text-sm"
                                    />
                                </div>

                                <div className="grid grid-cols-3 gap-3">
                                    <input
                                        type="text"
                                        placeholder="City"
                                        value={city}
                                        onChange={(e) => setCity(e.target.value)}
                                        className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-green-500 outline-none text-sm"
                                    />
                                    <input
                                        type="text"
                                        placeholder="State"
                                        value={state}
                                        onChange={(e) => setState(e.target.value)}
                                        className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-green-500 outline-none text-sm"
                                    />
                                    <input
                                        type="text"
                                        placeholder="Pincode"
                                        value={pincode}
                                        onChange={(e) => setPincode(e.target.value)}
                                        className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-green-500 outline-none text-sm"
                                    />
                                </div>
                            </div>

                            {/* Location Search Bar */}
                            <form onSubmit={handleSearchLocation} className="flex gap-2">
                                <div className="relative grow">
                                    <Search className="absolute left-3.5 top-3 text-gray-400 w-4 h-4" />
                                    <input
                                        type="text"
                                        placeholder="Search area, landmark or street..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-green-500 outline-none text-xs"
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={searchLoading}
                                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded-xl transition cursor-pointer disabled:bg-gray-300"
                                >
                                    {searchLoading ? "Searching..." : "Search"}
                                </button>
                            </form>

                            {/* Interactive Map */}
                            <div className="w-full h-64 rounded-2xl overflow-hidden border border-gray-200 shadow-inner relative">
                                <CheckOutMap 
                                    position={position} 
                                    setPosition={(newPos: [number, number]) => {
                                        setPosition(newPos)
                                        reverseGeocode(newPos[0], newPos[1])
                                    }} 
                                />
                            </div>
                            <p className="text-[11px] text-gray-400 text-center">
                                📍 Click anywhere on map or drag red pin to set your exact doorstep.
                            </p>
                        </div>
                    </div>

                    {/* Right: Payment & Summary */}
                    <div className="lg:col-span-5 space-y-6">
                        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-4">
                            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                <CreditCard className="text-green-600" /> Select Payment Method
                            </h2>

                            <div className="space-y-3">
                                {/* Razorpay Automated UPI / Cards Option */}
                                <div
                                    onClick={() => setPaymentMethod("online")}
                                    className={`p-4 rounded-2xl border-2 flex items-center justify-between cursor-pointer transition ${
                                        paymentMethod === "online" ? "border-green-600 bg-green-50/60 ring-2 ring-green-100" : "border-gray-200 hover:border-gray-300"
                                    }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-xl bg-green-100 flex items-center justify-center text-green-700">
                                            <CreditCard size={20} />
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-800 text-sm">Pay Online (UPI, GPay, Paytm, Cards)</p>
                                            <p className="text-xs text-green-600 font-semibold">⚡ Instant Automatic Bank Verification</p>
                                        </div>
                                    </div>
                                    <input type="radio" checked={paymentMethod === "online"} readOnly className="accent-green-600" />
                                </div>

                                {/* Cash on Delivery Option */}
                                <div
                                    onClick={() => setPaymentMethod("cod")}
                                    className={`p-4 rounded-2xl border-2 flex items-center justify-between cursor-pointer transition ${
                                        paymentMethod === "cod" ? "border-green-600 bg-green-50/60 ring-2 ring-green-100" : "border-gray-200 hover:border-gray-300"
                                    }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center text-gray-700">
                                            <Truck size={20} />
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-800 text-sm">Cash on Delivery (COD)</p>
                                            <p className="text-xs text-gray-400">Pay cash at doorstep</p>
                                        </div>
                                    </div>
                                    <input type="radio" checked={paymentMethod === "cod"} readOnly className="accent-green-600" />
                                </div>
                            </div>
                        </div>

                        {/* Order Summary */}
                        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-4">
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
                                <span className="text-green-700 text-2xl font-black">₹{finalTotal}</span>
                            </div>

                            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700 bg-emerald-50 py-2 px-3 rounded-xl">
                                <ShieldCheck size={16} /> 100% Secure Payment powered by Razorpay
                            </div>

                            <button
                                onClick={handlePlaceOrder}
                                disabled={loading}
                                className="w-full py-4 bg-green-600 hover:bg-green-700 text-white font-black rounded-2xl shadow-xl transition-all flex items-center justify-center gap-2 cursor-pointer disabled:bg-gray-300 text-base"
                            >
                                {loading ? <Loader2 className="animate-spin w-5 h-5" /> : (
                                    paymentMethod === "online" ? `Pay ₹${finalTotal} via Razorpay` : "Place Order (COD)"
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}