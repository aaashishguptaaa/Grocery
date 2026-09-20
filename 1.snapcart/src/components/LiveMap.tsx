'use client'

import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { MapContainer, Marker, Popup, Polyline, TileLayer, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

// Custom Leaflet Pins
const storeIcon = L.icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-gold.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
})

const customerIcon = L.icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
})

// Pulsing Green Delivery Partner Marker
const bikeIcon = L.divIcon({
    className: 'custom-bike-live-pin',
    html: `
        <div style="position: relative; width: 38px; height: 38px; display: flex; align-items: center; justify-content: center;">
            <div style="position: absolute; width: 38px; height: 38px; background-color: rgba(22, 163, 74, 0.4); border-radius: 50%; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
            <div style="width: 28px; height: 28px; background-color: #16a34a; border: 3px solid white; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.3); font-size: 14px;">
                🛵
            </div>
        </div>
    `,
    iconSize: [38, 38],
    iconAnchor: [19, 19],
    popupAnchor: [0, -20]
})

// Haversine distance calculator in KM
function getDistanceKm(coord1: [number, number], coord2: [number, number]): number {
    const R = 6371
    const dLat = (coord2[0] - coord1[0]) * Math.PI / 180
    const dLon = (coord2[1] - coord1[1]) * Math.PI / 180
    const a = 
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(coord1[0] * Math.PI / 180) * Math.cos(coord2[0] * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return Math.round(R * c * 10) / 10
}

function FitBounds({ positions }: { positions: [number, number][] }) {
    const map = useMap()
    useEffect(() => {
        if (positions && positions.length > 1) {
            const bounds = L.latLngBounds(positions)
            map.fitBounds(bounds, { padding: [40, 40] })
        }
    }, [positions, map])
    return null
}

export default function LiveMap({
    storePos = [25.4358, 81.8463],
    customerPos = [25.4730, 81.8630],
    riderName = "Delivery Partner",
    partnerId,
    showDistance = true,
    userLocation,
    deliveryBoyLocation
}: {
    storePos?: [number, number],
    customerPos?: [number, number],
    riderName?: string,
    partnerId?: string,
    showDistance?: boolean,
    userLocation?: { latitude: number; longitude: number },
    deliveryBoyLocation?: { latitude: number; longitude: number }
}) {
    const effectiveCustomerPos: [number, number] = (userLocation?.latitude && userLocation?.longitude)
        ? [userLocation.latitude, userLocation.longitude]
        : customerPos

    // Rider initial position (between store and customer)
    const [riderPos, setRiderPos] = useState<[number, number]>(() => {
        if (deliveryBoyLocation?.latitude && deliveryBoyLocation?.longitude) {
            return [deliveryBoyLocation.latitude, deliveryBoyLocation.longitude]
        }
        return [
            storePos[0] + (effectiveCustomerPos[0] - storePos[0]) * 0.4,
            storePos[1] + (effectiveCustomerPos[1] - storePos[1]) * 0.4
        ]
    })

    useEffect(() => {
        if (deliveryBoyLocation?.latitude && deliveryBoyLocation?.longitude) {
            setRiderPos([deliveryBoyLocation.latitude, deliveryBoyLocation.longitude])
        }
    }, [deliveryBoyLocation])

    // Fetch and poll the delivery partner's live moving location every 4 seconds
    useEffect(() => {
        if (!partnerId) return

        const fetchPartnerLocation = async () => {
            try {
                const res = await axios.get(`/api/delivery/partner-location?partnerId=${partnerId}`)
                if (res.data?.latitude && res.data?.longitude) {
                    setRiderPos([res.data.latitude, res.data.longitude])
                }
            } catch (e) {
                // silent
            }
        }

        fetchPartnerLocation()
        const interval = setInterval(fetchPartnerLocation, 4000)
        return () => clearInterval(interval)
    }, [partnerId])

    const distFromStore = getDistanceKm(storePos, riderPos)
    const distToCustomer = getDistanceKm(riderPos, effectiveCustomerPos)

    return (
        <div className="w-full h-64 rounded-2xl overflow-hidden border border-gray-200 shadow-inner relative z-0">
            <MapContainer
                center={storePos}
                zoom={14}
                scrollWheelZoom={true}
                touchZoom={true}
                doubleClickZoom={true}
                zoomControl={true}
                className="w-full h-full"
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                <FitBounds positions={[storePos, riderPos, effectiveCustomerPos]} />

                {/* Connecting Route: Store -> Rider -> Customer */}
                <Polyline positions={[storePos, riderPos]} color="#f59e0b" weight={3} dashArray="4, 6" />
                <Polyline positions={[riderPos, effectiveCustomerPos]} color="#16a34a" weight={4} dashArray="6, 8" />

                {/* 1. Store Marker */}
                <Marker position={storePos} icon={storeIcon}>
                    <Popup>
                        <b>🏪 Snapcart Mart</b><br />
                        Grocery Pickup Point
                    </Popup>
                </Marker>

                {/* 2. Delivery Partner Marker (Pulsing Green) */}
                <Marker position={riderPos} icon={bikeIcon}>
                    <Popup>
                        <b>🛵 {riderName} (Moving Live)</b><br />
                        {distToCustomer} km to your doorstep
                    </Popup>
                </Marker>

                {/* 3. Customer Destination Marker */}
                <Marker position={effectiveCustomerPos} icon={customerIcon}>
                    <Popup>
                        <b>🏠 Customer Location</b><br />
                        Dropoff Address
                    </Popup>
                </Marker>
            </MapContainer>

            {/* Distance Badges Overlay */}
            {showDistance && (
                <div className="absolute bottom-2 left-2 right-2 bg-white/95 backdrop-blur-md rounded-xl p-2.5 z-[1000] flex flex-wrap justify-between items-center text-[11px] font-bold border border-gray-200 shadow-md gap-1">
                    <div className="flex items-center gap-1.5 text-amber-700">
                        <span>🏪 Store ➔ 🛵 Partner:</span>
                        <span className="bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-md font-black">{distFromStore} km</span>
                    </div>

                    <div className="flex items-center gap-1.5 text-green-700">
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                        <span>🛵 Partner ➔ 🏠 You:</span>
                        <span className="bg-green-50 border border-green-200 px-1.5 py-0.5 rounded-md font-black">{distToCustomer} km</span>
                    </div>
                </div>
            )}
        </div>
    )
}