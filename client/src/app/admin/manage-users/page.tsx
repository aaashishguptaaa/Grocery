'use client'

import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { motion } from 'motion/react'
import { 
    AlertTriangle, ArrowLeft, Ban, Bike, CheckCircle2, 
    Clock, Crown, Loader2, MessageSquare, Phone, Search, 
    ShieldAlert, ShieldCheck, Trash2, User, UserCheck, UserX, Users 
} from 'lucide-react'
import Link from 'next/link'

interface IUser {
    _id: string
    name: string
    email: string
    mobile?: string
    role: "user" | "deliveryBoy" | "admin"
    isOnline?: boolean
    isBanned?: boolean
    banReason?: string
    bannedAt?: string
    isApproved?: boolean
    deliveryApprovalStatus?: "pending" | "approved" | "rejected"
    approvalRequestedAt?: string
    approvedAt?: string
}

export default function ManageUsers() {
    const [users, setUsers] = useState<IUser[]>([])
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState<"deliveryBoy" | "pendingDelivery" | "admin" | "user" | "banned">("deliveryBoy")
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
            setUsers(prev => prev.map(u => u._id === userId ? { 
                ...u, 
                role: newRole as any,
                isApproved: true,
                deliveryApprovalStatus: "approved"
            } : u))
            alert(`✅ Role updated to ${roleLabel}!`)
        } catch (e) {
            console.log(e)
            alert("Failed to update role.")
        } finally {
            setUpdatingId(null)
        }
    }

    const handleToggleApproval = async (userItem: IUser, approve: boolean) => {
        const actionLabel = approve ? "APPROVE & VERIFY" : "REVOKE / DENY approval for"
        if (!confirm(`Are you sure you want to ${actionLabel} ${userItem.name} as a Delivery Partner?`)) return

        setUpdatingId(userItem._id)
        try {
            const res = await axios.post('/api/admin/toggle-delivery-approval', {
                userId: userItem._id,
                isApproved: approve
            })
            setUsers(prev => prev.map(u => u._id === userItem._id ? { 
                ...u, 
                isApproved: approve, 
                deliveryApprovalStatus: approve ? "approved" : "rejected",
                isOnline: approve ? u.isOnline : false
            } : u))
            alert(res.data.message || (approve ? `✅ ${userItem.name} has been approved as Delivery Partner!` : "Approval revoked."))
        } catch (e: any) {
            console.error(e)
            alert(e.response?.data?.message || "Failed to update approval.")
        } finally {
            setUpdatingId(null)
        }
    }

    const handleToggleBan = async (userItem: IUser) => {
        const isCurrentlyBanned = Boolean(userItem.isBanned)

        if (isCurrentlyBanned) {
            // UNBAN flow
            if (!confirm(`Are you sure you want to UNBAN ${userItem.name}? Their account access will be restored immediately.`)) return
            setUpdatingId(userItem._id)
            try {
                const res = await axios.post('/api/admin/toggle-ban', {
                    userId: userItem._id,
                    isBanned: false
                })
                setUsers(prev => prev.map(u => u._id === userItem._id ? { ...u, isBanned: false, banReason: "" } : u))
                alert(`✅ ${userItem.name} has been unbanned successfully!`)
            } catch (e: any) {
                console.error(e)
                alert(e.response?.data?.message || "Failed to unban user.")
            } finally {
                setUpdatingId(null)
            }
        } else {
            // BAN flow
            const reason = prompt(
                `Enter reason for suspending ${userItem.name}'s account (this will be displayed to the user):`,
                "Violation of store safety and conduct policies"
            )
            if (reason === null) return

            const trimmedReason = reason.trim() || "Violation of store safety and conduct policies"
            setUpdatingId(userItem._id)
            try {
                const res = await axios.post('/api/admin/toggle-ban', {
                    userId: userItem._id,
                    isBanned: true,
                    banReason: trimmedReason
                })
                setUsers(prev => prev.map(u => u._id === userItem._id ? { ...u, isBanned: true, banReason: trimmedReason, isOnline: false } : u))
                alert(`🚫 ${userItem.name} has been banned from the app. They can now only access the support appeal chat.`)
            } catch (e: any) {
                console.error(e)
                alert(e.response?.data?.message || "Failed to ban user.")
            } finally {
                setUpdatingId(null)
            }
        }
    }

    const allDeliveryBoys = users.filter(u => u.role === "deliveryBoy" && !u.isBanned)
    const pendingDeliveryBoys = users.filter(u => u.role === "deliveryBoy" && !u.isApproved && !u.isBanned)
    const approvedDeliveryBoys = users.filter(u => u.role === "deliveryBoy" && Boolean(u.isApproved) && !u.isBanned)
    const admins = users.filter(u => u.role === "admin")
    const regularUsers = users.filter(u => u.role === "user" && !u.isBanned)
    const bannedUsers = users.filter(u => Boolean(u.isBanned))

    const displayedUsers = users.filter(u => {
        let matchesTab = false
        if (activeTab === "banned") {
            matchesTab = Boolean(u.isBanned)
        } else if (activeTab === "pendingDelivery") {
            matchesTab = u.role === "deliveryBoy" && !u.isApproved && !u.isBanned
        } else if (activeTab === "deliveryBoy") {
            matchesTab = u.role === "deliveryBoy" && !u.isBanned
        } else {
            matchesTab = u.role === activeTab && !u.isBanned
        }

        const matchesSearch = searchQuery.trim() === "" || 
            u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            u.mobile?.includes(searchQuery) ||
            (u.banReason || "").toLowerCase().includes(searchQuery.toLowerCase())

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
                                Verify delivery partner applications, manage staff roles, and oversee account security.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <Link
                            href="/admin/customer-chats"
                            className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3.5 py-2.5 rounded-2xl shadow-sm transition whitespace-nowrap"
                        >
                            <MessageSquare size={15} /> Support & Appeal Chats
                        </Link>
                        {/* Search Bar */}
                        <div className="relative flex-1 sm:w-64">
                            <Search className="absolute left-3.5 top-3 text-gray-400 w-4 h-4" />
                            <input
                                type="text"
                                placeholder="Search name, email, phone..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 bg-gray-50/80 hover:bg-white focus:bg-white rounded-2xl border border-gray-200 focus:ring-2 focus:ring-green-500 outline-none text-xs font-semibold shadow-2xs transition"
                            />
                        </div>
                    </div>
                </div>

                {/* Pending Delivery Partners Alert Banner */}
                {pendingDeliveryBoys.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-gradient-to-r from-amber-500 via-amber-600 to-orange-500 text-white p-4 rounded-3xl shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-11 h-11 rounded-2xl bg-white/20 flex items-center justify-center text-2xl shrink-0 shadow-inner">
                                ⏳
                            </div>
                            <div>
                                <h4 className="font-black text-sm sm:text-base">
                                    {pendingDeliveryBoys.length} Delivery Partner Application{pendingDeliveryBoys.length > 1 ? 's' : ''} Awaiting Your Verification!
                                </h4>
                                <p className="text-xs text-amber-100 font-medium mt-0.5">
                                    New delivery applicants cannot go online or accept orders until you manually verify them.
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => { setActiveTab("pendingDelivery"); setSearchQuery(""); }}
                            className="px-4 py-2 bg-white text-amber-900 rounded-xl font-black text-xs hover:bg-amber-50 transition cursor-pointer shadow-sm shrink-0 active:scale-95"
                        >
                            Review Applications ({pendingDeliveryBoys.length})
                        </button>
                    </motion.div>
                )}

                {/* Metric Summary Strip */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                    <div 
                        onClick={() => { setActiveTab("deliveryBoy"); setSearchQuery(""); }}
                        className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm text-center cursor-pointer hover:border-green-300 transition"
                    >
                        <span className="text-2xl">🛵</span>
                        <div className="text-xl sm:text-2xl font-black text-gray-800 mt-1">
                            {approvedDeliveryBoys.length}
                            {pendingDeliveryBoys.length > 0 && (
                                <span className="text-xs text-amber-600 font-black ml-1.5">
                                    (+{pendingDeliveryBoys.length} pending)
                                </span>
                            )}
                        </div>
                        <div className="text-[11px] sm:text-xs font-bold text-gray-500">Delivery Fleet</div>
                    </div>
                    <div 
                        onClick={() => { setActiveTab("admin"); setSearchQuery(""); }}
                        className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm text-center cursor-pointer hover:border-amber-300 transition"
                    >
                        <span className="text-2xl">👑</span>
                        <div className="text-xl sm:text-2xl font-black text-gray-800 mt-1">{admins.length}</div>
                        <div className="text-[11px] sm:text-xs font-bold text-gray-500">Store Admins</div>
                    </div>
                    <div 
                        onClick={() => { setActiveTab("user"); setSearchQuery(""); }}
                        className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm text-center cursor-pointer hover:border-blue-300 transition"
                    >
                        <span className="text-2xl">👥</span>
                        <div className="text-xl sm:text-2xl font-black text-gray-800 mt-1">{regularUsers.length}</div>
                        <div className="text-[11px] sm:text-xs font-bold text-gray-500">Active Customers</div>
                    </div>
                    <div 
                        onClick={() => { setActiveTab("banned"); setSearchQuery(""); }}
                        className="bg-rose-50/70 rounded-2xl p-4 border border-rose-100 shadow-sm text-center cursor-pointer hover:border-rose-300 transition"
                    >
                        <span className="text-2xl">🚫</span>
                        <div className="text-xl sm:text-2xl font-black text-rose-700 mt-1">{bannedUsers.length}</div>
                        <div className="text-[11px] sm:text-xs font-bold text-rose-600">Restricted / Banned</div>
                    </div>
                </div>

                {/* Filter Tabs */}
                <div className="flex bg-gray-100/80 p-1.5 rounded-2xl gap-1.5 text-xs font-bold border border-gray-200/60 overflow-x-auto">
                    <button
                        onClick={() => { setActiveTab("deliveryBoy"); setSearchQuery(""); }}
                        className={`flex-1 min-w-[130px] py-2.5 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
                            activeTab === "deliveryBoy" && searchQuery === "" ? "bg-white text-green-700 shadow-md font-black" : "text-gray-500 hover:text-gray-800"
                        }`}
                    >
                        <Bike size={15} /> 🛵 Delivery Partners ({allDeliveryBoys.length})
                    </button>

                    <button
                        onClick={() => { setActiveTab("pendingDelivery"); setSearchQuery(""); }}
                        className={`flex-1 min-w-[135px] py-2.5 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
                            activeTab === "pendingDelivery" && searchQuery === "" 
                                ? "bg-amber-500 text-white shadow-md font-black" 
                                : pendingDeliveryBoys.length > 0 
                                    ? "text-amber-700 font-black bg-amber-100/60 hover:bg-amber-100" 
                                    : "text-gray-500 hover:text-gray-800"
                        }`}
                    >
                        <Clock size={15} /> ⏳ Pending Approvals ({pendingDeliveryBoys.length})
                    </button>

                    <button
                        onClick={() => { setActiveTab("admin"); setSearchQuery(""); }}
                        className={`flex-1 min-w-[110px] py-2.5 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
                            activeTab === "admin" && searchQuery === "" ? "bg-white text-green-700 shadow-md font-black" : "text-gray-500 hover:text-gray-800"
                        }`}
                    >
                        <Crown size={15} /> 👑 Admins ({admins.length})
                    </button>

                    <button
                        onClick={() => { setActiveTab("user"); setSearchQuery(""); }}
                        className={`flex-1 min-w-[110px] py-2.5 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
                            activeTab === "user" && searchQuery === "" ? "bg-white text-green-700 shadow-md font-black" : "text-gray-500 hover:text-gray-800"
                        }`}
                    >
                        <User size={15} /> 👥 Customers ({regularUsers.length})
                    </button>

                    <button
                        onClick={() => { setActiveTab("banned"); setSearchQuery(""); }}
                        className={`flex-1 min-w-[120px] py-2.5 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
                            activeTab === "banned" && searchQuery === "" ? "bg-rose-600 text-white shadow-md font-black" : "text-rose-600 hover:text-rose-800"
                        }`}
                    >
                        <Ban size={15} /> 🚫 Banned ({bannedUsers.length})
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
                                className={`bg-white rounded-2xl p-4 sm:p-5 border shadow-sm flex flex-col sm:flex-row justify-between sm:items-center gap-4 hover:shadow-md transition-all ${
                                    item.isBanned ? 'border-rose-200 bg-rose-50/20' : 
                                    item.role === 'deliveryBoy' && !item.isApproved ? 'border-amber-200 bg-amber-50/25' : 'border-gray-100'
                                }`}
                            >
                                <div className="flex items-center gap-3.5">
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg shrink-0 ${
                                        item.isBanned ? 'bg-rose-100 text-rose-700' :
                                        item.role === 'admin' ? 'bg-amber-100 text-amber-800' :
                                        item.role === 'deliveryBoy' ? (item.isApproved ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800') : 'bg-blue-100 text-blue-800'
                                    }`}>
                                        {item.isBanned ? '🚫' : (item.name?.charAt(0).toUpperCase() || "U")}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <h3 className="font-black text-gray-800 text-sm sm:text-base">{item.name}</h3>
                                            
                                            {item.isBanned ? (
                                                <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-rose-600 text-white shadow-xs">
                                                    🚫 Restricted / Banned
                                                </span>
                                            ) : item.role === 'deliveryBoy' ? (
                                                item.isApproved ? (
                                                    <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full ${
                                                        item.isOnline ? 'bg-green-100 text-green-800 border border-green-300' : 'bg-gray-100 text-gray-700 border border-gray-200'
                                                    }`}>
                                                        {item.isOnline ? '🟢 Online Fleet' : '⚪ Offline'} • Verified ✅
                                                    </span>
                                                ) : (
                                                    <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1">
                                                        <Clock size={11} className="text-amber-600 animate-spin" /> ⏳ Verification Pending
                                                    </span>
                                                )
                                            ) : item.role === 'admin' ? (
                                                <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
                                                    👑 Store Admin
                                                </span>
                                            ) : (
                                                <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-600">
                                                    👤 Customer
                                                </span>
                                            )}
                                        </div>

                                        <p className="text-xs text-gray-400 font-medium mt-0.5">{item.email}</p>
                                        
                                        {item.mobile && (
                                            <p className="text-xs text-gray-600 flex items-center gap-1 mt-0.5 font-semibold">
                                                <Phone size={12} className="text-gray-400" /> {item.mobile}
                                            </p>
                                        )}

                                        {item.isBanned && item.banReason && (
                                            <p className="text-xs text-rose-700 bg-rose-100/70 border border-rose-200 px-2.5 py-1 rounded-lg mt-1.5 font-semibold inline-flex items-center gap-1">
                                                <AlertTriangle size={12} className="shrink-0" />
                                                <span>Reason: <b>{item.banReason}</b></span>
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex flex-wrap items-center gap-2 self-end sm:self-center">
                                    {updatingId === item._id && (
                                        <Loader2 size={16} className="animate-spin text-green-600 mr-1" />
                                    )}

                                    {/* If User is BANNED: Show Unban Button & Chat Appeal Link */}
                                    {item.isBanned ? (
                                        <>
                                            <Link
                                                href={`/admin/customer-chats`}
                                                className="px-3.5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
                                            >
                                                <MessageSquare size={13} /> View Appeal Chat
                                            </Link>

                                            <button
                                                onClick={() => handleToggleBan(item)}
                                                disabled={updatingId === item._id}
                                                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black transition flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95 disabled:opacity-50"
                                            >
                                                <CheckCircle2 size={14} /> Unban Account
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            {/* Delivery Partner Actions */}
                                            {item.role === "deliveryBoy" && (
                                                <>
                                                    {!item.isApproved ? (
                                                        <button
                                                            onClick={() => handleToggleApproval(item, true)}
                                                            disabled={updatingId === item._id}
                                                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black transition flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95 disabled:opacity-50"
                                                            title="Manually verify and approve this delivery partner"
                                                        >
                                                            <UserCheck size={14} /> Approve Partner
                                                        </button>
                                                    ) : (
                                                        <button
                                                            onClick={() => handleToggleApproval(item, false)}
                                                            disabled={updatingId === item._id}
                                                            className="px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border border-amber-200 active:scale-95 disabled:opacity-50"
                                                            title="Revoke delivery partner approval"
                                                        >
                                                            Revoke Approval
                                                        </button>
                                                    )}

                                                    <button
                                                        onClick={() => handleRoleChange(item._id, "admin")}
                                                        disabled={updatingId === item._id}
                                                        className="px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border border-amber-200 active:scale-95 disabled:opacity-50"
                                                    >
                                                        <Crown size={13} /> + Admin
                                                    </button>

                                                    <button
                                                        onClick={() => handleRoleChange(item._id, "user")}
                                                        disabled={updatingId === item._id}
                                                        className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer active:scale-95 disabled:opacity-50"
                                                    >
                                                        Demote to User
                                                    </button>
                                                </>
                                            )}

                                            {/* Customer Actions */}
                                            {item.role === "user" && (
                                                <>
                                                    <button
                                                        onClick={() => handleRoleChange(item._id, "deliveryBoy")}
                                                        disabled={updatingId === item._id}
                                                        className="px-3 py-2 bg-green-50 hover:bg-green-100 text-green-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer active:scale-95 disabled:opacity-50 border border-green-200"
                                                    >
                                                        <Bike size={13} /> + Partner
                                                    </button>

                                                    <button
                                                        onClick={() => handleRoleChange(item._id, "admin")}
                                                        disabled={updatingId === item._id}
                                                        className="px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer active:scale-95 disabled:opacity-50 border border-amber-200"
                                                    >
                                                        <Crown size={13} /> + Admin
                                                    </button>
                                                </>
                                            )}

                                            {/* Admin Actions */}
                                            {item.role === "admin" && (
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-bold text-amber-800 bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-200 flex items-center gap-1.5">
                                                        <ShieldCheck size={14} className="text-amber-600" /> Active Store Admin
                                                    </span>
                                                    <button
                                                        onClick={() => handleRoleChange(item._id, "user")}
                                                        disabled={updatingId === item._id}
                                                        className="px-2.5 py-1.5 bg-gray-100 hover:bg-red-50 hover:text-red-600 text-gray-600 rounded-xl text-xs font-bold transition cursor-pointer active:scale-95 disabled:opacity-50"
                                                        title="Demote to Customer"
                                                    >
                                                        Demote
                                                    </button>
                                                </div>
                                            )}

                                            {/* Ban Button (Allowed for non-admin accounts) */}
                                            {item.role !== "admin" && (
                                                <button
                                                    onClick={() => handleToggleBan(item)}
                                                    disabled={updatingId === item._id}
                                                    className="px-3.5 py-2 bg-rose-50 hover:bg-rose-600 text-rose-700 hover:text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border border-rose-200 active:scale-95 disabled:opacity-50"
                                                    title={item.role === "deliveryBoy" ? "Ban delivery partner from assignments" : "Ban customer from storefront access"}
                                                >
                                                    <UserX size={13} /> Ban Account
                                                </button>
                                            )}
                                        </>
                                    )}
                                </div>
                            </motion.div>
                        ))
                    ) : (
                        <div className="bg-white rounded-3xl p-12 text-center border border-gray-100 shadow-sm space-y-2">
                            <Users size={40} className="text-gray-300 mx-auto" />
                            <h3 className="text-base font-bold text-gray-700">No users found in this section</h3>
                            <p className="text-xs text-gray-400">
                                {activeTab === "pendingDelivery" 
                                    ? "There are no pending delivery partner applications. All applicants have been reviewed!" 
                                    : activeTab === "banned" 
                                    ? "There are currently no restricted or banned accounts. All users are in good standing!" 
                                    : "Try switching tabs or searching with another keyword."}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}