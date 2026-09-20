'use client'

import axios from 'axios'
import React, { useEffect, useState } from 'react'
import { AnimatePresence, motion } from "motion/react"
import { ArrowLeft, Loader2, Package, Pencil, Plus, Search, Tag, Trash2, Upload, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { IGrocery } from '@/models/grocery.model'
import Image from 'next/image'
import Link from 'next/link'

const categories = [
    "Fruits & Vegetables",
    "Dairy & Eggs",
    "Rice, Atta & Grains",
    "Snacks & Biscuits",
    "Spices & Masalas",
    "Beverages & Drinks",
    "Personal Care",
    "Household Essentials",
    "Instant & Packaged Food",
    "Baby & Pet Care"
]

export default function ViewGrocery() {
    const router = useRouter()
    const [groceries, setGroceries] = useState<IGrocery[]>()
    const [search, setSearch] = useState("")
    const [editing, setEditing] = useState<IGrocery | null>(null)
    const [imagePreview, setImagePreview] = useState<string | null>(null)
    const [backendImage, setBackendImage] = useState<Blob | null>(null)
    const [loading, setLoading] = useState(false)
    const [deleteLoading, setDeleteLoading] = useState(false)
    const [filtered, setFiltered] = useState<IGrocery[]>()
    const [initialLoading, setInitialLoading] = useState(true)

    useEffect(() => {
        const getGroceries = async () => {
            try {
                const result = await axios.get("/api/admin/get-groceries")
                setGroceries(result.data)
                setFiltered(result.data)
            } catch (error) {
                console.log(error)
            } finally {
                setInitialLoading(false)
            }
        }
        getGroceries()
    }, [])

    useEffect(() => {
        if (editing) {
            setImagePreview(editing.image)
        }
    }, [editing])

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            setBackendImage(file)
            setImagePreview(URL.createObjectURL(file))
        }
    }

    const handleEdit = async () => {
        setLoading(true)
        if (!editing) return
        try {
            const formData = new FormData()
            formData.append("groceryId", editing?._id?.toString()!)
            formData.append("name", editing?.name)

            const currentCats = editing.categories && editing.categories.length > 0
                ? editing.categories
                : (editing.category ? [editing.category] : [])
            formData.append("category", currentCats[0] || editing.category)
            currentCats.forEach(c => formData.append("categories", c))

            formData.append("price", editing.price)
            formData.append("unit", editing.unit)
            formData.append("inStock", (editing.inStock !== false).toString())
            if (backendImage) {
                formData.append("image", backendImage)
            }
            await axios.post("/api/admin/edit-grocery", formData)
            setLoading(false)
            window.location.reload()
        } catch (error) {
            console.log(error)
            setLoading(false)
        }
    }

    const handleDelete = async () => {
        if (!confirm(`Are you sure you want to permanently delete "${editing?.name}"?`)) return
        setDeleteLoading(true)
        if (!editing) return
        try {
            await axios.post("/api/admin/delete-grocery", { groceryId: editing._id })
            setDeleteLoading(false)
            window.location.reload()
        } catch (error) {
            console.log(error)
            setDeleteLoading(false)
        }
    }

    const handleToggleStock = async (groceryId: any, newStockStatus: boolean) => {
        try {
            setGroceries(prev => prev?.map(g => g._id?.toString() === groceryId?.toString() ? { ...g, inStock: newStockStatus } : g))
            setFiltered(prev => prev?.map(g => g._id?.toString() === groceryId?.toString() ? { ...g, inStock: newStockStatus } : g))
            await axios.post('/api/admin/toggle-stock', { groceryId, inStock: newStockStatus })
        } catch (error) {
            console.error("Failed to toggle stock:", error)
            alert("Failed to update stock status.")
        }
    }

    const toggleEditingCategory = (cat: string) => {
        if (!editing) return
        const currentCats = editing.categories && editing.categories.length > 0
            ? [...editing.categories]
            : (editing.category ? [editing.category] : [])
        const updated = currentCats.includes(cat)
            ? currentCats.filter(c => c !== cat)
            : [...currentCats, cat]
        setEditing({
            ...editing,
            category: updated[0] || cat,
            categories: updated
        })
    }

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault()
        const q = search.toLowerCase()
        setFiltered(
            groceries?.filter(
                (g) => g.name.toLowerCase().includes(q) || 
                       g.category?.toLowerCase().includes(q) ||
                       g.categories?.some(c => c.toLowerCase().includes(q))
            )
        )
    }

    if (initialLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-[#f8fafc] gap-3">
                <Loader2 className="w-10 h-10 animate-spin text-green-600" />
                <p className="text-xs font-bold text-gray-400">Loading catalog inventory...</p>
            </div>
        )
    }

    const inStockCount = groceries?.filter(g => g.inStock !== false).length || 0
    const outOfStockCount = (groceries?.length || 0) - inStockCount

    return (
        <div className="min-h-screen bg-[#f8fafc] pt-24 sm:pt-28 pb-20">
            <div className="w-[94%] sm:w-[90%] max-w-7xl mx-auto space-y-6">
                
                {/* Back button & quick action */}
                <div className="flex items-center justify-between">
                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-gray-600 hover:text-green-700 bg-white px-3.5 py-2 rounded-xl border border-gray-200/80 shadow-xs transition"
                    >
                        <ArrowLeft size={16} className="text-green-600" /> Back to Storefront
                    </Link>

                    <Link
                        href="/admin/add-grocery"
                        className="inline-flex items-center gap-2 text-xs sm:text-sm font-black text-white bg-green-600 hover:bg-green-700 px-4 py-2 rounded-xl shadow-sm hover:shadow-md transition active:scale-95"
                    >
                        <Plus size={16} /> Add New Item
                    </Link>
                </div>

                {/* Header Card */}
                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex items-center gap-3.5">
                        <div className="w-12 h-12 rounded-2xl bg-green-100 text-green-700 flex items-center justify-center font-bold">
                            <Package size={24} />
                        </div>
                        <div>
                            <div className="flex items-center gap-2.5">
                                <h1 className="text-2xl sm:text-3xl font-black text-gray-800 tracking-tight">Catalog Inventory</h1>
                                <span className="bg-green-600 text-white text-xs font-black px-2.5 py-1 rounded-full">
                                    {groceries?.length || 0} Products
                                </span>
                            </div>
                            <p className="text-xs sm:text-sm text-gray-400 font-medium mt-0.5">
                                Manage stock, edit prices, update product photos, and organize category tags.
                            </p>
                        </div>
                    </div>

                    {/* Stats pills */}
                    <div className="flex items-center gap-2.5 w-full md:w-auto">
                        <span className="flex-1 md:flex-initial text-center text-xs font-black text-green-700 bg-green-50 px-3 py-1.5 rounded-xl border border-green-200">
                            🟢 {inStockCount} In Stock
                        </span>
                        <span className="flex-1 md:flex-initial text-center text-xs font-black text-red-700 bg-red-50 px-3 py-1.5 rounded-xl border border-red-200">
                            🔴 {outOfStockCount} Out of Stock
                        </span>
                    </div>
                </div>

                {/* Search Toolbar */}
                <form 
                    onSubmit={handleSearch}
                    className="flex items-center bg-white border border-gray-200 rounded-2xl px-4 py-2.5 shadow-xs focus-within:ring-2 focus-within:ring-green-500 transition-all max-w-xl"
                >
                    <Search className="text-gray-400 w-4 h-4 mr-2.5 shrink-0" />
                    <input 
                        type="text" 
                        className="w-full outline-none text-xs sm:text-sm text-gray-700 placeholder-gray-400 font-medium bg-transparent" 
                        placeholder="Search items by name, category or tag..." 
                        value={search} 
                        onChange={(e) => {
                            setSearch(e.target.value)
                            const q = e.target.value.toLowerCase()
                            setFiltered(
                                groceries?.filter((g) => 
                                    g.name.toLowerCase().includes(q) || 
                                    g.category?.toLowerCase().includes(q) ||
                                    g.categories?.some(c => c.toLowerCase().includes(q))
                                )
                            )
                        }}
                    />
                    {search && (
                        <button 
                            type="button" 
                            onClick={() => { setSearch(""); setFiltered(groceries) }}
                            className="text-gray-400 hover:text-gray-600 text-xs font-bold"
                        >
                            ✕
                        </button>
                    )}
                </form>

                {/* Products Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
                    {filtered?.map((g) => (
                        <motion.div
                            key={g._id?.toString()}
                            whileHover={{ y: -3 }}
                            transition={{ duration: 0.2 }}
                            className="bg-white rounded-3xl p-4 border border-gray-100 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group"
                        >
                            <div>
                                {/* Product Image */}
                                <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-gray-50 border border-gray-100 mb-3">
                                    <Image
                                        src={g.image}
                                        alt={g.name}
                                        fill
                                        className={`object-cover group-hover:scale-105 transition-transform duration-500 ${g.inStock === false ? "grayscale opacity-75" : ""}`}
                                    />
                                    {g.inStock === false && (
                                        <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] flex items-center justify-center">
                                            <span className="bg-red-600 text-white text-[10px] font-black uppercase px-2.5 py-1 rounded-full shadow">
                                                Out of Stock
                                            </span>
                                        </div>
                                    )}

                                    {/* Unit tag overlay */}
                                    <span className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm text-gray-700 text-[10px] font-black px-2 py-0.5 rounded-lg border border-gray-200/60 shadow-xs">
                                        {g.unit}
                                    </span>
                                </div>

                                {/* Title and Category Tags */}
                                <h3 className="font-extrabold text-gray-800 text-sm line-clamp-1">{g.name}</h3>
                                <div className="flex flex-wrap gap-1 mt-1.5">
                                    {(g.categories && g.categories.length > 0 ? g.categories : [g.category]).slice(0, 2).map((c, idx) => (
                                        <span key={idx} className="text-[10px] font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded-md border border-green-200/80">
                                            {c}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            {/* Bottom Strip: Price + Stock Toggle + Edit Button */}
                            <div className="pt-4 mt-3 border-t border-gray-100 space-y-3">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <span className="text-xs text-gray-400 font-medium">Price:</span>
                                        <p className="text-green-700 font-black text-lg leading-tight">
                                            ₹{g.price}
                                        </p>
                                    </div>

                                    {/* 1-Click Fast Stock Toggle */}
                                    <button
                                        type="button"
                                        onClick={() => handleToggleStock(g._id, g.inStock === false ? true : false)}
                                        className={`px-3 py-1.5 rounded-xl text-xs font-black transition flex items-center gap-1.5 cursor-pointer border active:scale-95 ${
                                            g.inStock !== false
                                                ? "bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                                                : "bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
                                        }`}
                                    >
                                        <span className={`w-2 h-2 rounded-full ${g.inStock !== false ? "bg-green-500 animate-pulse" : "bg-red-500"}`}></span>
                                        <span>{g.inStock !== false ? "In Stock" : "Out of Stock"}</span>
                                    </button>
                                </div>

                                <button 
                                    className="w-full bg-gray-50 hover:bg-green-600 text-gray-700 hover:text-white py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer active:scale-95 border border-gray-200 hover:border-green-600" 
                                    onClick={() => setEditing(g)}
                                >
                                    <Pencil size={13} /> Edit Item Details
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {filtered?.length === 0 && (
                    <div className="bg-white rounded-3xl p-14 text-center border border-gray-100 shadow-sm space-y-3">
                        <Package size={36} className="text-gray-300 mx-auto" />
                        <h3 className="text-base font-bold text-gray-700">No matching items found</h3>
                        <p className="text-xs text-gray-400">Try adjusting your search query or clear the filter.</p>
                    </div>
                )}
            </div>

            {/* Edit Item Modal */}
            <AnimatePresence>
                {editing && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 px-4 p-4 overflow-y-auto"
                    >
                        <motion.div
                            initial={{ y: 30, opacity: 0, scale: 0.97 }}
                            animate={{ y: 0, opacity: 1, scale: 1 }}
                            exit={{ y: 30, opacity: 0, scale: 0.97 }}
                            transition={{ duration: 0.2 }}
                            className="bg-white rounded-3xl shadow-2xl w-full max-w-lg p-6 sm:p-7 relative max-h-[90vh] overflow-y-auto"
                        >
                            <div className="flex justify-between items-center mb-5 pb-3 border-b border-gray-100">
                                <div>
                                    <h2 className="text-xl font-black text-gray-800 flex items-center gap-2">
                                        <Pencil size={18} className="text-green-600" /> Edit Grocery Item
                                    </h2>
                                    <p className="text-xs text-gray-400">Update item pricing, categories, and inventory details</p>
                                </div>
                                <button 
                                    className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 flex items-center justify-center transition" 
                                    onClick={() => setEditing(null)}
                                >
                                    <X size={16} />
                                </button>
                            </div>

                            {/* Image Preview & Upload */}
                            <div className="relative aspect-video w-full rounded-2xl overflow-hidden mb-4 border border-gray-200 group bg-gray-50">
                                {imagePreview && (
                                    <Image
                                        src={imagePreview}
                                        alt={editing.name}
                                        fill
                                        className="object-contain"
                                    />
                                )}
                                <label 
                                    htmlFor="imageUpload" 
                                    className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center cursor-pointer transition-opacity text-white gap-1"
                                >
                                    <Upload size={24} className="text-white" />
                                    <span className="text-xs font-bold">Change Image</span>
                                </label>
                                <input type="file" accept="image/*" hidden id="imageUpload" onChange={handleImageUpload} />
                            </div>

                            <div className="space-y-3.5">
                                <div className="space-y-1">
                                    <label className="text-xs font-black text-gray-600 uppercase">Item Name</label>
                                    <input
                                        type="text"
                                        placeholder="Enter Grocery Name"
                                        value={editing.name}
                                        onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                                        className="w-full border border-gray-200 bg-gray-50/50 rounded-2xl p-3 text-xs font-bold focus:ring-2 focus:ring-green-500 focus:bg-white outline-none transition"
                                    />
                                </div>

                                {/* Category Tags */}
                                <div className="space-y-1.5">
                                    <label className="text-xs font-black text-gray-600 uppercase flex items-center gap-1">
                                        <Tag size={13} className="text-green-600" /> Category Tags (Multi-Select)
                                    </label>
                                    <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-2.5 bg-gray-50/70 rounded-2xl border border-gray-200">
                                        {categories.map((cat) => {
                                            const currentCats = editing.categories && editing.categories.length > 0
                                                ? editing.categories
                                                : (editing.category ? [editing.category] : [])
                                            const isSelected = currentCats.includes(cat)
                                            return (
                                                <button
                                                    key={cat}
                                                    type="button"
                                                    onClick={() => toggleEditingCategory(cat)}
                                                    className={`text-[11px] font-bold px-2.5 py-1 rounded-xl border transition cursor-pointer ${
                                                        isSelected
                                                            ? "bg-green-600 text-white border-green-600 shadow-2xs"
                                                            : "bg-white text-gray-700 hover:bg-gray-100 border-gray-200"
                                                    }`}
                                                >
                                                    {isSelected ? `✓ ${cat}` : cat}
                                                </button>
                                            )
                                        })}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <label className="text-xs font-black text-gray-600 uppercase">Price (₹)</label>
                                        <input
                                            type="text"
                                            placeholder="Price"
                                            value={editing.price}
                                            onChange={(e) => setEditing({ ...editing, price: e.target.value })}
                                            className="w-full border border-gray-200 bg-gray-50/50 rounded-2xl p-3 text-xs font-bold focus:ring-2 focus:ring-green-500 focus:bg-white outline-none transition"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-black text-gray-600 uppercase">Unit / Weight</label>
                                        <input
                                            type="text"
                                            placeholder="e.g. 500 g, 1 kg"
                                            value={editing.unit}
                                            onChange={(e) => setEditing({ ...editing, unit: e.target.value })}
                                            className="w-full border border-gray-200 bg-gray-50/50 rounded-2xl p-3 text-xs font-bold focus:ring-2 focus:ring-green-500 focus:bg-white outline-none transition"
                                        />
                                    </div>
                                </div>

                                {/* Stock Availability Toggle */}
                                <div className="flex items-center justify-between p-3.5 bg-gray-50/80 rounded-2xl border border-gray-200">
                                    <div>
                                        <span className="text-xs font-black uppercase text-gray-700 block">Inventory Status</span>
                                        <span className="text-[11px] text-gray-400">
                                            {editing.inStock !== false ? "Available for order" : "Marked out of stock"}
                                        </span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setEditing({ ...editing, inStock: editing.inStock === false ? true : false })}
                                        className={`px-3 py-1.5 rounded-full text-xs font-black transition flex items-center gap-1.5 cursor-pointer border ${
                                            editing.inStock !== false
                                                ? "bg-green-100 text-green-800 border-green-300"
                                                : "bg-red-100 text-red-800 border-red-300"
                                        }`}
                                    >
                                        <span className={`w-2 h-2 rounded-full ${editing.inStock !== false ? "bg-green-600 animate-pulse" : "bg-red-600"}`}></span>
                                        <span>{editing.inStock !== false ? "In Stock" : "Out of Stock"}</span>
                                    </button>
                                </div>
                            </div>

                            {/* Modal Actions */}
                            <div className="flex justify-between items-center gap-3 mt-6 pt-4 border-t border-gray-100">
                                <button
                                    className="px-4 py-2.5 rounded-2xl bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                                    onClick={handleDelete}
                                    disabled={deleteLoading}
                                >
                                    {deleteLoading ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />} Delete Item
                                </button>

                                <div className="flex items-center gap-2">
                                    <button
                                        className="px-4 py-2.5 rounded-2xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold transition cursor-pointer"
                                        onClick={() => setEditing(null)}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        className="px-5 py-2.5 rounded-2xl bg-green-600 hover:bg-green-700 text-white text-xs font-black flex items-center gap-2 transition cursor-pointer shadow-md active:scale-95 disabled:opacity-50"
                                        onClick={handleEdit}
                                        disabled={loading}
                                    >
                                        {loading ? <Loader2 size={14} className="animate-spin" /> : null} Save Changes
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
