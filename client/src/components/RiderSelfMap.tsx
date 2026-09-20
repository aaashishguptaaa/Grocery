'use client'

import React, { useEffect, useState, useRef, useMemo } from 'react'
import { MapContainer, Marker, Popup, TileLayer, useMap, useMapEvents } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { Crosshair, Hand } from 'lucide-react'

// Custom Pulsing Green Rider Pin (Designed for dragging)
const riderPinIcon = L.divIcon({
    className: 'custom-rider-pin',
    html: `
        <div style="position: relative; width: 42px; height: 42px; display: flex; align-items: center; justify-content: center; cursor: grab;">
            <div style="position: absolute; width: 42px; height: 42px; background-color: rgba(34, 197, 94, 0.35); border-radius: 50%; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
            <div style="width: 30px; height: 30px; background-color: #16a34a; border: 3px solid white; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 8px rgba(0,0,0,0.35); font-size: 15px;">
                🛵
            </div>
        </div>
    `,
    iconSize: [42, 42],
    iconAnchor: [21, 21],
    popupAnchor: [0, -22]
})

const storePinIcon = L.icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-gold.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
})

function MapClickHandler({ onLocationSet }: { onLocationSet: (lat: number, lng: number) => void }) {
    useMapEvents({
        click(e) {
            onLocationSet(e.latlng.lat, e.latlng.lng)
        }
    })
    return null
}

function PanToRider({ position }: { position: [number, number] }) {
    const map = useMap()
    useEffect(() => {
        if (position && position[0] && position[1]) {
            map.flyTo(position, map.getZoom(), { animate: true, duration: 0.6 })
        }
    }, [position, map])
    return null
}

export default function RiderSelfMap({
    currentCoords,
    onLocationChange
}: {
    currentCoords: [number, number],
    onLocationChange: (lat: number, lng: number) => void
}) {
    const storePos: [number, number] = [25.4358, 81.8463]
    const [locating, setLocating] = useState<boolean>(false)
    const markerRef = useRef<L.Marker>(null)

    // Draggable marker event handlers
    const markerEventHandlers = useMemo(
        () => ({
            dragend() {
                const marker = markerRef.current
                if (marker != null) {
                    const latLng = marker.getLatLng()
                    onLocationChange(latLng.lat, latLng.lng)
                }
            },
        }),
        [onLocationChange]
    )

    // Smooth Geolocation with automatic fallbacks so it never errors out
    const handleLocateMe = () => {
        setLocating(true)

        if (typeof window === "undefined" || !navigator.geolocation) {
            setLocating(false)
            return
        }

        // Try high-accuracy first
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const lat = pos.coords.latitude
                const lng = pos.coords.longitude
                onLocationChange(lat, lng)
                setLocating(false)
            },
            () => {
                // If high-accuracy fails or times out, fallback to network/low-accuracy
                navigator.geolocation.getCurrentPosition(
                    (pos) => {
                        const lat = pos.coords.latitude
                        const lng = pos.coords.longitude
                        onLocationChange(lat, lng)
                        setLocating(false)
                    },
                    () => {
                        if (currentCoords) {
                            onLocationChange(currentCoords[0], currentCoords[1])
                        }
                        setLocating(false)
                    },
                    { enableHighAccuracy: false, timeout: 15000, maximumAge: 300000 }
                )
            },
            { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
        )
    }

    return (
        <div className="w-full h-80 rounded-3xl overflow-hidden border-2 border-green-500/40 shadow-inner relative z-0">
            <MapContainer
                center={currentCoords}
                zoom={14}
                scrollWheelZoom={true}      // Mouse scroll wheel zoom enabled
                touchZoom={true}            // Smartphone two-finger pinch-to-zoom enabled
                doubleClickZoom={true}      // Double click to zoom in enabled
                zoomControl={true}          // Default +/- zoom buttons enabled on top-left
                className="w-full h-full"
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                <PanToRider position={currentCoords} />
                <MapClickHandler onLocationSet={onLocationChange} />

                {/* 1. Store Pickup Location */}
                <Marker position={storePos} icon={storePinIcon}>
                    <Popup>
                        <b>🏪 Snapcart Central Mart</b><br />
                        Store Pickup Point
                    </Popup>
                </Marker>

                {/* 2. Draggable Delivery Boy Pulsing Green Marker */}
                <Marker 
                    draggable={true}
                    eventHandlers={markerEventHandlers}
                    position={currentCoords} 
                    ref={markerRef}
                    icon={riderPinIcon}
                >
                    <Popup>
                        <b>🟢 You are here (Draggable!)</b><br />
                        <span className="text-[11px] text-gray-500">
                            Drag and release to set your live location.<br />
                            {currentCoords[0].toFixed(4)}° N, {currentCoords[1].toFixed(4)}° E
                        </span>
                    </Popup>
                </Marker>
            </MapContainer>

            {/* Quick "My Location" Button on Map */}
            <button
                type="button"
                onClick={handleLocateMe}
                disabled={locating}
                className="absolute top-3 right-3 bg-white hover:bg-gray-50 text-green-700 px-3.5 py-2 rounded-2xl shadow-lg border border-gray-200 z-[1000] flex items-center gap-1.5 text-xs font-black cursor-pointer transition active:scale-95 disabled:opacity-75"
                title="Detect My Live Location"
            >
                <Crosshair size={16} className={`text-green-600 ${locating ? "animate-spin" : ""}`} />
                <span>{locating ? "Locating..." : "My Location"}</span>
            </button>

            {/* Bottom Floating Info Bar */}
            <div className="absolute bottom-2 left-2 right-2 bg-white/95 backdrop-blur-md rounded-2xl p-2.5 z-[1000] flex items-center justify-between text-[11px] font-bold border border-gray-200 shadow-md">
                <span className="text-green-700 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-ping"></span>
                    <span>Live GPS Active • Updates as you ride</span>
                </span>
                <span className="text-gray-500 text-[10px] hidden sm:flex items-center gap-1 bg-gray-50 px-2 py-0.5 rounded-lg border border-gray-200">
                    <Hand size={11} className="text-gray-400" /> Drag 🛵 marker or click map anywhere
                </span>
            </div>
        </div>
    )
}
