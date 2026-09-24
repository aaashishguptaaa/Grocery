'use client'
import dynamic from 'next/dynamic'
const LiveMap = dynamic(() => import('@/components/LiveMap'), { ssr: false, loading: () => <div className="w-full h-[500px] bg-gray-100 rounded-xl flex items-center justify-center text-gray-500">Loading Map...</div> })
import { getSocket } from '@/lib/socket'
import { IUser } from '@/models/user.model'
import { RootState } from '@/redux/store'
import axios from 'axios'
import { ArrowLeft, Loader, Send, Sparkle, Truck } from 'lucide-react'

import { useParams, useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import {AnimatePresence, motion} from "motion/react"
import React, { useEffect, useRef, useState } from 'react'
import { useSelector } from 'react-redux'
import { IMessage } from '@/models/message.model'
interface IOrder {
    _id?: string
    user: string
    items: [
        {
            grocery: string,
            name: string,
            price: string,
            unit: string,
            image: string
            quantity: number
        }
    ]
    ,
    isPaid: boolean
    totalAmount: number,
    paymentMethod: "cod" | "online"
    address: {
        fullName: string,
        mobile: string,
        city: string,
        state: string,
        pincode: string,
        fullAddress: string,
        latitude: number,
        longitude: number
    }
    assignment?: string
    assignedDeliveryBoy?: IUser
    status: string
    deliveryOtp?: string
    riderArrivedAtMart?: boolean
    handoverConfirmed?: boolean
    createdAt?: Date
    updatedAt?: Date
}
interface ILocation {
  latitude: number,
  longitude: number
}
function TrackOrder({params}:{params:{orderId:string}}) {
const {userData}=useSelector((state:RootState)=>state.user)
const {orderId}=useParams()
const [order,setOrder]=useState<IOrder>()
const router=useRouter()
const [newMessage,setNewMessage]=useState("")
const [messages,setMessages]=useState<IMessage[]>()
const chatBoxRef=useRef<HTMLDivElement>(null)
  const [loading,setLoading]=useState(false)
   const [suggestions, setSuggestions] = useState([])
const [userLocation, setUserLocation] = useState<ILocation>(
    {
      latitude: 0,
      longitude: 0
    }
  )
  const [deliveryBoyLocation, setDeliveryBoyLocation] = useState<ILocation>({
    latitude: 0,
    longitude: 0
  })
  const [showDoorstepPopup, setShowDoorstepPopup] = useState<boolean>(false)

useEffect(()=>{
const getOrder=async ()=>{
  try {
    const result=await axios.get(`/api/user/get-order/${orderId}`)
    setOrder(result.data)
    setUserLocation({
      latitude:result.data.address.latitude,
      longitude:result.data.address.longitude
    })
    setDeliveryBoyLocation({
      latitude:result.data.assignedDeliveryBoy.location.coordinates[1],
      longitude:result.data.assignedDeliveryBoy.location.coordinates[0]
    })
  } catch (error) {
    console.log(error)
  }
}
getOrder()
},[userData?._id])

useEffect(():any=>{
const socket=getSocket()
socket.on("update-deliveryBoy-location",(data)=>{
  console.log(location)
 setDeliveryBoyLocation({
  latitude: data.location.coordinates?.[1] ?? data.location.latitude,
        longitude: data.location.coordinates?.[0] ?? data.location.longitude,

 })
  }
)
return ()=>socket.off("update-deliveryBoy-location")
},[order])

 useEffect(() => {
    const socket = getSocket()
    socket.emit("join-room", orderId)
     socket.on("send-message",(message)=>{
      if(message.roomId===orderId){
 setMessages((prev)=>[...prev!,message])
      }
    })

    return ()=>{
      socket.off("send-message")
    }
  }, [])

  // 📡 Real-time status update listener
  useEffect(() => {
    const socket = getSocket()
    if (!socket) return

    const fetchOrder = () => {
        axios.get(`/api/user/get-order/${orderId}`).then((res) => {
          if (res.data) setOrder(res.data)
        }).catch(() => {})
    }

    const handleAssigned = (data: any) => {
      if (String(data?.orderId) === String(orderId)) {
        toast('🛵 A delivery partner has been assigned!', { icon: '🛵', duration: 5000 })
        fetchOrder()
      }
    }

    const handleArrived = (data: any) => {
      if (String(data?.orderId) === String(orderId)) {
        toast('📍 Partner has arrived at the mart!', { icon: '📍', duration: 5000 })
        fetchOrder()
      }
    }

    const handleDispatched = (data: any) => {
      if (String(data?.orderId) === String(orderId)) {
        toast.success('🚀 Your order is out for delivery!', { duration: 5000 })
        fetchOrder()
      }
    }

    const handleDoorstep = (data: any) => {
      if (String(data?.orderId) === String(orderId)) {
          setShowDoorstepPopup(true)
          toast('🔔 Your delivery partner is at your door! Share your OTP', {
              icon: '🔔',
              duration: 8000,
              style: { background: '#fefce8', border: '2px solid #eab308', color: '#854d0e', fontWeight: '700' }
          })
          fetchOrder()
      }
    }

    socket.on("order-assigned", handleAssigned)
    socket.on("rider-arrived-at-mart", handleArrived)
    socket.on("order-dispatched", handleDispatched)
    socket.on("rider-at-doorstep", handleDoorstep)

    return () => {
      socket.off("order-assigned", handleAssigned)
      socket.off("rider-arrived-at-mart", handleArrived)
      socket.off("order-dispatched", handleDispatched)
      socket.off("rider-at-doorstep", handleDoorstep)
    }
  }, [orderId])

  const sendMsg = () => {
    const socket = getSocket()

    const message = {
      roomId: orderId,
      text: newMessage,
      senderId: userData?._id,
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit"
      })
    }
    socket.emit("send-message", message)
   
    setNewMessage("")
  }
   useEffect(() => {
      const getAllMessages = async () => {
        try {
          const result = await axios.post("/api/chat/messages", { roomId: orderId })
          setMessages(result.data)
        } catch (error) {
          console.log(error)
        }
      }
      getAllMessages()
    }, [])

