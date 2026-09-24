import express from "express"
import http from "http"
import dotenv from "dotenv"
import { Server } from "socket.io"
import axios from "axios"

dotenv.config()
const app = express()
app.use(express.json())

// Health check endpoint
app.get("/", (req, res) => {
    res.json({ status: "ok", message: "Snapcart Socket Server is running" })
})

const server = http.createServer(app)
const port = process.env.PORT || 4000

const allowedOrigins = [
    "http://localhost:3000",
    "https://grocery-beta-livid.vercel.app",
    process.env.NEXT_BASE_URL
].filter(Boolean)

const io = new Server(server, {
    cors: {
        origin: (origin, callback) => {
            if (!origin) return callback(null, true)
            if (allowedOrigins.includes(origin) || origin.endsWith(".vercel.app")) {
                return callback(null, true)
            }
            return callback(null, true)
        },
        methods: ["GET", "POST"]
    }
})

io.on("connection", (socket) => {
    console.log("⚡ Client connected:", socket.id)

    socket.on("identity", async (userId) => {
        if (!userId) return
        try {
            await axios.post(`${process.env.NEXT_BASE_URL}/api/socket/connect`, {
                userId,
                socketId: socket.id
            })
            console.log(`👤 User ${userId} linked to socket ${socket.id}`)
        } catch (error) {
            console.log("Socket connect error (handled):", error.message)
        }
    })

    socket.on("update-location", async ({ userId, latitude, longitude }) => {
        if (!userId || !latitude || !longitude) return
        const location = {
            type: "Point",
            coordinates: [longitude, latitude]
        }
        try {
            await axios.post(`${process.env.NEXT_BASE_URL}/api/socket/update-location`, {
                userId,
                location
            })
        } catch (error) {
            // Safe fallback
        }
        io.emit("update-deliveryBoy-location", { userId, location })
    })

    socket.on("join-room", (roomId) => {
        console.log("🚪 Joining room:", roomId)
        socket.join(roomId)
    })

    socket.on("send-message", async (message) => {
        if (!message) return
        try {
            await axios.post(`${process.env.NEXT_BASE_URL}/api/chat/save`, message)
        } catch (error) {
            console.log("Chat save error (handled):", error.message)
        }
        // Chaining .to() in Socket.IO ensures sockets in multiple rooms receive the packet ONLY ONCE!
        const rooms = [message.roomId]
        let orderId = null
        if (message.roomId && message.roomId.startsWith("order_")) {
            orderId = message.roomId.replace("order_", "")
            rooms.push(orderId)
        } else if (message.roomId && !message.roomId.startsWith("store_")) {
            orderId = message.roomId
            rooms.push(`order_${orderId}`)
        }

        const uniqueRooms = Array.from(new Set(rooms)).filter(Boolean)
        let emitter = io
        uniqueRooms.forEach(r => { emitter = emitter.to(r) })
        emitter.emit("send-message", message)

        if (message.roomId && message.roomId.startsWith("store_")) {
            io.emit("admin-store-message", message)
        }
    })

    socket.on("disconnect", () => {
        console.log("❌ User disconnected:", socket.id)
    })
})

app.post("/notify", (req, res) => {
    const { event, data, socketId } = req.body
    console.log(`📢 Broadcasting event: ${event}`)
    if (socketId) {
        io.to(socketId).emit(event, data)
    } else {
        io.emit(event, data)
    }
    return res.status(200).json({ "success": true })
})

server.listen(port, () => {
    console.log("🚀 Socket server started and healthy at port", port)
})