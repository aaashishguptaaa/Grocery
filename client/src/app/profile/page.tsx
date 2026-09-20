'use client'

import React, { useEffect, useState, useRef, ChangeEvent, FormEvent } from 'react'
import axios from 'axios'
import Link from 'next/link'
import { motion, AnimatePresence } from 'motion/react'
import { ArrowLeft, Bike, Camera, CheckCircle2, Crosshair, DollarSign, Eye, EyeOff, KeyRound, Lock, Mail, MapPin, Navigation, Package, Phone, Search, ShieldCheck, Sparkles, Store, Trash2, Truck, User, X } from 'lucide-react'
import dynamic from 'next/dynamic'
import { IPickedLocation } from '@/components/LocationPickerMap'

const LocationPickerMap = dynamic(() => import('@/components/LocationPickerMap'), {
    ssr: false,
    loading: () => (
        <div className="w-full h-64 bg-gray-100 flex items-center justify-center text-xs text-gray-400 rounded-2xl">
            Loading Interactive Location Picker Map...
        </div>
    )
})

export default function ProfilePage() {
    const [loading, setLoading] = useState<boolean>(true)
    const [saving, setSaving] = useState<boolean>(false)
    const [user, setUser] = useState<any>(null)
    const [stats, setStats] = useState<any>({})
    const [activeTab, setActiveTab] = useState<"personal" | "role" | "security">("personal")

    // Form fields
    const [name, setName] = useState<string>("")
    const [email, setEmail] = useState<string>("")
    const [mobile, setMobile] = useState<string>("")
    const [imagePreview, setImagePreview] = useState<string | null>(null)
    const [imageFile, setImageFile] = useState<File | null>(null)

    // Delivery boy fields
    const [vehicleType, setVehicleType] = useState<string>("Motorcycle")
    const [vehicleNumber, setVehicleNumber] = useState<string>("")
    const [emergencyContact, setEmergencyContact] = useState<string>("")

    // Customer address fields
    const [addressFullName, setAddressFullName] = useState<string>("")
    const [addressMobile, setAddressMobile] = useState<string>("")
    const [addressFull, setAddressFull] = useState<string>("")
    const [addressCity, setAddressCity] = useState<string>("")
    const [addressState, setAddressState] = useState<string>("Uttar Pradesh")
    const [addressPincode, setAddressPincode] = useState<string>("")
    const [addressLat, setAddressLat] = useState<number>(25.4358)
    const [addressLng, setAddressLng] = useState<number>(81.8463)

    // Admin store fields
    const [storeName, setStoreName] = useState<string>("Snapcart Central Mart")
    const [storePhone, setStorePhone] = useState<string>("+91 9876543210")
    const [storeAddress, setStoreAddress] = useState<string>("Central Mart, Prayagraj, UP - 211001")
    const [storeLat, setStoreLat] = useState<number>(25.4358)
    const [storeLng, setStoreLng] = useState<number>(81.8463)

    // Password fields
    const [currentPassword, setCurrentPassword] = useState<string>("")
    const [newPassword, setNewPassword] = useState<string>("")
    const [confirmPassword, setConfirmPassword] = useState<string>("")
    const [showPassword, setShowPassword] = useState<boolean>(false)

    // Feedback status
    const [alertMessage, setAlertMessage] = useState<{ text: string, type: "success" | "error" } | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const fetchProfile = async () => {
        try {
            const res = await axios.get('/api/user/profile')
            if (res.data?.user) {
                const u = res.data.user
                setUser(u)
                setStats(res.data.stats || {})

                setName(u.name || "")
                setEmail(u.email || "")
                setMobile(u.mobile || "")
                setImagePreview(u.image || null)

                // Delivery partner
                setVehicleType(u.vehicleType || "Motorcycle")
                setVehicleNumber(u.vehicleNumber || "")
                setEmergencyContact(u.emergencyContact || "")

                // Customer address
                if (u.defaultAddress) {
                    setAddressFullName(u.defaultAddress.fullName || u.name || "")
                    setAddressMobile(u.defaultAddress.mobile || u.mobile || "")
                    setAddressFull(u.defaultAddress.fullAddress || "")
                    setAddressCity(u.defaultAddress.city || "Prayagraj")
                    setAddressState(u.defaultAddress.state || "Uttar Pradesh")
                    setAddressPincode(u.defaultAddress.pincode || "")
                    if (u.defaultAddress.latitude) setAddressLat(u.defaultAddress.latitude)
                    if (u.defaultAddress.longitude) setAddressLng(u.defaultAddress.longitude)
                } else {
                    setAddressFullName(u.name || "")
                    setAddressMobile(u.mobile || "")
                }

                // Admin store details
                if (u.storeDetails) {
                    setStoreName(u.storeDetails.storeName || "Snapcart Central Mart")
                    setStorePhone(u.storeDetails.storePhone || "+91 9876543210")
                    setStoreAddress(u.storeDetails.storeAddress || "Central Mart, Prayagraj, UP - 211001")
                    if (u.storeDetails.latitude) setStoreLat(u.storeDetails.latitude)
                    if (u.storeDetails.longitude) setStoreLng(u.storeDetails.longitude)
                }
            }
        } catch (e: any) {
            setAlertMessage({ text: "Failed to load profile details", type: "error" })
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchProfile()
    }, [])

    const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                alert("Please select an image smaller than 5MB.")
                return
            }
            setImageFile(file)
            setImagePreview(URL.createObjectURL(file))
        }
    }

    // Handler when user picks a location on the interactive map
    const handleMapLocationSelect = (loc: IPickedLocation) => {
        setAddressFull(loc.fullAddress)
        setAddressCity(loc.city)
        setAddressState(loc.state)
        setAddressPincode(loc.pincode)
        setAddressLat(loc.latitude)
        setAddressLng(loc.longitude)
    }

    const handleStoreMapLocationSelect = (loc: IPickedLocation) => {
        setStoreAddress(`${loc.fullAddress}, ${loc.city} - ${loc.pincode}`)
        setStoreLat(loc.latitude)
        setStoreLng(loc.longitude)
    }

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault()
        setAlertMessage(null)

        if (newPassword) {
            if (newPassword.length < 6) {
                setAlertMessage({ text: "New password must be at least 6 characters long.", type: "error" })
                return
            }
            if (newPassword !== confirmPassword) {
                setAlertMessage({ text: "New passwords do not match.", type: "error" })
                return
            }
        }

        setSaving(true)
        try {
            const formData = new FormData()
            formData.append("name", name)
            formData.append("email", email)
            formData.append("mobile", mobile)

            if (imageFile) {
                formData.append("image", imageFile)
            }

            // Role specific data
            if (user?.role === "deliveryBoy") {
                formData.append("vehicleType", vehicleType)
                formData.append("vehicleNumber", vehicleNumber)
                formData.append("emergencyContact", emergencyContact)
            } else if (user?.role === "user") {
                const defaultAddress = {
                    fullName: addressFullName,
                    mobile: addressMobile,
                    fullAddress: addressFull,
                    city: addressCity,
                    state: addressState,
                    pincode: addressPincode,
                    latitude: addressLat,
                    longitude: addressLng
                }
                formData.append("defaultAddress", JSON.stringify(defaultAddress))
            } else if (user?.role === "admin") {
                const storeDetails = {
                    storeName,
                    storePhone,
                    storeAddress,
                    latitude: storeLat,
                    longitude: storeLng
                }
                formData.append("storeDetails", JSON.stringify(storeDetails))
            }

            // Password change
            if (newPassword) {
                formData.append("currentPassword", currentPassword)
                formData.append("newPassword", newPassword)
            }

            const res = await axios.post('/api/user/profile', formData)
            if (res.status === 200) {
                setUser(res.data.user)
                setImageFile(null)
                setCurrentPassword("")
                setNewPassword("")
                setConfirmPassword("")
                setAlertMessage({ text: "🎉 Profile updated successfully!", type: "success" })
            }
        } catch (err: any) {
            setAlertMessage({
                text: err?.response?.data?.message || "Failed to update profile. Please try again.",
                type: "error"
            })
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen pt-32 pb-24 flex items-center justify-center">
                <div className="text-center space-y-3">
                    <div className="w-12 h-12 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                    <p className="text-xs font-bold text-gray-400">Loading your profile...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="pt-28 w-[92%] md:w-[85%] max-w-4xl mx-auto pb-24 space-y-6">
            {/* Top Navigation Back Link */}
            <div className="flex items-center justify-between">
                <Link
                    href="/"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 rounded-2xl border border-gray-200 text-xs font-extrabold shadow-sm transition active:scale-95 cursor-pointer"
                >
                    <ArrowLeft size={16} className="text-green-600" />
                    <span>Back to Store</span>
                </Link>

                <h1 className="text-lg sm:text-xl font-black text-gray-800 flex items-center gap-2">
                    <User size={20} className="text-green-600" /> Account Settings
                </h1>
            </div>

            {/* Alert Message Banner */}
            <AnimatePresence>
                {alertMessage && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className={`p-4 rounded-2xl text-xs font-bold flex items-center justify-between border ${
                            alertMessage.type === "success"
                                ? "bg-green-50 text-green-900 border-green-200"
                                : "bg-red-50 text-red-900 border-red-200"
                        }`}
                    >
                        <span>{alertMessage.text}</span>
                        <button type="button" onClick={() => setAlertMessage(null)} className="p-1 cursor-pointer">
                            <X size={16} />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Profile Overview Card */}
            <div className="bg-gradient-to-r from-green-600 via-emerald-600 to-green-700 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
                <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
                    {/* Avatar with Camera Overlay */}
                    <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                        <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl overflow-hidden border-4 border-white/40 bg-white/20 backdrop-blur-md relative shadow-lg flex items-center justify-center">
                            {imagePreview ? (
                                <img src={imagePreview} alt={user?.name || "Avatar"} className="w-full h-full object-cover" />
                            ) : (
                                <User size={48} className="text-white/80" />
                            )}
                        </div>
                        
                        <div className="absolute inset-0 bg-black/40 rounded-3xl opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white">
                            <Camera size={24} className="animate-bounce" />
                        </div>

                        <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-white text-green-700 shadow-md flex items-center justify-center border border-green-100">
                            <Camera size={14} />
                        </div>

                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleImageChange}
                            accept="image/*"
                            className="hidden"
                        />
                    </div>

                    {/* Name, Email, Role and Stats */}
                    <div className="space-y-2 grow">
                        <div className="flex items-center justify-center sm:justify-start">
                            <h2 className="text-2xl sm:text-3xl font-black tracking-tight">{name || user?.name}</h2>
                        </div>

                        <p className="text-xs text-white/80 flex items-center justify-center sm:justify-start gap-1.5 font-medium">
                            <Mail size={13} /> {email || user?.email}
                        </p>
                        <p className="text-xs text-white/80 flex items-center justify-center sm:justify-start gap-1.5 font-medium">
                            <Phone size={13} /> {mobile || user?.mobile || "No Mobile Added"}
                        </p>

                        {/* Quick Role Stats Pills */}
                        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-2">
                            {user?.role === "user" && (
                                <>
                                    <span className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-xl text-xs font-bold">
                                        📦 {stats.totalOrders || 0} Orders Placed
                                    </span>
                                    <span className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-xl text-xs font-bold">
                                        ₹ {stats.totalSpent || 0} Total Spent
                                    </span>
                                </>
                            )}

                            {user?.role === "deliveryBoy" && (
                                <>
                                    <span className="bg-amber-400 text-amber-950 px-3 py-1 rounded-xl text-xs font-black shadow-xs flex items-center gap-1">
                                        ⭐ {stats.rating ? Number(stats.rating).toFixed(1) : "5.0"} ({stats.reviewsCount || 0} Reviews)
                                    </span>
                                    <span className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-xl text-xs font-bold">
                                        🛵 {stats.completedDeliveries || 0} Completed Trips
                                    </span>
                                    <span className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-xl text-xs font-bold">
                                        ₹ {stats.totalEarnings || 0} Earned
                                    </span>
                                </>
                            )}

                            {user?.role === "admin" && (
                                <>
                                    <span className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-xl text-xs font-bold">
                                        🛒 {stats.totalOrders || 0} Total Orders
                                    </span>
                                    <span className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-xl text-xs font-bold">
                                        👥 {stats.totalUsers || 0} Users
                                    </span>
                                    <span className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-xl text-xs font-bold">
                                        📦 {stats.totalGroceries || 0} Products
                                    </span>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Form Section with Navigation Tabs */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-md space-y-6">
                {/* Tabs */}
                <div className="flex bg-gray-100 p-1 rounded-2xl text-xs font-extrabold">
                    <button
                        type="button"
                        onClick={() => setActiveTab("personal")}
                        className={`flex-1 py-2.5 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 ${
                            activeTab === "personal" ? "bg-white text-green-700 shadow-sm" : "text-gray-500 hover:text-gray-800"
                        }`}
                    >
                        <User size={14} /> Personal Details
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveTab("role")}
                        className={`flex-1 py-2.5 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 ${
                            activeTab === "role" ? "bg-white text-green-700 shadow-sm" : "text-gray-500 hover:text-gray-800"
                        }`}
                    >
                        {user?.role === "deliveryBoy" ? <Bike size={14} /> : user?.role === "admin" ? <Store size={14} /> : <MapPin size={14} />}
                        <span>
                            {user?.role === "deliveryBoy" ? "Vehicle & Safety" : user?.role === "admin" ? "Store Info" : "Default Address"}
                        </span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveTab("security")}
                        className={`flex-1 py-2.5 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 ${
                            activeTab === "security" ? "bg-white text-green-700 shadow-sm" : "text-gray-500 hover:text-gray-800"
                        }`}
                    >
                        <Lock size={14} /> Password & Security
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* TAB 1: Personal Details */}
                    {activeTab === "personal" && (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between border-b pb-2">
                                <h3 className="font-black text-gray-800 text-sm flex items-center gap-2">
                                    <User size={16} className="text-green-600" /> Basic Information
                                </h3>
                                <span className="text-[11px] text-gray-400">Click photo above to upload new avatar</span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-black uppercase text-gray-600">Full Name</label>
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="Enter your full name"
                                        required
                                        className="w-full px-4 py-2.5 bg-gray-50 rounded-xl border border-gray-200 text-xs font-medium focus:ring-2 focus:ring-green-500 focus:bg-white outline-none"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-black uppercase text-gray-600">Email Address</label>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="Enter your email"
                                        required
                                        className="w-full px-4 py-2.5 bg-gray-50 rounded-xl border border-gray-200 text-xs font-medium focus:ring-2 focus:ring-green-500 focus:bg-white outline-none"
                                    />
                                </div>

                                <div className="space-y-1 sm:col-span-2">
                                    <label className="text-xs font-black uppercase text-gray-600">Mobile Number (10 Digits)</label>
                                    <div className="flex">
                                        <span className="inline-flex items-center px-3 rounded-l-xl border border-r-0 border-gray-200 bg-gray-100 text-gray-500 text-xs font-bold">
                                            +91
                                        </span>
                                        <input
                                            type="tel"
                                            maxLength={10}
                                            value={mobile}
                                            onChange={(e) => setMobile(e.target.value.replace(/\D/g, ''))}
                                            placeholder="9876543210"
                                            className="w-full px-4 py-2.5 bg-gray-50 rounded-r-xl border border-gray-200 text-xs font-medium focus:ring-2 focus:ring-green-500 focus:bg-white outline-none"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TAB 2: Role-Specific Settings */}
                    {activeTab === "role" && (
                        <div className="space-y-5">
                            {/* CUSTOMER: Default Delivery Address with Map Picker */}
                            {user?.role === "user" && (
                                <div className="space-y-5">
                                    <div className="border-b pb-2 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                                        <div>
                                            <h3 className="font-black text-gray-800 text-sm flex items-center gap-2">
                                                <MapPin size={16} className="text-red-500" /> Default Delivery Address
                                            </h3>
                                            <p className="text-[11px] text-gray-400">Pick on map or use GPS to auto-fill your delivery location</p>
                                        </div>
                                    </div>

                                    {/* 🗺️ INTERACTIVE EASY LOCATION SETUP (Map + GPS + Search) */}
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <label className="text-xs font-black uppercase text-gray-700 flex items-center gap-1.5">
                                                <Sparkles size={14} className="text-amber-500" />
                                                <span>Easy Location Setup (Drag Pin or Use GPS)</span>
                                            </label>
                                            <span className="text-[10px] text-gray-400 font-semibold">
                                                Auto-fills fields below
                                            </span>
                                        </div>

                                        <LocationPickerMap
                                            initialCoords={[addressLat || 25.4358, addressLng || 81.8463]}
                                            onLocationSelect={handleMapLocationSelect}
                                        />
                                    </div>

                                    {/* Auto-filled / Editable Address Form */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-gray-600">Receiver Full Name</label>
                                            <input
                                                type="text"
                                                value={addressFullName}
                                                onChange={(e) => setAddressFullName(e.target.value)}
                                                placeholder="e.g. Prince Customer"
                                                className="w-full px-4 py-2.5 bg-gray-50 rounded-xl border border-gray-200 text-xs outline-none focus:ring-2 focus:ring-green-500"
                                            />
                                        </div>

                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-gray-600">Contact Number</label>
                                            <input
                                                type="tel"
                                                maxLength={10}
                                                value={addressMobile}
                                                onChange={(e) => setAddressMobile(e.target.value.replace(/\D/g, ''))}
                                                placeholder="e.g. 9876543210"
                                                className="w-full px-4 py-2.5 bg-gray-50 rounded-xl border border-gray-200 text-xs outline-none focus:ring-2 focus:ring-green-500"
                                            />
                                        </div>

                                        <div className="space-y-1 sm:col-span-2">
                                            <label className="text-xs font-bold text-gray-600">Flat, House No., Street, Area</label>
                                            <input
                                                type="text"
                                                value={addressFull}
                                                onChange={(e) => setAddressFull(e.target.value)}
                                                placeholder="e.g. Flat 302, Green Valley Apartments, Teliyarganj"
                                                className="w-full px-4 py-2.5 bg-gray-50 rounded-xl border border-gray-200 text-xs outline-none focus:ring-2 focus:ring-green-500"
                                            />
                                        </div>

                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-gray-600">City</label>
                                            <input
                                                type="text"
                                                value={addressCity}
                                                onChange={(e) => setAddressCity(e.target.value)}
                                                placeholder="e.g. Prayagraj"
                                                className="w-full px-4 py-2.5 bg-gray-50 rounded-xl border border-gray-200 text-xs outline-none focus:ring-2 focus:ring-green-500"
                                            />
                                        </div>

                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-gray-600">Pincode</label>
                                            <input
                                                type="text"
                                                maxLength={6}
                                                value={addressPincode}
                                                onChange={(e) => setAddressPincode(e.target.value.replace(/\D/g, ''))}
                                                placeholder="e.g. 211001"
                                                className="w-full px-4 py-2.5 bg-gray-50 rounded-xl border border-gray-200 text-xs outline-none focus:ring-2 focus:ring-green-500"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* DELIVERY BOY: Vehicle & Safety Details */}
                            {user?.role === "deliveryBoy" && (
                                <div className="space-y-4">
                                    <div className="border-b pb-2">
                                        <h3 className="font-black text-gray-800 text-sm flex items-center gap-2">
                                            <Bike size={16} className="text-blue-600" /> Vehicle & Safety Details
                                        </h3>
                                        <p className="text-[11px] text-gray-400">Keep your vehicle and emergency information updated for support</p>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-gray-600">Vehicle Type</label>
                                            <select
                                                value={vehicleType}
                                                onChange={(e) => setVehicleType(e.target.value)}
                                                className="w-full px-4 py-2.5 bg-gray-50 rounded-xl border border-gray-200 text-xs font-semibold outline-none focus:ring-2 focus:ring-green-500 bg-white cursor-pointer"
                                            >
                                                <option value="Motorcycle">🏍️ Motorcycle / Bike</option>
                                                <option value="Scooter">🛵 Scooter / Scooty</option>
                                                <option value="Electric Scooter">⚡ Electric Vehicle (EV)</option>
                                                <option value="Bicycle">🚲 Bicycle</option>
                                            </select>
                                        </div>

                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-gray-600">Vehicle Registration Number</label>
                                            <input
                                                type="text"
                                                value={vehicleNumber}
                                                onChange={(e) => setVehicleNumber(e.target.value.toUpperCase())}
                                                placeholder="e.g. UP 70 AB 1234"
                                                className="w-full px-4 py-2.5 bg-gray-50 rounded-xl border border-gray-200 text-xs font-mono font-bold uppercase outline-none focus:ring-2 focus:ring-green-500"
                                            />
                                        </div>

                                        <div className="space-y-1 sm:col-span-2">
                                            <label className="text-xs font-bold text-gray-600">Emergency Alternate Phone Number</label>
                                            <input
                                                type="tel"
                                                maxLength={10}
                                                value={emergencyContact}
                                                onChange={(e) => setEmergencyContact(e.target.value.replace(/\D/g, ''))}
                                                placeholder="Contact number of family or guardian"
                                                className="w-full px-4 py-2.5 bg-gray-50 rounded-xl border border-gray-200 text-xs outline-none focus:ring-2 focus:ring-green-500"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* ADMIN: Store & Business Details with Map Setup */}
                            {user?.role === "admin" && (
                                <div className="space-y-5">
                                    <div className="border-b pb-2">
                                        <h3 className="font-black text-gray-800 text-sm flex items-center gap-2">
                                            <Store size={16} className="text-amber-600" /> Store & Business Information
                                        </h3>
                                        <p className="text-[11px] text-gray-400">This information appears on customer tax invoices and dispatch maps</p>
                                    </div>

                                    {/* Set Mart Location on Map */}
                                    <div className="space-y-2">
                                        <label className="text-xs font-black uppercase text-gray-700 flex items-center gap-1.5">
                                            <MapPin size={14} className="text-amber-600" />
                                            <span>Set Store / Mart Pickup Point on Map:</span>
                                        </label>
                                        <LocationPickerMap
                                            initialCoords={[storeLat || 25.4358, storeLng || 81.8463]}
                                            onLocationSelect={handleStoreMapLocationSelect}
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-gray-600">Store Business Name</label>
                                            <input
                                                type="text"
                                                value={storeName}
                                                onChange={(e) => setStoreName(e.target.value)}
                                                placeholder="e.g. Snapcart Central Mart"
                                                className="w-full px-4 py-2.5 bg-gray-50 rounded-xl border border-gray-200 text-xs outline-none focus:ring-2 focus:ring-green-500"
                                            />
                                        </div>

                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-gray-600">Support / Helpline Phone</label>
                                            <input
                                                type="text"
                                                value={storePhone}
                                                onChange={(e) => setStorePhone(e.target.value)}
                                                placeholder="e.g. +91 9876543210"
                                                className="w-full px-4 py-2.5 bg-gray-50 rounded-xl border border-gray-200 text-xs outline-none focus:ring-2 focus:ring-green-500"
                                            />
                                        </div>

                                        <div className="space-y-1 sm:col-span-2">
                                            <label className="text-xs font-bold text-gray-600">Mart Operating Address</label>
                                            <input
                                                type="text"
                                                value={storeAddress}
                                                onChange={(e) => setStoreAddress(e.target.value)}
                                                placeholder="e.g. Central Mart, Prayagraj, UP - 211001"
                                                className="w-full px-4 py-2.5 bg-gray-50 rounded-xl border border-gray-200 text-xs outline-none focus:ring-2 focus:ring-green-500"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* TAB 3: Security & Password */}
                    {activeTab === "security" && (
                        <div className="space-y-4">
                            <div className="border-b pb-2">
                                <h3 className="font-black text-gray-800 text-sm flex items-center gap-2">
                                    <KeyRound size={16} className="text-purple-600" /> Change Account Password
                                </h3>
                                <p className="text-[11px] text-gray-400">Leave these blank if you do not want to change your password</p>
                            </div>

                            <div className="space-y-3 max-w-md">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-gray-600">Current Password</label>
                                    <div className="relative">
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            value={currentPassword}
                                            onChange={(e) => setCurrentPassword(e.target.value)}
                                            placeholder="Enter your current password"
                                            className="w-full px-4 py-2.5 bg-gray-50 rounded-xl border border-gray-200 text-xs outline-none focus:ring-2 focus:ring-green-500"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                                        >
                                            {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-gray-600">New Password</label>
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        placeholder="Minimum 6 characters"
                                        className="w-full px-4 py-2.5 bg-gray-50 rounded-xl border border-gray-200 text-xs outline-none focus:ring-2 focus:ring-green-500"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-gray-600">Confirm New Password</label>
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        placeholder="Re-type new password"
                                        className="w-full px-4 py-2.5 bg-gray-50 rounded-xl border border-gray-200 text-xs outline-none focus:ring-2 focus:ring-green-500"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Submit Button */}
                    <div className="pt-4 border-t flex items-center justify-between">
                        <span className="text-[11px] text-gray-400 font-medium">
                            Changes take effect immediately across your account.
                        </span>

                        <button
                            type="submit"
                            disabled={saving}
                            className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-extrabold text-xs rounded-2xl shadow-lg transition flex items-center gap-2 cursor-pointer active:scale-95 disabled:bg-gray-300"
                        >
                            {saving ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    <span>Saving Changes...</span>
                                </>
                            ) : (
                                <>
                                    <CheckCircle2 size={16} />
                                    <span>Save Profile Changes</span>
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
