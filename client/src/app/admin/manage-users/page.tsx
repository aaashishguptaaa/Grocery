'use client'

import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { motion } from 'motion/react'
import { ArrowLeft, Bike, Crown, Loader2, MessageSquare, Phone, Search, ShieldCheck, Trash2, User, Users } from 'lucide-react'
import Link from 'next/link'

interface IUser {
    _id: string
    name: string
    email: string
    mobile?: string
    role: "user" | "deliveryBoy" | "admin"
    isOnline?: boolean
}

export default function ManageUsers() {
    const [users, setUsers] = useState<IUser[]>([])
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState<"deliveryBoy" | "admin" | "user">("deliveryBoy")
    const [searchQuery, setSearchQuery] = useState("")
    const [updatingId, setUpdatingId] = useState<string | null>(null)

    const fetchUsers = async () => {
        try {
            const res = await axios.get('/api/admin/get-users')
            if (res.data) {
                setUsers(res.data)
            }
        } catch (e) {
            console.log(e)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchUsers()
    }, [])

    const handleRoleChange = async (userId: string, newRole: string) => {
        const roleLabel = newRole === "admin" ? "Store Admin 👑" : newRole === "deliveryBoy" ? "Delivery Partner 🛵" : "Regular Customer 👤"
        if (!confirm(`Are you sure you want to change this person's role to ${roleLabel}?`)) return
        setUpdatingId(userId)
        try {
            await axios.post('/api/admin/update-role', {
                userId,
                role: newRole
            })
            setUsers(prev => prev.map(u => u._id === userId ? { ...u, role: newRole as any } : u))
            alert(`✅ Role updated to ${roleLabel}!`)
        } catch (e) {
            console.log(e)
            alert("Failed to update role.")
        } finally {
            setUpdatingId(null)
        }
    }

    const deliveryBoys = users.filter(u => u.role === "deliveryBoy")
    const admins = users.filter(u => u.role === "admin")
    const regularUsers = users.filter(u => u.role === "user")

    const displayedUsers = users.filter(u => {
        const matchesTab = u.role === activeTab
        const matchesSearch = searchQuery.trim() === "" || 
            u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            u.mobile?.includes(searchQuery)

        if (searchQuery.trim() !== "") {
            return matchesSearch
        }
        return matchesTab
    })

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-[#f8fafc] gap-3">
                <Loader2 className="w-10 h-10 animate-spin text-green-600" />
                <p className="text-xs font-bold text-gray-400">Loading user records...</p>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#f8fafc] pt-24 sm:pt-28 pb-20">
            <div className="w-[94%] sm:w-[90%] max-w-5xl mx-auto space-y-6">
                {/* Back Link */}
                <Link 
                    href="/" 
                    className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-gray-600 hover:text-green-700 bg-white px-3.5 py-2 rounded-xl border border-gray-200/80 shadow-xs transition"
                >
                    <ArrowLeft size={16} className="text-green-600" /> Back to Storefront
                </Link>

                {/* Header & Search */}
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-green-100 text-green-700 flex items-center justify-center font-bold">
                            <Users size={24} />
                        </div>
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-black text-gray-800 tracking-tight">
                                Manage Staff & Users
                            </h1>
                            <p className="text-xs sm:text-sm text-gray-400 font-medium mt-0.5">
                                Promote delivery riders, assign store admins, and view customer directories.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <Link
                            href="/admin/customer-chats"
                            className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3.5 py-2.5 rounded-2xl shadow-sm transition whitespace-nowrap"
                        >
                            <MessageSquare size={15} /> Support Chats
                        </Link>
                        {/* Search Bar */}
                        <div className="relative flex-1 sm:w-64">
                            <Search className="absolute left-3.5 top-3 text-gray-400 w-4 h-4" />
                            <input
                                type="text"
                                placeholder="Search by name, email, phone..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 bg-gray-50/80 hover:bg-white focus:bg-white rounded-2xl border border-gray-200 focus:ring-2 focus:ring-green-500 outline-none text-xs font-semibold shadow-2xs transition"
                            />
                        </div>
                    </div>
                </div>

                {/* Metric Summary Strip */}
                <div className="grid grid-cols-3 gap-3 sm:gap-4">
                    <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm text-center">
                        <span className="text-2xl">🛵</span>
                        <div className="text-xl sm:text-2xl font-black text-gray-800 mt-1">{deliveryBoys.length}</div>
                        <div className="text-[11px] sm:text-xs font-bold text-gray-500">Delivery Fleet</div>
                    </div>
                    <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm text-center">
                        <span className="text-2xl">👑</span>
                        <div className="text-xl sm:text-2xl font-black text-gray-800 mt-1">{admins.length}</div>
                        <div className="text-[11px] sm:text-xs font-bold text-gray-500">Store Admins</div>
                    </div>
                    <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm text-center">
                        <span className="text-2xl">👥</span>
                        <div className="text-xl sm:text-2xl font-black text-gray-800 mt-1">{regularUsers.length}</div>
                        <div className="text-[11px] sm:text-xs font-bold text-gray-500">Registered Users</div>
                    </div>
                </div>

                {/* Filter Tabs */}
                <div className="flex bg-gray-100/80 p-1.5 rounded-2xl gap-1.5 text-xs font-bold border border-gray-200/60">
                    <button
                        onClick={() => { setActiveTab("deliveryBoy"); setSearchQuery(""); }}
                        className={`flex-1 py-2.5 rounded-xl transition flex items-center justify-center gap-2 cursor-pointer ${
                            activeTab === "deliveryBoy" && searchQuery === "" ? "bg-white text-green-700 shadow-md font-black" : "text-gray-500 hover:text-gray-800"
                        }`}
                    >
                        <Bike size={16} /> 🛵 Delivery Partners ({deliveryBoys.length})
                    </button>

                    <button
                        onClick={() => { setActiveTab("admin"); setSearchQuery(""); }}
                        className={`flex-1 py-2.5 rounded-xl transition flex items-center justify-center gap-2 cursor-pointer ${
                            activeTab === "admin" && searchQuery === "" ? "bg-white text-green-700 shadow-md font-black" : "text-gray-500 hover:text-gray-800"
                        }`}
                    >
                        <Crown size={16} /> 👑 Admins ({admins.length})
                    </button>

                    <button
                        onClick={() => { setActiveTab("user"); setSearchQuery(""); }}
                        className={`flex-1 py-2.5 rounded-xl transition flex items-center justify-center gap-2 cursor-pointer ${
                            activeTab === "user" && searchQuery === "" ? "bg-white text-green-700 shadow-md font-black" : "text-gray-500 hover:text-gray-800"
                        }`}
                    >
                        <User size={16} /> 👥 All Customers ({regularUsers.length})
                    </button>
                </div>

                {/* Users List Cards */}
                <div className="space-y-3">
                    {displayedUsers.length > 0 ? (
                        displayedUsers.map((item) => (
                            <motion.div
                                key={item._id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-100 shadow-sm flex flex-col sm:flex-row justify-between sm:items-center gap-4 hover:shadow-md transition-all"
                            >
                                <div className="flex items-center gap-3.5">
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg shrink-0 ${
                                        item.role === 'admin' ? 'bg-amber-100 text-amber-800' :
                                        item.role === 'deliveryBoy' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                                    }`}>
                                        {item.name?.charAt(0).toUpperCase() || "U"}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <h3 className="font-black text-gray-800 text-sm sm:text-base">{item.name}</h3>
                                            <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full ${
                                                item.role === 'admin' ? 'bg-amber-100 text-amber-800 border border-amber-300' :
                                                item.role === 'deliveryBoy' ? (item.isOnline ? 'bg-green-100 text-green-800 border border-green-300' : 'bg-red-100 text-red-800 border border-red-200') : 'bg-gray-100 text-gray-600'
                                            }`}>
                                                {item.role === 'deliveryBoy' ? (item.isOnline ? '🟢 Online Partner' : '🔴 Offline Partner') : item.role === 'admin' ? '👑 Store Admin' : '👤 Customer'}
                                            </span>
                                        </div>
                                        <p className="text-xs text-gray-400 font-medium mt-0.5">{item.email}</p>
                                        {item.mobile && (
                                            <p className="text-xs text-gray-600 flex items-center gap-1 mt-0.5 font-semibold">
                                                <Phone size={12} className="text-gray-400" /> {item.mobile}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex flex-wrap items-center gap-2 self-end sm:self-center">
                                    {updatingId === item._id && (
                                        <Loader2 size={16} className="animate-spin text-green-600 mr-1" />
                                    )}

                                    {/* If Customer: Can make Admin OR Delivery Boy */}
                                    {item.role === "user" && (
                                        <>
                                            <button
                                                onClick={() => handleRoleChange(item._id, "deliveryBoy")}
                                                disabled={updatingId === item._id}
                                                className="px-3.5 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95 disabled:opacity-50"
                                            >
                                                <Bike size={14} /> + Make Partner
                                            </button>

                                            <button
                                                onClick={() => handleRoleChange(item._id, "admin")}
                                                disabled={updatingId === item._id}
                                                className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95 disabled:opacity-50"
                                            >
                                                <Crown size={14} /> + Make Admin
                                            </button>
                                        </>
                                    )}

                                    {/* If Delivery Partner: Can Remove or Promote to Admin */}
                                    {item.role === "deliveryBoy" && (
                                        <>
                                            <button
                                                onClick={() => handleRoleChange(item._id, "admin")}
                                                disabled={updatingId === item._id}
                                                className="px-3.5 py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border border-amber-200 active:scale-95 disabled:opacity-50"
                                            >
                                                <Crown size={14} /> Promote to Admin
                                            </button>

                                            <button
                                                onClick={() => handleRoleChange(item._id, "user")}
                                                disabled={updatingId === item._id}
                                                className="px-3.5 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer active:scale-95 disabled:opacity-50"
                                            >
                                                <Trash2 size={14} /> Remove Partner
                                            </button>
                                        </>
                                    )}

                                    {/* If Admin: Show badge and optional remove */}
                                    {item.role === "admin" && (
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-bold text-amber-800 bg-amber-50 px-3.5 py-2 rounded-xl border border-amber-200 flex items-center gap-1.5">
                                                <ShieldCheck size={15} className="text-amber-600" /> Active Store Admin
                                            </span>
                                            <button
                                                onClick={() => handleRoleChange(item._id, "user")}
                                                disabled={updatingId === item._id}
                                                className="px-3 py-2 bg-gray-100 hover:bg-red-50 hover:text-red-600 text-gray-600 rounded-xl text-xs font-bold transition cursor-pointer active:scale-95 disabled:opacity-50"
                                                title="Demote to Customer"
                                            >
                                                Demote
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        ))
                    ) : (
                        <div className="bg-white rounded-3xl p-12 text-center border border-gray-100 shadow-sm space-y-2">
                            <Users size={40} className="text-gray-300 mx-auto" />
                            <h3 className="text-base font-bold text-gray-700">No users found in this section</h3>
                            <p className="text-xs text-gray-400">Try switching tabs or searching with another keyword.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}