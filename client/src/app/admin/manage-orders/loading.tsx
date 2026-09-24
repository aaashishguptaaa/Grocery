import React from 'react'

export default function ManageOrdersLoading() {
    return (
        <div className="min-h-screen bg-[#f8fafc] pt-24 sm:pt-28 pb-20 animate-pulse">
            <div className="w-[94%] sm:w-[90%] max-w-7xl mx-auto space-y-6">
                
                {/* Back button & Live status */}
                <div className="flex items-center justify-between gap-3">
                    <div className="h-9 w-44 bg-gray-200 rounded-xl" />
                    <div className="h-8 w-24 bg-gray-200 rounded-xl" />
                </div>

                {/* Page Header Card Skeleton */}
                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-green-100/70 shrink-0" />
                        <div className="space-y-2">
                            <div className="flex items-center gap-2.5">
                                <div className="h-7 w-48 bg-gray-200 rounded-lg" />
                                <div className="h-5 w-16 bg-green-200/80 rounded-full" />
                            </div>
                            <div className="h-4 w-72 max-w-full bg-gray-200 rounded-md" />
                        </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                        <div className="h-10 w-36 bg-gray-200 rounded-2xl" />
                        <div className="h-10 w-44 bg-emerald-200/70 rounded-2xl" />
                    </div>
                </div>

                {/* 4 Metric Stats Summary Skeleton */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-100 shadow-sm flex items-start gap-3.5">
                            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gray-200 shrink-0" />
                            <div className="space-y-2 flex-1">
                                <div className="h-6 w-12 bg-gray-200 rounded-md" />
                                <div className="h-3 w-20 bg-gray-200 rounded-md" />
                                <div className="h-4 w-16 bg-gray-100 rounded-md" />
                            </div>
                        </div>
                    ))}
                </div>

                {/* Search Bar & Filter Tabs Skeleton */}
                <div className="bg-white p-4 sm:p-5 rounded-3xl border border-gray-100 shadow-sm space-y-4">
                    <div className="h-11 w-full bg-gray-200 rounded-2xl" />
                    <div className="flex items-center gap-2 overflow-x-auto pb-1">
                        <div className="h-9 w-24 bg-green-200/70 rounded-xl shrink-0" />
                        <div className="h-9 w-28 bg-gray-200 rounded-xl shrink-0" />
                        <div className="h-9 w-32 bg-gray-200 rounded-xl shrink-0" />
                        <div className="h-9 w-28 bg-gray-200 rounded-xl shrink-0" />
                    </div>
                </div>

                {/* Order Cards Skeleton */}
                <div className="space-y-4">
                    {[1, 2, 3].map((cardIdx) => (
                        <div key={cardIdx} className="bg-white rounded-3xl p-5 sm:p-6 border border-gray-100 shadow-sm space-y-4">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-gray-100">
                                <div className="flex items-center gap-3">
                                    <div className="h-7 w-28 bg-gray-200 rounded-xl" />
                                    <div className="h-5 w-24 bg-gray-200 rounded-md" />
                                </div>
                                <div className="h-7 w-32 bg-gray-200 rounded-xl" />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
                                <div className="space-y-2">
                                    <div className="h-3 w-20 bg-gray-200 rounded" />
                                    <div className="h-4 w-32 bg-gray-200 rounded" />
                                    <div className="h-3 w-40 bg-gray-100 rounded" />
                                </div>
                                <div className="space-y-2">
                                    <div className="h-3 w-20 bg-gray-200 rounded" />
                                    <div className="h-4 w-48 bg-gray-200 rounded" />
                                    <div className="h-3 w-36 bg-gray-100 rounded" />
                                </div>
                                <div className="space-y-2">
                                    <div className="h-3 w-20 bg-gray-200 rounded" />
                                    <div className="h-4 w-28 bg-gray-200 rounded" />
                                </div>
                            </div>

                            <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                                <div className="h-6 w-24 bg-gray-200 rounded-lg" />
                                <div className="h-9 w-36 bg-green-200/80 rounded-xl" />
                            </div>
                        </div>
                    ))}
                </div>

            </div>
        </div>
    )
}
