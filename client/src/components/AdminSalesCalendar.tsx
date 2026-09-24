'use client'

import React, { useState, useEffect, useMemo } from 'react'
import axios from 'axios'
import Link from 'next/link'
import Image from 'next/image'
import {
    Calendar as CalendarIcon,
    CalendarDays,
    ChevronLeft,
    ChevronRight,
    Search,
    Download,
    Printer,
    Package,
    PackageCheck,
    IndianRupee,
    TrendingUp,
    Clock,
    User,
    Truck,
    CheckCircle2,
    RefreshCw,
    ArrowLeft,
    Filter,
    ShoppingBag,
    ExternalLink
} from 'lucide-react'
import toast from 'react-hot-toast'

interface DeliveredProduct {
    id: string
    orderId: string
    orderShortCode: string
    productName: string
    price: number
    quantity: number
    unit: string
    image: string
    totalPrice: number
    paymentMethod: string
    isPaid: boolean
    customerName: string
    customerMobile: string
    riderName: string
    riderMobile: string
    deliveryDate: string // YYYY-MM-DD
    deliveryDay: string  // Sunday, Monday...
    deliveryTime: string // 04:30 PM
    timestamp: number
    addressText: string
}

interface DailyStat {
    dateStr: string
    dayOfWeek: string
    formattedDate: string
    orderCount: number
    totalSales: number
    totalItems: number
    orderIds: string[]
}

