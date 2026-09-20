'use client'

import React, { useState, useEffect, useRef, useMemo } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import axios from 'axios'
import { Crosshair, MapPin, Search, Sparkles } from 'lucide-react'

// Custom Red Pin for Home/Delivery Location
const locationPinIcon = L.icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [26, 42],
    iconAnchor: [13, 42],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
})

function MapFlyTo({ position }: { position: [number, number] }) {
    const map = useMap()
    useEffect(() => {
        if (position && position[0] && position[1]) {
            map.flyTo(position, 16, { animate: true, duration: 0.8 })
        }
    }, [position, map])
    return null
}

function MapClickHandler({ onLocationPick }: { onLocationPick: (lat: number, lng: number) => void }) {
    useMapEvents({
        click(e) {
            onLocationPick(e.latlng.lat, e.latlng.lng)
        }
    })
    return null
}

export interface IPickedLocation {
    fullAddress: string;
    city: string;
    state: string;
    pincode: string;
    latitude: number;
    longitude: number;
}

export default function LocationPickerMap({
    initialCoords = [25.4358, 81.8463],
    onLocationSelect
}: {
    initialCoords?: [number, number];
    onLocationSelect: (loc: IPickedLocation) => void;
}) {
    const [coords, setCoords] = useState<[number, number]>(initialCoords)
    const [searchQuery, setSearchQuery] = useState<string>("")
    const [searching, setSearching] = useState<boolean>(false)
    const [detecting, setDetecting] = useState<boolean>(false)
    const [detectedText, setDetectedText] = useState<string>("")

    const markerRef = useRef<L.Marker>(null)

    // Reverse Geocoding with OpenStreetMap Nominatim
    const reverseGeocode = async (lat: number, lon: number) => {
        try {
            setSearching(true)
            const res = await axios.get(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`)
            if (res.data) {
                const addr = res.data.address || {}
                const road = addr.road || addr.suburb || addr.neighbourhood || addr.residential || ""
                const city = addr.city || addr.town || addr.village || addr.county || "Prayagraj"
                const state = addr.state || "Uttar Pradesh"
                const pincode = addr.postcode || ""
                const displayName = res.data.display_name || `${road}, ${city}`

                const picked: IPickedLocation = {
                    fullAddress: displayName.split(',').slice(0, 3).join(',').trim(),
                    city,
                    state,
                    pincode,
                    latitude: lat,
                    longitude: lon
                }

                setDetectedText(`${picked.fullAddress}, ${city}`)
                onLocationSelect(picked)
            }
        } catch (e) {
            // fallback
            onLocationSelect({
                fullAddress: `${lat.toFixed(4)}° N, ${lon.toFixed(4)}° E`,
                city: "Prayagraj",
                state: "Uttar Pradesh",
                pincode: "",
                latitude: lat,
                longitude: lon
            })
        } finally {
            setSearching(false)
        }
    }

    const handleCoordsChange = (lat: number, lng: number) => {
        setCoords([lat, lng])
        reverseGeocode(lat, lng)
    }

    const markerEventHandlers = useMemo(
        () => ({
            dragend() {
                const marker = markerRef.current
                if (marker != null) {
                    const latLng = marker.getLatLng()
                    handleCoordsChange(latLng.lat, latLng.lng)
                }
            },
        }),
        []
    )

    // Search locality / landmark
    const handleSearchLocality = async (e?: React.FormEvent) => {
        if (e) e.preventDefault()
        if (!searchQuery.trim()) return

        setSearching(true)
        try {
            const res = await axios.get(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`)
            if (res.data && res.data.length > 0) {
                const first = res.data[0]
                const lat = parseFloat(first.lat)
                const lon = parseFloat(first.lon)
                setCoords([lat, lon])
                reverseGeocode(lat, lon)
            } else {
                alert("Location not found. Please try another landmark or city name.")
            }
        } catch (err) {
            alert("Could not search location. Please click directly on the map.")
        } finally {
            setSearching(false)
        }
    }

    // 1-Click Detect Live GPS
    const handleDetectCurrentLocation = () => {
        setDetecting(true)
        if (typeof window !== "undefined" && navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    const lat = pos.coords.latitude
                    const lon = pos.coords.longitude
                    setCoords([lat, lon])
                    reverseGeocode(lat, lon)
                    setDetecting(false)
                },
                () => {
                    // Fallback to cached or low accuracy
                    navigator.geolocation.getCurrentPosition(
                        (pos) => {
                            const lat = pos.coords.latitude
                            const lon = pos.coords.longitude
                            setCoords([lat, lon])
                            reverseGeocode(lat, lon)
                            setDetecting(false)
                        },
                        () => {
                            setDetecting(false)
                            alert("Could not auto-detect GPS. Please drag the pin on the map or use the search bar.")
                        },
                        { enableHighAccuracy: false, timeout: 15000 }
                    )
                },
                { enableHighAccuracy: true, timeout: 8000 }
            )
        } else {
            setDetecting(false)
        }
    }

    return (
        <div className="space-y-3 bg-gray-50/80 p-4 rounded-3xl border border-gray-200">
            {/* Top Search & GPS Buttons */}
            <div className="flex flex-col sm:flex-row gap-2">
                {/* Locality Search Input */}
                <div className="grow flex items-center bg-white border border-gray-300 rounded-2xl px-3 py-1.5 shadow-2xs focus-within:ring-2 focus-within:ring-green-500">
                    <Search size={15} className="text-gray-400 mr-2 shrink-0" />
                    <input
                        type="text"
                        placeholder="Search colony, street, or landmark (e.g. Civil Lines, Prayagraj)..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                e.preventDefault()
                                handleSearchLocality()
                            }
                        }}
                        className="w-full text-xs text-gray-800 outline-none bg-transparent"
                    />
                    <button
                        type="button"
                        onClick={() => handleSearchLocality()}
                        disabled={searching}
                        className="ml-2 px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded-xl text-[11px] font-extrabold transition cursor-pointer shrink-0 disabled:bg-gray-300"
                    >
                        {searching ? "Searching..." : "Find"}
                    </button>
                </div>

                {/* 1-Click Detect Location Button */}
                <button
                    type="button"
                    onClick={handleDetectCurrentLocation}
                    disabled={detecting}
                    className="px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-2xl font-extrabold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer shrink-0 active:scale-95 disabled:opacity-60 shadow-2xs"
                >
                    <Crosshair size={15} className={`text-emerald-700 ${detecting ? "animate-spin" : ""}`} />
                    <span>{detecting ? "Detecting GPS..." : "📍 Use Current GPS"}</span>
                </button>
            </div>

            {/* Interactive Leaflet Map with Draggable Pin */}
            <div className="w-full h-64 rounded-2xl overflow-hidden border border-gray-200 shadow-inner relative z-0">
                <MapContainer
                    center={coords}
                    zoom={15}
                    scrollWheelZoom={true}
                    touchZoom={true}
                    className="w-full h-full"
                >
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />

                    <MapFlyTo position={coords} />
                    <MapClickHandler onLocationPick={handleCoordsChange} />

                    <Marker
                        draggable={true}
                        eventHandlers={markerEventHandlers}
                        position={coords}
                        ref={markerRef}
                        icon={locationPinIcon}
                    >
                        <Popup>
                            <b>📍 Delivery Location Pin</b><br />
                            <span className="text-[11px] text-gray-600">
                                Drag me or tap anywhere on the map!
                            </span>
                        </Popup>
                    </Marker>
                </MapContainer>

                {/* Floating Instruction Banner */}
                <div className="absolute bottom-2 left-2 right-2 bg-white/95 backdrop-blur-md rounded-xl p-2 z-[1000] flex items-center justify-between text-[11px] font-bold border border-gray-200 shadow-md">
                    <span className="text-gray-700 flex items-center gap-1 truncate max-w-[80%]">
                        <MapPin size={13} className="text-red-500 shrink-0" />
                        <span className="truncate">{detectedText || "Tap map or drag pin to your building"}</span>
                    </span>
                    <span className="text-green-700 text-[10px] font-extrabold shrink-0 bg-green-50 px-2 py-0.5 rounded-md border border-green-200">
                        Auto-Fills Form ✓
                    </span>
                </div>
            </div>
        </div>
    )
}
