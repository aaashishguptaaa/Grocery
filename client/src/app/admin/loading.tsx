import React from 'react'

export default function AdminLoading() {
    return (
        <div className="min-h-screen bg-[#f8fafc] pt-24 sm:pt-28 pb-20 animate-pulse">
            <div className="w-[94%] sm:w-[90%] max-w-7xl mx-auto space-y-6">
                
                {/* Back button skeleton */}
                <div className="flex items-center justify-between gap-3">
                    <div className="h-9 w-44 bg-gray-200 rounded-xl" />
                </div>

                {/* Header Card Skeleton */}
                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-green-100/70 shrink-0" />
                        <div className="space-y-2">
                            <div className="h-7 w-48 bg-gray-200 rounded-lg" />
                            <div className="h-4 w-72 max-w-full bg-gray-200 rounded-md" />
                        </div>
                    </div>
                    <div className="h-10 w-36 bg-gray-200 rounded-2xl" />
                </div>

                {/* Content grid skeleton */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div key={i} className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm space-y-3">
                            <div className="h-40 w-full bg-gray-100 rounded-2xl" />
                            <div className="h-5 w-3/4 bg-gray-200 rounded-md" />
                            <div className="h-4 w-1/2 bg-gray-200 rounded-md" />
                        </div>
                    ))}
                </div>

            </div>
        </div>
    )
}
