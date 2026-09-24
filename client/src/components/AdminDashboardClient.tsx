'use client'

import React, { useEffect, useState } from 'react'
import { motion } from "motion/react"
import { Eye, EyeOff, IndianRupee, Package, Shield, Sparkles, TrendingUp, Truck, Users } from 'lucide-react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis } from 'recharts'

import Link from 'next/link'

type propType = {
  earning: {
    today: number,
    sevenDays: number,
    total: number
  },
  stats: {
    title: string;
    value: number;
  }[],
  chartData: {
    day: string;
    orders: number;
  }[],
  pendingDeliveryBoys?: {
    _id: string;
    name: string;
    email: string;
    mobile?: string;
    createdAt?: string;
  }[]
}

function AdminDashboardClient({ earning, stats, chartData, pendingDeliveryBoys = [] }: propType) {
  const [filter, setFilter] = useState<"today" | "sevenDays" | "total">("total")
  const [hideRevenue, setHideRevenue] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem("snapcart_admin_hide_revenue")
    if (saved === "true") {
      setHideRevenue(true)
    }
  }, [])

  const toggleHideRevenue = () => {
    setHideRevenue(prev => {
      const next = !prev
      localStorage.setItem("snapcart_admin_hide_revenue", String(next))
      return next
    })
  }

  const currenEarning = filter === "today" ? earning.today
    : filter === "sevenDays" ? earning.sevenDays
      : earning.total

  const title = filter === "today" ? "Today's Revenue"
    : filter === "sevenDays" ? "Last 7 Days Revenue"
      : "Total Lifetime Revenue"

  const statThemes = [
    { bg: "bg-emerald-50 text-emerald-700 border-emerald-100", icon: <Package className="w-4 h-4 sm:w-5 sm:h-5" /> },
    { bg: "bg-blue-50 text-blue-700 border-blue-100", icon: <Users className="w-4 h-4 sm:w-5 sm:h-5" /> },
    { bg: "bg-amber-50 text-amber-700 border-amber-100", icon: <Truck className="w-4 h-4 sm:w-5 sm:h-5" /> },
    { bg: "bg-purple-50 text-purple-700 border-purple-100", icon: <IndianRupee className="w-4 h-4 sm:w-5 sm:h-5" /> },
  ]

  const totalWeeklyOrders = chartData.reduce((sum, d) => sum + (d.orders || 0), 0)

  return (
    <div className='pt-4 sm:pt-24 w-[94%] sm:w-[90%] md:w-[85%] max-w-6xl mx-auto pb-16 space-y-4 sm:space-y-6'>
      
      {/* Header bar */}
      <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-gray-100 shadow-xs'>
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-gray-800 tracking-tight flex items-center gap-2">
            🏪 Admin Dashboard
          </h1>
          <p className="text-[11px] sm:text-xs text-gray-400 font-medium mt-0.5">
            Store performance, revenue analytics, and dispatch overview
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          {/* Privacy Toggle */}
          <button
            type="button"
            onClick={toggleHideRevenue}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer active:scale-95 shadow-2xs ${
              hideRevenue 
                ? "bg-amber-50 text-amber-800 border-amber-200" 
                : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
            }`}
          >
            {hideRevenue ? (
              <>
                <EyeOff size={13} className="text-amber-600" />
                <span>Hidden</span>
              </>
            ) : (
              <>
                <Eye size={13} className="text-gray-400" />
                <span>Hide Revenue</span>
              </>
            )}
          </button>

          {/* Timeframe Segmented Switcher */}
          <div className='inline-flex bg-gray-100 p-1 rounded-xl border border-gray-200 text-xs font-black'>
            <button
              type="button"
              onClick={() => setFilter("total")}
              className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                filter === "total" 
                  ? "bg-white text-green-700 shadow-2xs font-black" 
                  : "text-gray-500 hover:text-gray-800"
              }`}
            >
              All-Time
            </button>
            <button
              type="button"
              onClick={() => setFilter("sevenDays")}
              className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                filter === "sevenDays" 
                  ? "bg-white text-green-700 shadow-2xs font-black" 
                  : "text-gray-500 hover:text-gray-800"
              }`}
            >
              7 Days
            </button>
            <button
              type="button"
              onClick={() => setFilter("today")}
              className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                filter === "today" 
                  ? "bg-white text-green-700 shadow-2xs font-black" 
                  : "text-gray-500 hover:text-gray-800"
              }`}
            >
              Today
            </button>
          </div>
        </div>
      </div>

      {/* ⚠️ Delivery Partner Pending Approval Alert Banner */}
      {pendingDeliveryBoys && pendingDeliveryBoys.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-amber-500 via-amber-600 to-orange-500 text-white p-5 rounded-3xl shadow-lg border border-amber-300/40 flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-3xl shrink-0 shadow-inner">
              🛵
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-white text-amber-900 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full shadow-xs">
                  Action Required
                </span>
                <span className="text-xs text-amber-100 font-bold">
                  New Delivery Partner Registration
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-black mt-1">
                {pendingDeliveryBoys.length} Delivery Partner Application{pendingDeliveryBoys.length > 1 ? 's' : ''} Awaiting Your Verification
              </h3>
              <p className="text-xs text-amber-100 font-medium mt-0.5">
                Applicant: <b className="text-white underline">{pendingDeliveryBoys[0]?.name}</b> ({pendingDeliveryBoys[0]?.email || pendingDeliveryBoys[0]?.mobile}). They cannot access orders or go online until verified.
              </p>
            </div>
          </div>
          <Link
            href="/admin/manage-users"
            className="px-5 py-2.5 bg-white hover:bg-amber-50 text-amber-900 rounded-2xl font-black text-xs sm:text-sm shadow-md transition whitespace-nowrap active:scale-95 flex items-center gap-2 shrink-0 cursor-pointer"
          >
            <Users size={16} /> Review & Approve Now ({pendingDeliveryBoys.length})
          </Link>
        </motion.div>
      )}

      {/* Revenue Banner */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-green-600 via-emerald-600 to-green-700 text-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-md relative overflow-hidden"
      >
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-green-100 flex items-center gap-1.5">
                <Sparkles size={13} className="text-amber-300" />
                {title}
              </span>
              <button
                type="button"
                onClick={toggleHideRevenue}
                className="p-1 rounded-md bg-white/10 hover:bg-white/20 transition cursor-pointer text-green-100"
                title={hideRevenue ? "Show Revenue" : "Hide Revenue"}
              >
                {hideRevenue ? <EyeOff size={12} /> : <Eye size={12} />}
              </button>
            </div>

            <div className="text-2xl sm:text-4xl font-black tracking-tight flex items-center gap-2">
              {hideRevenue ? (
                <span className="tracking-widest select-none text-white/90">₹ ••••••</span>
              ) : (
                <span>₹ {currenEarning.toLocaleString()}</span>
              )}
            </div>

            <p className="text-[11px] sm:text-xs text-green-100 opacity-90">
              Online Payments (Razorpay) & Cash on Delivery (COD)
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            {hideRevenue && (
              <span className="inline-flex items-center gap-1 bg-black/20 text-white/90 px-2.5 py-1 rounded-xl text-[11px] font-bold border border-white/10">
                <Shield size={12} className="text-amber-300" /> Privacy On
              </span>
            )}
          </div>
        </div>
      </motion.div>

      {/* 4 Metric Cards */}
      <div className='grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4'>
        {stats.map((s, i) => {
          const theme = statThemes[i % statThemes.length]
          const isRevenueCard = s.title.toLowerCase().includes("revenue")

          return (
            <div
              key={i}
              className="bg-white border border-gray-100 shadow-2xs hover:shadow-sm rounded-2xl p-3.5 sm:p-4 flex items-center gap-3 transition-all"
            >
              <div className={`${theme.bg} p-2.5 rounded-xl shrink-0 border`}>
                {theme.icon}
              </div>
              <div className="space-y-0.5 min-w-0">
                <div className="flex items-center gap-1">
                  <p className="text-gray-400 text-[10px] sm:text-xs font-bold truncate">{s.title}</p>
                  {isRevenueCard && (
                    <button
                      type="button"
                      onClick={toggleHideRevenue}
                      className="text-gray-400 hover:text-gray-600 cursor-pointer"
                    >
                      {hideRevenue ? <EyeOff size={10} /> : <Eye size={10} />}
                    </button>
                  )}
                </div>
                <p className="text-lg sm:text-xl font-black text-gray-800 truncate">
                  {isRevenueCard ? (
                    hideRevenue ? "₹ ••••••" : `₹${s.value.toLocaleString()}`
                  ) : (
                    s.value
                  )}
                </p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Orders Overview Chart Card */}
      <div className='bg-white border border-gray-100 rounded-2xl sm:rounded-3xl shadow-xs p-4 sm:p-5 space-y-3'>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-600"></span>
            <h2 className='text-xs sm:text-sm font-black text-gray-800'>
              Orders Volume (Last 7 Days)
            </h2>
          </div>
          <span className="text-[10px] font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded-lg border border-green-200">
            {totalWeeklyOrders} Orders Total
          </span>
        </div>

        <div className="w-full h-44 sm:h-60 pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
              <defs>
                <linearGradient id="greenBarGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#16a34a" stopOpacity={1}/>
                  <stop offset="100%" stopColor="#22c55e" stopOpacity={0.7}/>
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#f8fafc" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 600 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.06)', fontSize: '12px', fontWeight: 700 }}
                cursor={{ fill: 'rgba(22, 163, 74, 0.04)' }}
              />
              <Bar dataKey="orders" fill="url(#greenBarGradient)" radius={[6, 6, 0, 0]} barSize={24} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}

export default AdminDashboardClient
