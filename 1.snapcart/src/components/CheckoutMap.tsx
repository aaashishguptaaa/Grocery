'use client'

import React, { useEffect, useMemo, useRef } from 'react'
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { Crosshair, LocateFixed } from 'lucide-react'

// Custom Red Pin Icon with drop shadow
const customIcon = L.icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [28, 44],
    iconAnchor: [14, 44],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
})

// Map Controller: handles flyTo animation & map clicks
function MapController({ 
    position, 
    setPosition 
}: { 
    position: [number, number], 
    setPosition: (pos: [number, number]) => void 
}) {
    const map = useMap()

    // Smoothly fly to new position when changed
    useEffect(() => {
        if (position && position[0] && position[1]) {
            map.flyTo(position, 17, { duration: 1.2 })
        }
    }, [position, map])

    // Click anywhere on map to move pin
    useMapEvents({
        click(e) {
            setPosition([e.latlng.lat, e.latlng.lng])
        }
    })

    return null
}

export default function CheckOutMap({
    position,
    setPosition
}: {
    position: [number, number],
    setPosition: (pos: [number, number]) => void
}) {
    const markerRef = useRef<any>(null)

    // Handle marker dragging
    const eventHandlers = useMemo(
        () => ({
            dragend() {
                const marker = markerRef.current
                if (marker != null) {
                    const latLng = marker.getLatLng()
                    setPosition([latLng.lat, latLng.lng])
                }
            },
        }),
        [setPosition]
    )

    // Quick Locate Me GPS Trigger
    const handleLocateMe = (e: React.MouseEvent) => {
        e.stopPropagation()
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    setPosition([pos.coords.latitude, pos.coords.longitude])
                },
                (err) => console.log(err),
                { enableHighAccuracy: true }
            )
        }
    }

    return (
        <div className="relative w-full h-full">
            <MapContainer
                center={position}
                zoom={16}
                scrollWheelZoom={true}
                className="w-full h-full z-0"
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                <MapController position={position} setPosition={setPosition} />

                {/* Draggable Red Marker */}
                <Marker
                    draggable={true}
                    eventHandlers={eventHandlers}
                    position={position}
                    ref={markerRef}
                    icon={customIcon}
                />
            </MapContainer>

            {/* Floating "Locate Me" Button ON the Map Widget */}
            <button
                type="button"
                onClick={handleLocateMe}
                title="Center on My GPS Location"
                className="absolute top-3 right-3 z-1000 bg-white/95 backdrop-blur-md hover:bg-white text-green-700 hover:text-green-800 p-2.5 rounded-2xl shadow-lg border border-gray-200 transition-all hover:scale-105 active:scale-95 flex items-center gap-1.5 text-xs font-bold cursor-pointer"
            >
                <Crosshair size={16} className="text-green-600 animate-pulse" />
                <span className="hidden sm:inline">My Location</span>
            </button>
        </div>
    )
}