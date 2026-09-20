'use client'

import { ArrowLeft, Check, Image as ImageIcon, Loader2, Plus, Sparkles, Star, Tag, Upload, X } from 'lucide-react'
import Link from 'next/link'
import React, { ChangeEvent, FormEvent, useState, useRef } from 'react'
import { motion } from "motion/react"
import Image from 'next/image'
import axios from 'axios'

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

export default function AddGrocery() {
    const [name, setName] = useState("")
    const [price, setPrice] = useState("")
    const [mrp, setMrp] = useState("")
    const [description, setDescription] = useState("")
    const [selectedCategories, setSelectedCategories] = useState<string[]>([])
    const [quantityAmount, setQuantityAmount] = useState("500")
    const [unitType, setUnitType] = useState("g")
    const [inStock, setInStock] = useState(true)

    const toggleCategory = (cat: string) => {
        setSelectedCategories(prev =>
            prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
        )
    }

    // Multi-image state
    const [images, setImages] = useState<File[]>([])
    const [imagePreviews, setImagePreviews] = useState<string[]>([])
    const [primaryIndex, setPrimaryIndex] = useState<number>(0)
    const [loading, setLoading] = useState(false)

    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleImages = (e: ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || [])
        if (files.length === 0) return

        const validFiles = files.filter(f => {
            if (f.size > 5 * 1024 * 1024) {
                alert(`File "${f.name}" exceeds 5MB limit and was skipped.`)
                return false
            }
            return true
        })

        const newPreviews = validFiles.map(f => URL.createObjectURL(f))

        setImages(prev => [...prev, ...validFiles])
        setImagePreviews(prev => [...prev, ...newPreviews])

        if (e.target) e.target.value = ""
    }

    const removeImage = (index: number) => {
        setImages(prev => prev.filter((_, i) => i !== index))
        setImagePreviews(prev => prev.filter((_, i) => i !== index))

        if (primaryIndex === index) {
            setPrimaryIndex(0)
        } else if (primaryIndex > index) {
            setPrimaryIndex(prev => prev - 1)
        }
    }

    const setAsCover = (index: number) => {
        setPrimaryIndex(index)
    }

    const discountPercent = (mrp && price && Number(mrp) > Number(price))
        ? Math.round(((Number(mrp) - Number(price)) / Number(mrp)) * 100)
        : 0

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault()
        const finalUnit = `${quantityAmount.trim()} ${unitType.trim()}`.trim()
        if (!name || !price || selectedCategories.length === 0 || !quantityAmount) {
            alert("Please provide the product name, at least one category tag, and price.")
            return
        }

        if (images.length === 0) {
            alert("Please upload at least one product photo.")
            return
        }

        setLoading(true)
        try {
            const formData = new FormData()
            formData.append("name", name)
            formData.append("price", price)
            formData.append("mrp", mrp)
            formData.append("description", description)
            formData.append("category", selectedCategories[0])
            selectedCategories.forEach(cat => {
                formData.append("categories", cat)
            })
            formData.append("unit", finalUnit)
            formData.append("inStock", inStock ? "true" : "false")

            const orderedImages = [
                images[primaryIndex],
                ...images.filter((_, i) => i !== primaryIndex)
            ]

            orderedImages.forEach((file) => {
                formData.append("images", file)
            })

            const res = await axios.post("/api/admin/add-grocery", formData)
            if (res.status === 200 || res.status === 201) {
                alert(`🎉 "${name}" (${finalUnit}) added successfully!`)
                setName("")
                setPrice("")
                setMrp("")
                setDescription("")
                setSelectedCategories([])
                setQuantityAmount("500")
                setUnitType("g")
                setImages([])
                setImagePreviews([])
                setPrimaryIndex(0)
            }
        } catch (error: any) {
            console.error("Error adding grocery:", error)
            alert(error?.response?.data?.message || "Failed to add grocery item.")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-[#f8fafc] pt-24 sm:pt-28 pb-20">
            <div className="w-[94%] sm:w-[90%] max-w-6xl mx-auto space-y-6">
                {/* Back Link */}
                <Link 
                    href="/" 
                    className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-gray-600 hover:text-green-700 bg-white px-3.5 py-2 rounded-xl border border-gray-200/80 shadow-xs transition"
                >
                    <ArrowLeft size={16} className="text-green-600" /> Back to Storefront
                </Link>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    {/* Left Form (7 cols on lg) */}
                    <motion.div
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="lg:col-span-8 bg-white border border-gray-100 shadow-sm rounded-3xl p-6 sm:p-8 space-y-6"
                    >
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-black text-gray-800 tracking-tight flex items-center gap-2">
                                <Plus className="text-green-600 w-7 h-7" /> Add New Grocery
                            </h1>
                            <p className="text-gray-400 text-xs sm:text-sm mt-1 font-medium">
                                Configure product pricing, upload gallery photos, and set delivery attributes.
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-5">
                            {/* Item Name */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-black uppercase text-gray-700">Product Name</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Organic Seedless Watermelon"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full border border-gray-200 bg-gray-50/60 rounded-2xl px-4 py-3 text-xs sm:text-sm font-semibold focus:ring-2 focus:ring-green-500 focus:bg-white outline-none transition"
                                    required
                                />
                            </div>

                            {/* Category Multi-Select */}
                            <div className="space-y-2 p-4 bg-gray-50/70 rounded-2xl border border-gray-200/80">
                                <div className="flex items-center justify-between">
                                    <label className="text-xs font-black uppercase text-gray-700 flex items-center gap-1.5">
                                        <Tag size={14} className="text-green-600" />
                                        <span>Categories & Tags ({selectedCategories.length} selected)</span>
                                    </label>
                                    <span className="text-[10px] text-green-700 font-bold bg-green-50 px-2 py-0.5 rounded-md border border-green-200">
                                        Multi-tag enabled
                                    </span>
                                </div>

                                <div className="flex flex-wrap gap-1.5 pt-1">
                                    {categories.map((cat) => {
                                        const isSelected = selectedCategories.includes(cat)
                                        return (
                                            <button
                                                key={cat}
                                                type="button"
                                                onClick={() => toggleCategory(cat)}
                                                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border ${
                                                    isSelected
                                                        ? "bg-green-600 text-white border-green-600 shadow-2xs scale-[1.02]"
                                                        : "bg-white text-gray-700 hover:bg-gray-100 border-gray-200"
                                                }`}
                                            >
                                                {isSelected && <Check size={12} className="text-white" />}
                                                <span>{cat}</span>
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>

                            {/* Quantity Amount & Unit */}
                            <div className="space-y-1.5">
                                <div className="flex items-center justify-between">
                                    <label className="text-xs font-black uppercase text-gray-700">Quantity & Measurement</label>
                                    <span className="text-[11px] text-green-700 font-bold bg-green-50 px-2.5 py-0.5 rounded-md border border-green-200">
                                        Display: {quantityAmount || "1"} {unitType}
                                    </span>
                                </div>

                                <div className="flex gap-2.5">
                                    <input
                                        type="number"
                                        step="any"
                                        min="0.1"
                                        placeholder="500"
                                        value={quantityAmount}
                                        onChange={(e) => setQuantityAmount(e.target.value)}
                                        className="w-1/2 border border-gray-200 bg-gray-50/60 rounded-2xl px-4 py-3 text-xs sm:text-sm font-bold focus:ring-2 focus:ring-green-500 focus:bg-white outline-none transition"
                                        required
                                    />

                                    <select
                                        value={unitType}
                                        onChange={(e) => setUnitType(e.target.value)}
                                        className="w-1/2 border border-gray-200 bg-gray-50/60 rounded-2xl px-4 py-3 text-xs sm:text-sm font-bold focus:ring-2 focus:ring-green-500 focus:bg-white outline-none transition cursor-pointer"
                                        required
                                    >
                                        <option value="g">g (Grams)</option>
                                        <option value="kg">kg (Kilograms)</option>
                                        <option value="ml">ml (Milliliters)</option>
                                        <option value="liter">liter (Litres)</option>
                                        <option value="piece">piece (Pcs)</option>
                                        <option value="pack">pack (Pack)</option>
                                        <option value="bunch">bunch</option>
                                        <option value="dozen">dozen</option>
                                    </select>
                                </div>

                                {/* Quick Presets */}
                                <div className="flex flex-wrap gap-1.5 pt-1">
                                    {[
                                        { amt: "250", u: "g" },
                                        { amt: "500", u: "g" },
                                        { amt: "1", u: "kg" },
                                        { amt: "2", u: "kg" },
                                        { amt: "500", u: "ml" },
                                        { amt: "1", u: "liter" },
                                        { amt: "1", u: "pack" },
                                        { amt: "6", u: "piece" }
                                    ].map((preset, idx) => (
                                        <button
                                            key={idx}
                                            type="button"
                                            onClick={() => {
                                                setQuantityAmount(preset.amt)
                                                setUnitType(preset.u)
                                            }}
                                            className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border transition cursor-pointer ${
                                                quantityAmount === preset.amt && unitType === preset.u
                                                    ? "bg-green-600 text-white border-green-600 shadow-2xs"
                                                    : "bg-gray-100/80 text-gray-600 hover:bg-gray-200 border-gray-200"
                                            }`}
                                        >
                                            {preset.amt} {preset.u}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Pricing: Price + MRP */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-black uppercase text-gray-700">Selling Price (₹)</label>
                                    <input
                                        type="number"
                                        placeholder="e.g. 89"
                                        value={price}
                                        onChange={(e) => setPrice(e.target.value)}
                                        className="w-full border border-gray-200 bg-gray-50/60 rounded-2xl px-4 py-3 text-xs sm:text-sm font-black text-gray-800 focus:ring-2 focus:ring-green-500 focus:bg-white outline-none transition"
                                        required
                                        min="0"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <div className="flex items-center justify-between">
                                        <label className="text-xs font-black uppercase text-gray-700">MRP / Strike-through (₹)</label>
                                        <span className="text-[10px] text-gray-400 font-bold">Optional</span>
                                    </div>
                                    <input
                                        type="number"
                                        placeholder="e.g. 110"
                                        value={mrp}
                                        onChange={(e) => setMrp(e.target.value)}
                                        className="w-full border border-gray-200 bg-gray-50/60 rounded-2xl px-4 py-3 text-xs sm:text-sm font-semibold focus:ring-2 focus:ring-green-500 focus:bg-white outline-none transition"
                                        min="0"
                                    />
                                </div>
                            </div>

                            {discountPercent > 0 && (
                                <div className="p-3.5 bg-emerald-50 rounded-2xl border border-emerald-200 flex items-center justify-between text-xs font-bold text-emerald-900">
                                    <span className="flex items-center gap-1.5">
                                        <Sparkles size={16} className="text-emerald-600" />
                                        <span>Customer saves ₹{Number(mrp) - Number(price)} per unit</span>
                                    </span>
                                    <span className="bg-emerald-600 text-white px-3 py-1 rounded-full text-[11px] font-black shadow-xs">
                                        {discountPercent}% OFF
                                    </span>
                                </div>
                            )}

                            {/* Short Description */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-black uppercase text-gray-700">Description</label>
                                <textarea
                                    rows={2}
                                    placeholder="e.g. Freshly picked, crisp and sweet farm produce."
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    className="w-full border border-gray-200 bg-gray-50/60 rounded-2xl p-3.5 text-xs sm:text-sm font-medium focus:ring-2 focus:ring-green-500 focus:bg-white outline-none transition"
                                />
                            </div>

                            {/* Inventory Toggle */}
                            <div className="flex items-center justify-between p-4 bg-gray-50/80 rounded-2xl border border-gray-200">
                                <div>
                                    <span className="text-xs font-black uppercase text-gray-800 block">Inventory Availability</span>
                                    <span className="text-[11px] text-gray-400">
                                        {inStock ? "Item is active and orderable by customers" : "Item marked as out of stock"}
                                    </span>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => setInStock(!inStock)}
                                    className={`px-4 py-2 rounded-full text-xs font-black transition flex items-center gap-2 cursor-pointer border ${
                                        inStock
                                            ? "bg-green-50 text-green-800 border-green-300 shadow-2xs"
                                            : "bg-red-50 text-red-800 border-red-300 shadow-2xs"
                                    }`}
                                >
                                    <span className={`w-2 h-2 rounded-full ${inStock ? "bg-green-600 animate-pulse" : "bg-red-600"}`}></span>
                                    <span>{inStock ? "In Stock" : "Out of Stock"}</span>
                                </button>
                            </div>

                            {/* Multi-Image Upload */}
                            <div className="space-y-3 pt-2">
                                <div className="flex items-center justify-between">
                                    <label className="text-xs font-black uppercase text-gray-700 flex items-center gap-1.5">
                                        <ImageIcon size={15} className="text-green-600" />
                                        <span>Product Photos ({images.length} uploaded)</span>
                                    </label>
                                    <span className="text-[11px] text-gray-400 font-medium">PNG, JPG, WEBP under 5MB</span>
                                </div>

                                <input
                                    type="file"
                                    multiple
                                    accept="image/*"
                                    ref={fileInputRef}
                                    onChange={handleImages}
                                    className="hidden"
                                />

                                {imagePreviews.length > 0 ? (
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                        {imagePreviews.map((preview, i) => {
                                            const isCover = primaryIndex === i
                                            return (
                                                <div
                                                    key={i}
                                                    className={`relative aspect-square rounded-2xl overflow-hidden border-2 bg-gray-50 group shadow-xs transition-all ${
                                                        isCover ? "border-green-600 ring-2 ring-green-600/30" : "border-gray-200"
                                                    }`}
                                                >
                                                    <Image src={preview} alt={`Photo ${i + 1}`} fill className="object-cover" />
                                                    {isCover ? (
                                                        <span className="absolute top-1.5 left-1.5 bg-green-600 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-md shadow-sm flex items-center gap-1">
                                                            <Star size={10} className="fill-white" /> Cover
                                                        </span>
                                                    ) : (
                                                        <button
                                                            type="button"
                                                            onClick={() => setAsCover(i)}
                                                            className="absolute top-1.5 left-1.5 bg-black/60 hover:bg-green-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-md opacity-0 group-hover:opacity-100 transition cursor-pointer"
                                                        >
                                                            Set Cover
                                                        </button>
                                                    )}
                                                    <button
                                                        type="button"
                                                        onClick={() => removeImage(i)}
                                                        className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center shadow hover:scale-110 transition cursor-pointer"
                                                    >
                                                        <X size={12} />
                                                    </button>
                                                </div>
                                            )
                                        })}
                                        <button
                                            type="button"
                                            onClick={() => fileInputRef.current?.click()}
                                            className="aspect-square rounded-2xl border-2 border-dashed border-gray-300 hover:border-green-500 hover:bg-green-50/20 flex flex-col items-center justify-center text-gray-400 hover:text-green-700 transition cursor-pointer"
                                        >
                                            <Plus size={24} />
                                            <span className="text-[10px] font-bold mt-1">+ Add Photo</span>
                                        </button>
                                    </div>
                                ) : (
                                    <div
                                        onClick={() => fileInputRef.current?.click()}
                                        className="border-2 border-dashed border-gray-300 hover:border-green-500 rounded-3xl p-8 text-center transition cursor-pointer bg-gray-50/60 hover:bg-green-50/20"
                                    >
                                        <div className="flex flex-col items-center justify-center text-gray-400 space-y-2">
                                            <div className="w-12 h-12 rounded-2xl bg-green-100 flex items-center justify-center text-green-700">
                                                <Upload className="w-6 h-6" />
                                            </div>
                                            <p className="text-xs font-bold text-gray-700">Click to upload product photos</p>
                                            <p className="text-[11px] text-gray-400">Select multiple gallery images at once</p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Submit Button */}
                            <div className="pt-4">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full py-4 bg-green-600 hover:bg-green-700 text-white font-extrabold rounded-2xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 disabled:bg-gray-300 disabled:cursor-not-allowed text-sm"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="animate-spin w-5 h-5" /> Publishing to Snapcart...
                                        </>
                                    ) : (
                                        <>
                                            <Plus size={18} /> Publish Grocery Item
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </motion.div>

                    {/* Right Live Preview Card (4 cols on lg) */}
                    <div className="lg:col-span-4 sticky top-28 space-y-4">
                        <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm space-y-4">
                            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                                <h3 className="text-xs font-black uppercase text-gray-500 flex items-center gap-1.5">
                                    <Sparkles size={14} className="text-amber-500" /> Live Store Preview
                                </h3>
                                <span className="text-[10px] font-bold text-gray-400">Customer View</span>
                            </div>

                            {/* Product Card Simulator */}
                            <div className="bg-[#f8fafc] rounded-2xl p-3 border border-gray-100">
                                <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-white border border-gray-200/60 mb-3">
                                    {imagePreviews.length > 0 ? (
                                        <Image
                                            src={imagePreviews[primaryIndex] || imagePreviews[0]}
                                            alt="Preview"
                                            fill
                                            className="object-contain p-2"
                                        />
                                    ) : (
                                        <div className="flex flex-col items-center justify-center h-full text-gray-300">
                                            <ImageIcon size={36} />
                                            <span className="text-[10px] mt-1 font-bold">No Image Selected</span>
                                        </div>
                                    )}

                                    {discountPercent > 0 && (
                                        <span className="absolute top-2 left-2 bg-amber-400 text-amber-900 text-[10px] font-black px-2 py-0.5 rounded-md shadow-xs">
                                            {discountPercent}% OFF
                                        </span>
                                    )}

                                    <span className="absolute top-2 right-2 bg-white/90 text-[10px] font-bold px-2 py-0.5 rounded-md border border-gray-200 text-gray-600">
                                        ⚡ 10 MINS
                                    </span>
                                </div>

                                <div className="space-y-1">
                                    <div className="text-[10px] font-bold text-gray-400 uppercase">
                                        {selectedCategories[0] || "Grocery Item"}
                                    </div>
                                    <h4 className="font-extrabold text-gray-800 text-sm line-clamp-1">
                                        {name || "Item Title"}
                                    </h4>
                                    <div className="text-xs text-gray-400 font-semibold">
                                        {quantityAmount || "1"} {unitType}
                                    </div>

                                    <div className="flex items-center justify-between pt-2">
                                        <div className="flex items-baseline gap-1.5">
                                            <span className="text-base font-black text-green-700">
                                                ₹{price || "0"}
                                            </span>
                                            {mrp && Number(mrp) > Number(price) && (
                                                <span className="text-xs text-gray-400 line-through">
                                                    ₹{mrp}
                                                </span>
                                            )}
                                        </div>

                                        <button type="button" className="px-3.5 py-1 bg-green-50 text-green-700 border border-green-300 rounded-xl text-xs font-extrabold">
                                            + ADD
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <p className="text-[11px] text-gray-400 text-center font-medium">
                                Updates live as you fill in details on the left
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}