useEffect(()=>{
    chatBoxRef.current?.scrollTo({
      top:chatBoxRef.current.scrollHeight,
      behavior:"smooth"
    })
  },[messages])

  const getSuggestion=async ()=>{
    setLoading(true)
    try {
  
      const lastMessage=messages?.filter(m=>m.senderId.toString()!==userData?._id)?.at(-1)
      const result=await axios.post("/api/chat/ai-suggestions",{message:lastMessage?.text,role:"user"})
    setSuggestions(result.data)
    setLoading(false)
    } catch (error) {
      console.log(error)
      setLoading(false)
    }
  }
  
  return (
    <div className='w-full min-h-screen bg-linear-to-b from-green-50 to-white'>
      <div className='max-w-2xl mx-auto pb-24'>
            <div className='sticky top-0 bg-white/80 backdrop-blur-xl p-4 border-b shadow flex gap-3 items-center z-999'>
              <button className='p-2 bg-green-100 rounded-full' onClick={()=>router.back()}><ArrowLeft className="text-green-700" size={20} /></button>
              <div>
<h2 className='text-xl font-bold'>Track Order</h2>
<p className='text-sm text-gray-600'>order#{order?._id?.toString().slice(-6)} <span className='text-green-700 font-semibold'>{order?.status}</span></p>
              </div>
              
            </div>
            {/* 🚀 Real-Time Order Status Tracker */}
            <div className="px-4 mt-4">
              <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-md space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-gray-400">Order Journey</span>
                  <span className={`text-[11px] font-black uppercase px-3 py-1 rounded-full inline-flex items-center gap-1.5 ${
                    order?.status === 'delivered' ? 'bg-green-100 text-green-800' :
                    order?.status === 'out of delivery' ? 'bg-blue-100 text-blue-800' :
                    order?.status === 'arrived_at_mart' ? 'bg-amber-100 text-amber-900' :
                    order?.status === 'assigned' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-700'
                  }`}>
                    {order?.status === 'out of delivery' && (
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                      </span>
                    )}
                    {order?.status === 'arrived_at_mart' && (
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                      </span>
                    )}
                    {order?.status === 'delivered' ? '✓ Delivered' :
                     order?.status === 'out of delivery' ? '🚀 Out for Delivery' :
                     order?.status === 'arrived_at_mart' ? '📍 Partner at Mart (Handover)' :
                     order?.status === 'assigned' ? '🛵 Partner Heading to Mart' : '🏪 Packing at Mart'}
                  </span>
                </div>

                {/* Explanatory Message */}
                <p className="text-xs font-medium text-gray-600 bg-gray-50 p-3 rounded-2xl border border-gray-100">
                  {order?.status === 'delivered'
                    ? "🎉 Your order has been delivered to your doorstep. Thank you for shopping with Snapcart!"
                    : order?.status === 'out of delivery'
                    ? `🚀 Your order has been verified and handed over to ${order?.assignedDeliveryBoy?.name || "your delivery partner"}! They are on the way to your door.`
                    : order?.status === 'arrived_at_mart'
                    ? `📍 Partner ${order?.assignedDeliveryBoy?.name || ""} has arrived at Central Mart! Store staff is handing over your packed bag.`
                    : order?.status === 'assigned'
                    ? `🛵 Partner ${order?.assignedDeliveryBoy?.name || ""} is heading to Central Mart to collect your items.`
                    : "🏪 Mart staff is packing and sorting your fresh grocery items."}
                </p>

                {/* Delivery OTP Notice when out for delivery */}
                {order?.status === 'out of delivery' && order?.deliveryOtp && (
                  <div className="bg-gradient-to-r from-amber-50 to-green-50 border border-amber-300 p-3 rounded-2xl flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-black text-amber-900 block">Your Delivery OTP</span>
                      <span className="text-xs text-gray-600">Share with rider at doorstep</span>
                    </div>
                    <span className="text-xl font-black font-mono tracking-widest text-green-700 bg-white px-3 py-1 rounded-xl shadow-xs border border-green-200">
                      {order.deliveryOtp}
                    </span>
                  </div>
                )}
              </div>
            </div>

           <div className='px-4 mt-4 space-y-4'>
               <div className='rounded-3xl overflow-hidden border shadow'>
                   <LiveMap userLocation={userLocation} deliveryBoyLocation={deliveryBoyLocation}/>
               </div>

  <div className='bg-white rounded-3xl shadow-sm border border-gray-100 p-4 h-[340px] flex flex-col'>

    <div className='flex items-center justify-between pb-2.5 border-b border-gray-100 mb-2'>
      <div className='flex items-center gap-2'>
        <div className='w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs'>
          🛵
        </div>
        <div>
          <h4 className='font-bold text-xs sm:text-sm text-gray-800'>Chat with Delivery Partner</h4>
          <p className='text-[10px] text-gray-400'>Order live communication</p>
        </div>
      </div>
    </div>

      <div className='flex-1 overflow-y-auto p-2 space-y-3' ref={chatBoxRef}>
        <AnimatePresence>
          {messages?.map((msg, index) => (
            <motion.div
              key={msg._id?.toString()}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className={`flex ${msg.senderId.toString()==userData?._id?"justify-end":"justify-start"}`}
            >
              <div  className={`px-4 py-2 max-w-[75%] rounded-2xl shadow 
                  ${
                    msg.senderId.toString() === userData?._id
                      ? "bg-green-600 text-white rounded-br-none"
                      : "bg-gray-100 text-gray-800 rounded-bl-none"
                  }`}>
                <p >{msg.text}</p>
                <p className='text-[10px] opacity-70 mt-1 text-right'>{msg.time}</p>
              </div>

            </motion.div>
          ))}
        </AnimatePresence>
      </div>


      <div className='flex gap-2 mt-3 border-t pt-3'>
        <input type="text" placeholder='Type a Message...' className='flex-1 bg-gray-100 px-4 py-2 rounded-xl outline-none focus:ring-2 focus:ring-green-500' value={newMessage} onChange={(e) => setNewMessage(e.target.value)} />
        <button className='bg-green-600 hover:bg-green-700 p-3 rounded-xl text-white' onClick={sendMsg}><Send size={18} /></button>
      </div>

    </div>




           </div>
      </div>

      {/* 🔔 CUSTOMER DOORSTEP ARRIVAL POPUP MODAL */}
      <AnimatePresence>
        {showDoorstepPopup && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl space-y-4 border-2 border-red-500 text-left relative"
            >
              <div className="flex items-center justify-between border-b pb-3">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-3.5 w-3.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-red-600"></span>
                  </span>
                  <h3 className="font-black text-gray-900 text-base">
                    Rider Has Arrived at Your Door!
                  </h3>
                </div>
                <button
                  onClick={() => setShowDoorstepPopup(false)}
                  className="text-gray-400 hover:text-gray-600 p-1 cursor-pointer font-bold"
                >
                  ✕
                </button>
              </div>

              <div className="p-4 bg-rose-50 rounded-2xl border border-rose-200 text-xs text-rose-950 space-y-2">
                <p className="font-extrabold text-sm flex items-center gap-2">
                  <Truck size={18} className="text-rose-600" />
                  {order?.assignedDeliveryBoy?.name || "Your delivery partner"} is outside your door with your order!
                </p>
                <p className="text-gray-600">
                  Order #{order?._id?.toString().slice(-6).toUpperCase()} • Total: ₹{order?.totalAmount}
                </p>
              </div>

              {order?.deliveryOtp && (
                <div className="bg-amber-50 border-2 border-dashed border-amber-400 p-3.5 rounded-2xl text-center space-y-1">
                  <p className="text-[10px] font-black uppercase text-amber-900 tracking-wider">Share This OTP with Delivery Partner</p>
                  <p className="text-3xl font-black font-mono tracking-widest text-emerald-700">{order?.deliveryOtp}</p>
                </div>
              )}

              <button
                type="button"
                onClick={() => setShowDoorstepPopup(false)}
                className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs rounded-xl shadow transition cursor-pointer"
              >
                I am Receiving My Order ✓
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default TrackOrder
