# 🛒 Snapcart - Full-Stack 10-Minute Grocery Delivery Platform

[![Vercel Deployment](https://img.shields.io/badge/Vercel-Live%20App-black?style=for-the-badge&logo=vercel)](https://grocery-beta-livid.vercel.app)
[![Render WebSocket](https://img.shields.io/badge/Render-Live%20Socket-46E3B7?style=for-the-badge&logo=render)](https://grocery-socket.onrender.com)
[![Next.js](https://img.shields.io/badge/Next.js%2016-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB%20Atlas-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

---

## 🌐 Live URLs

* 🚀 **Web Application**: [https://grocery-beta-livid.vercel.app](https://grocery-beta-livid.vercel.app)
* ⚡ **Realtime WebSocket Server**: [https://grocery-socket.onrender.com](https://grocery-socket.onrender.com)

---

## ✨ Features

### 🛍️ Customer Experience
* **Instant Category & Product Browsing**: Real-time stock status, search, and category filtering.
* **🤖 AI Recipe-to-Cart**: Powered by Google Gemini AI — enter any recipe name or craving, and instantly generate the ingredients list and add them directly to your cart with one click.
* **💳 Flexible Checkout**: Integrated with **Razorpay** payment gateway for instant digital payments as well as Cash on Delivery (COD).
* **📍 Live Order & Delivery Tracking**: Interactive map powered by Leaflet and WebSockets to track delivery partners in real time from pickup to doorstep.
* **💬 Real-Time Customer Support Chat**: Live driver-to-customer and admin-to-customer messaging powered by Socket.IO.

### 🛵 Delivery Partner Portal
* **Live GPS Location Broadcasting**: Automatically sends live coordinate updates to the customer and admin map.
* **Order Assignment & Acceptance**: Seamlessly accept assignments and update delivery milestones.
* **Delivery Verification**: OTP verification system on delivery completion.
* **Earnings & Performance Dashboard**: Track completed trips, delivery tips, and daily earnings.

### 👑 Store Administration & Analytics
* **📅 Delivered Products & Sales Calendar**: Interactive date-by-date calendar dashboard displaying daily, weekly, and monthly sales volume, revenue breakdown, and delivered product logs with print/CSV export.
* **📦 Product Catalog Management**: Add, edit, toggle stock, or delete grocery products with image hosting on Cloudinary.
* **👥 Multi-Role Staff & User Management**: Promote or manage store roles across Admins, Delivery Partners, and Customers.
* **📊 Live Order Pipeline**: Monitor orders through `pending`, `processing`, `out_for_delivery`, and `delivered`.

---

## 🛠️ Architecture & Tech Stack

```
Grocery/
├── client/          # Next.js 16 App Router (Frontend + API Routes)
│   ├── src/
│   │   ├── app/     # App Router pages and REST API handlers
│   │   ├── components/ # Reusable UI components & Dashboards
│   │   ├── lib/     # MongoDB connection & shared utilities
│   │   ├── models/  # Mongoose Data Models
│   │   └── auth.ts  # NextAuth v5 (Auth.js) configuration
│   └── package.json
└── socketServer/    # Standalone Node.js WebSocket Service
    ├── index.js     # Express + Socket.IO server
    └── package.json
```

* **Frontend**: Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS, Framer Motion, Lucide Icons
* **Authentication**: NextAuth v5 (Google OAuth + Credentials), JWT Session handling
* **Database**: MongoDB Atlas via Mongoose
* **Real-time Engine**: Socket.IO (WebSocket)
* **Cloud & Media**: Cloudinary (Image storage)
* **Payment Processing**: Razorpay Gateway
* **AI Engine**: Google Gemini API
* **Deployment**: Vercel (Next.js client) & Render (Socket server)

---

## 🚀 Local Development Setup

### 1. Clone the repository
```bash
git clone https://github.com/aaashishguptaaa/Grocery.git
cd Grocery
```

### 2. Configure Environment Variables
Inside `client/`, create a `.env.local` file:
```env
MONGODB_URL="your-mongodb-atlas-connection-string"
AUTH_SECRET="your-nextauth-secret"
AUTH_URL="http://localhost:3000"
GOOGLE_CLIENT_ID="your-google-oauth-client-id"
GOOGLE_CLIENT_SECRET="your-google-oauth-client-secret"
CLOUDINARY_CLOUD_NAME="your-cloudinary-name"
CLOUDINARY_API_KEY="your-cloudinary-api-key"
CLOUDINARY_API_SECRET="your-cloudinary-api-secret"
RAZORPAY_KEY_ID="your-razorpay-key-id"
RAZORPAY_KEY_SECRET="your-razorpay-key-secret"
NEXT_PUBLIC_SOCKET_SERVER="http://localhost:4000"
GEMINI_API_KEY="your-gemini-api-key"
```

Inside `socketServer/`, create a `.env` file:
```env
PORT=4000
NEXT_BASE_URL="http://localhost:3000"
```

### 3. Run the Next.js Client
```bash
cd client
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Run the Socket Server (in a separate terminal)
```bash
cd socketServer
npm install
npm start
```

---

## 📜 License
This project is open source and available under the [ISC License](LICENSE).