export default function AdminSalesCalendar() {
    const [loading, setLoading] = useState(true)
    const [products, setProducts] = useState<DeliveredProduct[]>([])
    const [dailySummary, setDailySummary] = useState<Record<string, DailyStat>>({})
    const [totalOrders, setTotalOrders] = useState(0)
    const [totalSales, setTotalSales] = useState(0)
    const [totalItems, setTotalItems] = useState(0)

    // Calendar state
    const today = new Date()
    const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

    const [currentYear, setCurrentYear] = useState(today.getFullYear())
    const [currentMonth, setCurrentMonth] = useState(today.getMonth()) // 0 - 11
    const [selectedDate, setSelectedDate] = useState<string>(todayKey)

    // Filter & Search states
    const [filterScope, setFilterScope] = useState<'day' | 'week' | 'month' | 'all'>('day')
    const [searchQuery, setSearchQuery] = useState('')
    const [sortBy, setSortBy] = useState<'time-desc' | 'time-asc' | 'price-desc' | 'qty-desc'>('time-desc')

    // Fetch data
    const fetchSalesRecords = async () => {
        try {
            setLoading(true)
            const res = await axios.get('/api/admin/sales-records')
            if (res.data?.success) {
                setProducts(res.data.products || [])
                setDailySummary(res.data.dailySummary || {})
                setTotalOrders(res.data.totalDeliveredOrders || 0)
                setTotalSales(res.data.totalDeliveredSales || 0)
                setTotalItems(res.data.totalDeliveredItems || 0)

                // If today has no records, but other days do, find most recent active date
                const summaryKeys = Object.keys(res.data.dailySummary || {}).sort().reverse()
                if (summaryKeys.length > 0 && !res.data.dailySummary[todayKey]) {
                    setSelectedDate(summaryKeys[0])
                    const [y, m] = summaryKeys[0].split('-').map(Number)
                    setCurrentYear(y)
                    setCurrentMonth(m - 1)
                }
            }
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to load sales records')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchSalesRecords()
    }, [])

    // Month Navigation
    const handlePrevMonth = () => {
        if (currentMonth === 0) {
            setCurrentMonth(11)
            setCurrentYear(prev => prev - 1)
        } else {
            setCurrentMonth(prev => prev - 1)
        }
    }

    const handleNextMonth = () => {
        if (currentMonth === 11) {
            setCurrentMonth(0)
            setCurrentYear(prev => prev + 1)
        } else {
            setCurrentMonth(prev => prev + 1)
        }
    }

    const handleJumpToToday = () => {
        const now = new Date()
        setCurrentYear(now.getFullYear())
        setCurrentMonth(now.getMonth())
        setSelectedDate(todayKey)
        setFilterScope('day')
    }

    // Days in current calendar view
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate()
    const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay() // 0 = Sun, 1 = Mon...
    const monthName = new Date(currentYear, currentMonth, 1).toLocaleString('en-US', { month: 'long' })

    // Calculate Week Range for the selected date
    const selectedDateObj = useMemo(() => {
        const parts = selectedDate.split('-').map(Number)
        return new Date(parts[0], parts[1] - 1, parts[2])
    }, [selectedDate])

    const weekDates = useMemo(() => {
        const d = new Date(selectedDateObj)
        const dayOfWeek = d.getDay() // 0 is Sunday
        const sunday = new Date(d)
        sunday.setDate(d.getDate() - dayOfWeek)

        const dates: string[] = []
        for (let i = 0; i < 7; i++) {
            const next = new Date(sunday)
            next.setDate(sunday.getDate() + i)
            const y = next.getFullYear()
            const m = String(next.getMonth() + 1).padStart(2, '0')
            const dayNum = String(next.getDate()).padStart(2, '0')
            dates.push(`${y}-${m}-${dayNum}`)
        }
        return dates
    }, [selectedDateObj])

    // Metrics Calculations
    // 1. Selected Day Metrics
    const dayStat = dailySummary[selectedDate] || { orderCount: 0, totalSales: 0, totalItems: 0 }

    // 2. Selected Week Metrics
    const weekStat = useMemo(() => {
        let count = 0
        let sales = 0
        let items = 0
        for (const dateKey of weekDates) {
            const stat = dailySummary[dateKey]
            if (stat) {
                count += stat.orderCount
                sales += stat.totalSales
                items += stat.totalItems
            }
        }
        return { orderCount: count, totalSales: sales, totalItems: items }
    }, [weekDates, dailySummary])

    // 3. Selected Month Metrics
    const monthPrefix = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`
    const monthStat = useMemo(() => {
        let count = 0
        let sales = 0
        let items = 0
        for (const [key, stat] of Object.entries(dailySummary)) {
            if (key.startsWith(monthPrefix)) {
                count += stat.orderCount
                sales += stat.totalSales
                items += stat.totalItems
            }
        }
        return { orderCount: count, totalSales: sales, totalItems: items }
    }, [monthPrefix, dailySummary])

    // Filter products based on scope & search query
    const filteredProducts = useMemo(() => {
        let list = products

        // Scope filter
        if (filterScope === 'day') {
            list = list.filter(p => p.deliveryDate === selectedDate)
        } else if (filterScope === 'week') {
            const weekSet = new Set(weekDates)
            list = list.filter(p => weekSet.has(p.deliveryDate))
        } else if (filterScope === 'month') {
            list = list.filter(p => p.deliveryDate.startsWith(monthPrefix))
        }

        // Search query
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase().trim()
            list = list.filter(p =>
                p.productName.toLowerCase().includes(q) ||
                p.customerName.toLowerCase().includes(q) ||
                p.customerMobile.includes(q) ||
                p.riderName.toLowerCase().includes(q) ||
                p.orderShortCode.toLowerCase().includes(q)
            )
        }

        // Sorting
        const sorted = [...list]
        if (sortBy === 'time-desc') {
            sorted.sort((a, b) => b.timestamp - a.timestamp)
        } else if (sortBy === 'time-asc') {
            sorted.sort((a, b) => a.timestamp - b.timestamp)
        } else if (sortBy === 'price-desc') {
            sorted.sort((a, b) => b.totalPrice - a.totalPrice)
        } else if (sortBy === 'qty-desc') {
            sorted.sort((a, b) => b.quantity - a.quantity)
        }

        return sorted
    }, [products, filterScope, selectedDate, weekDates, monthPrefix, searchQuery, sortBy])

    // Scope sales totals for current filtered view
    const currentViewTotals = useMemo(() => {
        const sales = filteredProducts.reduce((sum, p) => sum + p.totalPrice, 0)
        const uniqueOrders = new Set(filteredProducts.map(p => p.orderId)).size
        const items = filteredProducts.reduce((sum, p) => sum + p.quantity, 0)
        return { sales, uniqueOrders, items }
    }, [filteredProducts])

    // CSV Export
    const handleExportCSV = () => {
        if (filteredProducts.length === 0) {
            toast.error('No records available to export for current filter')
            return
        }

        const headers = [
            'Product Name',
            'Quantity',
            'Unit',
            'Price (₹)',
            'Total (₹)',
            'Delivery Date',
            'Day of Week',
            'Delivery Time',
            'Order ID',
            'Customer Name',
            'Customer Mobile',
            'Delivery Partner',
            'Payment'
        ]

        const rows = filteredProducts.map(p => [
            `"${p.productName.replace(/"/g, '""')}"`,
            p.quantity,
            `"${p.unit}"`,
            p.price,
            p.totalPrice,
            p.deliveryDate,
            `"${p.deliveryDay}"`,
            `"${p.deliveryTime}"`,
            `"#${p.orderShortCode}"`,
            `"${p.customerName.replace(/"/g, '""')}"`,
            `"${p.customerMobile}"`,
            `"${p.riderName.replace(/"/g, '""')}"`,
            `"${p.paymentMethod.toUpperCase()}"`
        ])

        const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.setAttribute('download', `snapcart-delivered-sales-${filterScope}-${selectedDate}.csv`)
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        toast.success('Sales & delivery records exported successfully!')
    }

    const handlePrint = () => {
        window.print()
    }

    const selectedFormattedDate = selectedDateObj.toLocaleDateString('en-US', {
        weekday: 'long',
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    })

    return (
        <div className="min-h-screen bg-[#f8fafc] pt-20 sm:pt-24 pb-20 print:pt-4 print:bg-white">
            <div className="w-[96%] max-w-7xl mx-auto space-y-6">

                {/* Top Nav & Breadcrumb */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 print:hidden">
                    <div className="flex items-center gap-3">
                        <Link
                            href="/"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-gray-200 text-xs font-bold text-gray-600 hover:text-green-700 hover:border-green-300 transition shadow-xs"
                        >
                            <ArrowLeft size={14} /> Back
                        </Link>
                        <Link
                            href="/admin/manage-orders"
                            prefetch={true}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-gray-200 text-xs font-bold text-gray-600 hover:text-green-700 hover:border-green-300 transition shadow-xs"
                        >
                            <Package size={14} /> Manage Orders
                        </Link>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={fetchSalesRecords}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50 transition cursor-pointer shadow-xs"
                            title="Refresh records"
                        >
                            <RefreshCw size={13} className={loading ? 'animate-spin text-green-600' : 'text-gray-500'} />
                            <span>Refresh</span>
                        </button>
                        <button
                            type="button"
                            onClick={handleExportCSV}
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-black text-emerald-700 hover:bg-emerald-100 transition cursor-pointer shadow-xs"
                        >
                            <Download size={13} />
                            <span>Export CSV</span>
                        </button>
                        <button
                            type="button"
                            onClick={handlePrint}
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-green-600 text-white text-xs font-black hover:bg-green-700 transition cursor-pointer shadow-xs"
                        >
                            <Printer size={13} />
                            <span>Print Sheet</span>
                        </button>
                    </div>
                </div>

                {/* Page Title & Overview */}
                <div className="bg-white rounded-3xl p-5 sm:p-6 border border-gray-100 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2.5">
                            <div className="w-11 h-11 rounded-2xl bg-green-100 text-green-700 flex items-center justify-center shrink-0">
                                <CalendarDays size={24} />
                            </div>
                            <div>
                                <h1 className="text-xl sm:text-2xl font-black text-gray-800 tracking-tight flex items-center gap-2">
                                    Delivered Sales & Records Calendar
                                </h1>
                                <p className="text-xs text-gray-400 font-medium">
                                    Track delivered product logs with exact date, day, and time, plus daily, weekly, and monthly sales.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap text-xs">
                        <span className="px-3 py-1.5 rounded-xl bg-gray-100 font-bold text-gray-700 border border-gray-200 flex items-center gap-1.5">
                            <PackageCheck size={14} className="text-green-600" />
                            {totalOrders} Total Delivered Orders
                        </span>
                        <span className="px-3 py-1.5 rounded-xl bg-green-50 font-black text-green-800 border border-green-200 flex items-center gap-1.5">
                            <IndianRupee size={14} className="text-green-600" />
                            ₹{totalSales.toLocaleString()} Total Delivered Sales
                        </span>
                    </div>
                </div>

                {/* 3 Summary Metric Cards: Selected Day, Week, Month */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-4">
                    {/* Day Card */}
                    <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-gray-100 shadow-xs relative overflow-hidden">
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] font-black uppercase tracking-wider text-amber-600 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                                📅 Selected Day
                            </span>
                            <span className="text-xs font-bold text-gray-400">
                                {selectedDate === todayKey ? 'Today' : selectedDate}
                            </span>
                        </div>
                        <div className="mt-3">
                            <div className="text-2xl sm:text-3xl font-black text-gray-800">
                                ₹{dayStat.totalSales.toLocaleString()}
                            </div>
                            <div className="text-xs font-semibold text-gray-500 mt-0.5">
                                {dayStat.orderCount} orders • {dayStat.totalItems} items sold
                            </div>
                            <div className="text-[11px] font-bold text-gray-400 mt-2 truncate">
                                {selectedFormattedDate}
                            </div>
                        </div>
                    </div>

                    {/* Week Card */}
                    <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-gray-100 shadow-xs relative overflow-hidden">
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] font-black uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200">
                                📈 Active Week
                            </span>
                            <span className="text-xs font-bold text-gray-400">7 Days Window</span>
                        </div>
                        <div className="mt-3">
                            <div className="text-2xl sm:text-3xl font-black text-gray-800">
                                ₹{weekStat.totalSales.toLocaleString()}
                            </div>
                            <div className="text-xs font-semibold text-gray-500 mt-0.5">
                                {weekStat.orderCount} orders • {weekStat.totalItems} items sold
                            </div>
                            <div className="text-[11px] font-bold text-gray-400 mt-2 truncate">
                                Week of {weekDates[0]} to {weekDates[6]}
                            </div>
                        </div>
                    </div>

                    {/* Month Card */}
                    <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-gray-100 shadow-xs relative overflow-hidden">
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] font-black uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                                🗓️ Active Month
                            </span>
                            <span className="text-xs font-bold text-gray-400">{monthName} {currentYear}</span>
                        </div>
                        <div className="mt-3">
                            <div className="text-2xl sm:text-3xl font-black text-gray-800">
                                ₹{monthStat.totalSales.toLocaleString()}
                            </div>
                            <div className="text-xs font-semibold text-gray-500 mt-0.5">
                                {monthStat.orderCount} orders • {monthStat.totalItems} items sold
                            </div>
                            <div className="text-[11px] font-bold text-gray-400 mt-2 truncate">
                                Entire calendar month of {monthName}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content Layout: Interactive Calendar + Delivered Products Log */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

                    {/* LEFT COLUMN: Interactive Calendar (5 cols on lg) */}
                    <div className="lg:col-span-5 bg-white rounded-3xl p-5 border border-gray-100 shadow-xs space-y-4 print:hidden">
                        {/* Calendar Header with navigation */}
                        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                            <div>
                                <h2 className="text-base font-black text-gray-800 flex items-center gap-1.5">
                                    <CalendarIcon size={18} className="text-green-600" />
                                    <span>{monthName} {currentYear}</span>
                                </h2>
                                <p className="text-[11px] text-gray-400 font-medium">Click any day to view delivered products</p>
                            </div>

                            <div className="flex items-center gap-1.5">
                                <button
                                    type="button"
                                    onClick={handleJumpToToday}
                                    className="px-2.5 py-1 text-[11px] font-black text-green-700 bg-green-50 rounded-lg hover:bg-green-100 transition cursor-pointer border border-green-200"
                                >
                                    Today
                                </button>
                                <button
                                    type="button"
                                    onClick={handlePrevMonth}
                                    className="p-1.5 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition cursor-pointer"
                                    title="Previous Month"
                                >
                                    <ChevronLeft size={18} />
                                </button>
                                <button
                                    type="button"
                                    onClick={handleNextMonth}
                                    className="p-1.5 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition cursor-pointer"
                                    title="Next Month"
                                >
                                    <ChevronRight size={18} />
                                </button>
                            </div>
                        </div>

                        {/* Calendar Days of Week Row */}
                        <div className="grid grid-cols-7 text-center text-[11px] font-black text-gray-400 pb-1">
                            <span>Sun</span>
                            <span>Mon</span>
                            <span>Tue</span>
                            <span>Wed</span>
                            <span>Thu</span>
                            <span>Fri</span>
                            <span>Sat</span>
                        </div>

                        {/* Calendar Grid */}
                        <div className="grid grid-cols-7 gap-1.5">
                            {/* Empty cells before 1st of month */}
                            {Array.from({ length: firstDayIndex }).map((_, i) => (
                                <div key={`empty-${i}`} className="h-16 rounded-xl bg-gray-50/50 opacity-40"></div>
                            ))}

                            {/* Actual days of month */}
                            {Array.from({ length: daysInMonth }).map((_, i) => {
                                const dayNum = i + 1
                                const dayStr = String(dayNum).padStart(2, '0')
                                const mStr = String(currentMonth + 1).padStart(2, '0')
                                const dateKey = `${currentYear}-${mStr}-${dayStr}`
                                const stat = dailySummary[dateKey]
                                const isSelected = selectedDate === dateKey
                                const isToday = dateKey === todayKey
                                const hasDeliveries = stat && stat.orderCount > 0

                                return (
                                    <button
                                        key={dateKey}
                                        type="button"
                                        onClick={() => {
                                            setSelectedDate(dateKey)
                                            setFilterScope('day')
                                        }}
                                        className={`min-h-16 p-1.5 rounded-2xl flex flex-col justify-between items-center transition cursor-pointer border text-left relative ${
                                            isSelected
                                                ? 'bg-green-600 text-white border-green-600 shadow-md ring-2 ring-green-400 ring-offset-2'
                                                : hasDeliveries
                                                    ? 'bg-emerald-50/70 border-emerald-200 text-gray-800 hover:bg-emerald-100/80 hover:border-emerald-300'
                                                    : 'bg-white border-gray-100 text-gray-700 hover:bg-gray-50'
                                        }`}
                                    >
                                        {/* Date Number + Today indicator */}
                                        <div className="w-full flex items-center justify-between">
                                            <span className={`text-xs font-black ${isSelected ? 'text-white' : 'text-gray-800'}`}>
                                                {dayNum}
                                            </span>
                                            {isToday && (
                                                <span
                                                    className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-amber-300' : 'bg-green-600'}`}
                                                    title="Today"
                                                ></span>
                                            )}
                                        </div>

                                        {/* Delivery Badges */}
                                        {hasDeliveries ? (
                                            <div className="w-full mt-1 flex flex-col items-center">
                                                <span
                                                    className={`text-[9px] font-black px-1.5 py-0.5 rounded-md leading-tight text-center w-full truncate ${
                                                        isSelected
                                                            ? 'bg-white/20 text-white'
                                                            : 'bg-emerald-600 text-white'
                                                    }`}
                                                >
                                                    {stat.orderCount} {stat.orderCount === 1 ? 'ord' : 'ords'}
                                                </span>
                                                <span
                                                    className={`text-[10px] font-black mt-0.5 truncate ${
                                                        isSelected ? 'text-green-100' : 'text-emerald-700'
                                                    }`}
                                                >
                                                    ₹{stat.totalSales >= 1000 ? `${(stat.totalSales / 1000).toFixed(1)}k` : stat.totalSales}
                                                </span>
                                            </div>
                                        ) : (
                                            <div className="w-full h-4"></div>
                                        )}
                                    </button>
                                )
                            })}
                        </div>

                        {/* Calendar Legend */}
                        <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-500 flex-wrap gap-2">
                            <div className="flex items-center gap-1.5">
                                <span className="w-3 h-3 rounded-md bg-emerald-100 border border-emerald-300 inline-block"></span>
                                <span>Delivered Sales</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-green-600 inline-block"></span>
                                <span>Today</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <span className="w-3 h-3 rounded-md bg-green-600 inline-block"></span>
                                <span>Selected</span>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT COLUMN: Delivered Products Log (7 cols on lg) */}
                    <div className="lg:col-span-7 space-y-4">

                        {/* Controls Strip: Scope Filter Tabs + Search */}
                        <div className="bg-white rounded-3xl p-4 sm:p-5 border border-gray-100 shadow-xs space-y-3.5">
                            
                            {/* Scope Tabs */}
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <div className="inline-flex bg-gray-100 p-1 rounded-2xl border border-gray-200 text-xs font-black">
                                    <button
                                        type="button"
                                        onClick={() => setFilterScope('day')}
                                        className={`px-3 py-1.5 rounded-xl transition cursor-pointer ${
                                            filterScope === 'day'
                                                ? 'bg-white text-green-700 shadow-xs font-black'
                                                : 'text-gray-500 hover:text-gray-800'
                                        }`}
                                    >
                                        Selected Day ({selectedDate})
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setFilterScope('week')}
                                        className={`px-3 py-1.5 rounded-xl transition cursor-pointer ${
                                            filterScope === 'week'
                                                ? 'bg-white text-green-700 shadow-xs font-black'
                                                : 'text-gray-500 hover:text-gray-800'
                                        }`}
                                    >
                                        This Week
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setFilterScope('month')}
                                        className={`px-3 py-1.5 rounded-xl transition cursor-pointer ${
                                            filterScope === 'month'
                                                ? 'bg-white text-green-700 shadow-xs font-black'
                                                : 'text-gray-500 hover:text-gray-800'
                                        }`}
                                    >
                                        This Month
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setFilterScope('all')}
                                        className={`px-3 py-1.5 rounded-xl transition cursor-pointer ${
                                            filterScope === 'all'
                                                ? 'bg-white text-green-700 shadow-xs font-black'
                                                : 'text-gray-500 hover:text-gray-800'
                                        }`}
                                    >
                                        All Time
                                    </button>
                                </div>

                                <div className="text-xs font-bold text-gray-500">
                                    Showing <span className="font-black text-gray-800">{filteredProducts.length}</span> delivered items
                                </div>
                            </div>

                            {/* Search & Sort Row */}
                            <div className="flex flex-col sm:flex-row items-center gap-2.5">
                                <div className="relative flex-1 w-full">
                                    <Search className="absolute left-3.5 top-3 text-gray-400 w-4 h-4" />
                                    <input
                                        type="text"
                                        placeholder="Search product, customer, rider, order ID..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 bg-gray-50 rounded-xl border border-gray-200 focus:bg-white focus:ring-2 focus:ring-green-500 outline-none text-xs font-semibold"
                                    />
                                    {searchQuery && (
                                        <button
                                            type="button"
                                            onClick={() => setSearchQuery('')}
                                            className="absolute right-3 top-2.5 text-xs text-gray-400 hover:text-gray-600 font-bold"
                                        >
                                            ✕
                                        </button>
                                    )}
                                </div>

                                <select
                                    value={sortBy}
                                    onChange={(e: any) => setSortBy(e.target.value)}
                                    className="px-3 py-2 bg-gray-50 rounded-xl border border-gray-200 text-xs font-bold text-gray-700 outline-none w-full sm:w-auto cursor-pointer"
                                >
                                    <option value="time-desc">Latest Delivered First</option>
                                    <option value="time-asc">Earliest Delivered First</option>
                                    <option value="price-desc">Highest Total Sales</option>
                                    <option value="qty-desc">Highest Quantity</option>
                                </select>
                            </div>

                            {/* Filter Summary Banner */}
                            <div className="bg-emerald-50/70 border border-emerald-100 rounded-2xl p-3 flex flex-wrap items-center justify-between gap-2 text-xs">
                                <div className="flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                                    <span className="font-bold text-gray-700">
                                        {filterScope === 'day' && `Deliveries for ${selectedFormattedDate}`}
                                        {filterScope === 'week' && `Deliveries for Week of ${weekDates[0]} to ${weekDates[6]}`}
                                        {filterScope === 'month' && `Deliveries for ${monthName} ${currentYear}`}
                                        {filterScope === 'all' && `All Delivered Records`}
                                    </span>
                                </div>
                                <div className="font-black text-emerald-800">
                                    {currentViewTotals.uniqueOrders} Orders • {currentViewTotals.items} Items • ₹{currentViewTotals.sales.toLocaleString()}
                                </div>
                            </div>
                        </div>

                        {/* Delivered Product Records List */}
                        {loading ? (
                            <div className="bg-white rounded-3xl p-12 text-center border border-gray-100 shadow-xs space-y-3">
                                <RefreshCw className="w-8 h-8 text-green-600 animate-spin mx-auto" />
                                <p className="text-xs font-bold text-gray-500">Loading delivery records & sales...</p>
                            </div>
                        ) : filteredProducts.length === 0 ? (
                            <div className="bg-white rounded-3xl p-12 text-center border border-gray-100 shadow-xs space-y-3">
                                <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto text-gray-400">
                                    <ShoppingBag size={28} />
                                </div>
                                <h3 className="text-sm font-black text-gray-700">No Products Delivered</h3>
                                <p className="text-xs text-gray-400 max-w-sm mx-auto">
                                    {searchQuery 
                                        ? `No delivered products matching "${searchQuery}". Try clearing search.`
                                        : filterScope === 'day' 
                                            ? `No products were delivered on ${selectedFormattedDate}. Choose another date on the calendar.`
                                            : 'No delivered products found for this timeframe.'}
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {filteredProducts.map((p) => (
                                    <div
                                        key={p.id}
                                        className="bg-white rounded-2xl p-4 border border-gray-100 shadow-2xs hover:shadow-xs transition space-y-3"
                                    >
                                        {/* Product Primary Header: Image, Title, Qty, Price */}
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-14 h-14 rounded-xl bg-gray-50 border border-gray-100 overflow-hidden relative shrink-0 flex items-center justify-center">
                                                    {p.image ? (
                                                        <img
                                                            src={p.image}
                                                            alt={p.productName}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        <ShoppingBag className="w-6 h-6 text-gray-300" />
                                                    )}
                                                </div>
                                                <div>
                                                    <h4 className="text-sm font-black text-gray-800 line-clamp-1">
                                                        {p.productName}
                                                    </h4>
                                                    <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-500">
                                                        <span className="font-extrabold text-green-700 bg-green-50 px-2 py-0.5 rounded-md border border-green-200">
                                                            Qty: {p.quantity} × {p.unit}
                                                        </span>
                                                        <span>₹{p.price} / {p.unit}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Item Total Price */}
                                            <div className="text-right shrink-0">
                                                <div className="text-base font-black text-gray-800">
                                                    ₹{p.totalPrice.toLocaleString()}
                                                </div>
                                                <span className="text-[10px] font-bold text-gray-400">
                                                    {p.paymentMethod.toUpperCase()} • Paid
                                                </span>
                                            </div>
                                        </div>

                                        {/* Delivery Details Pill Bar: DATE, DAY, TIME (As specifically requested!) */}
                                        <div className="bg-gray-50 rounded-xl p-2.5 flex flex-wrap items-center justify-between gap-2 text-xs border border-gray-100">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                {/* Date & Day */}
                                                <span className="inline-flex items-center gap-1 font-black text-gray-800 bg-white px-2.5 py-1 rounded-lg border border-gray-200 shadow-2xs">
                                                    <CalendarIcon size={12} className="text-green-600" />
                                                    {p.deliveryDay}, {p.deliveryDate}
                                                </span>

                                                {/* Delivery Time */}
                                                <span className="inline-flex items-center gap-1 font-black text-emerald-800 bg-emerald-100/70 px-2.5 py-1 rounded-lg border border-emerald-200 shadow-2xs">
                                                    <Clock size={12} className="text-emerald-700" />
                                                    {p.deliveryTime}
                                                </span>

                                                {/* Status */}
                                                <span className="inline-flex items-center gap-1 font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded-md">
                                                    <CheckCircle2 size={11} /> Delivered
                                                </span>
                                            </div>

                                            {/* Order link */}
                                            <Link
                                                href={`/admin/manage-orders`}
                                                prefetch={true}
                                                className="inline-flex items-center gap-1 font-bold text-green-700 hover:text-green-800 text-[11px] underline underline-offset-2"
                                            >
                                                Order #{p.orderShortCode} <ExternalLink size={11} />
                                            </Link>
                                        </div>

                                        {/* Customer & Rider Info Footer */}
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 text-[11px] text-gray-500">
                                            <div className="flex items-center gap-1.5 truncate">
                                                <User size={12} className="text-gray-400 shrink-0" />
                                                <span className="font-bold text-gray-700">{p.customerName}</span>
                                                <span className="text-gray-400">({p.customerMobile})</span>
                                            </div>

                                            <div className="flex items-center gap-1.5 shrink-0">
                                                <Truck size={12} className="text-gray-400" />
                                                <span>Rider: <strong className="text-gray-700">{p.riderName}</strong></span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
