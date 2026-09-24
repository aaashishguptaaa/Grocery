# 🛒 Grocery — Modern 10-Minute Delivery Platform

[![Live Application](https://img.shields.io/badge/🚀%20Live%20Demo-grocery--beta--livid.vercel.app-16a34a?style=for-the-badge)](https://grocery-beta-livid.vercel.app)
[![WebSocket Server](https://img.shields.io/badge/⚡%20WebSocket%20Live-Render%20Cloud-46E3B7?style=for-the-badge&logo=render)](https://grocery-socket.onrender.com)
[![Next.js 16](https://img.shields.io/badge/Next.js%2016-000000?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB%20Atlas-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Google Gemini AI](https://img.shields.io/badge/Google%20Gemini%20AI-8E75B2?style=for-the-badge&logo=google&logoColor=white)](https://ai.google.dev/)
[![Razorpay](https://img.shields.io/badge/Razorpay-Payments-02042B?style=for-the-badge&logo=razorpay&logoColor=3395FF)](https://razorpay.com/)

> **Grocery** is an end-to-end, full-stack 10-minute delivery web application engineered with modern web technologies, real-time bi-directional WebSocket communication, AI-powered recipe intelligence, multi-role security, and an interactive admin sales analytics system.

---

## 🔗 Live Application Links

* 🌐 **Production Website**: [https://grocery-beta-livid.vercel.app](https://grocery-beta-livid.vercel.app)
* ⚡ **Production WebSocket Engine**: [https://grocery-socket.onrender.com](https://grocery-socket.onrender.com)

---

## 💡 What I Built

Grocery is divided into three comprehensive, interconnected portals:

### 1. 🛍️ Customer Experience Portal
* **Dynamic Product Catalog**: Real-time category browsing, keyword search, price calculations, and live stock-level indicators.
* **🤖 AI Recipe-to-Cart Engine**: Integrated with **Google Gemini AI**. Users can type any meal, craving, or recipe name, and the AI automatically analyzes the recipe, extracts the exact grocery items required, and enables adding all ingredients directly to the cart with one click.
* **💳 Complete Digital & COD Checkout**: Seamless payment processing powered by **Razorpay** (UPI, credit/debit cards, net banking) alongside a **Cash on Delivery (COD)** option.
* **📍 Live Order & GPS Driver Tracking**: Live map interface using Leaflet and WebSockets to track the assigned delivery partner's coordinates in real time from dispatch to delivery.
* **💬 Real-Time Customer Support**: Direct in-app live messaging between customer, delivery partner, and store support.

---

### 2. 🛵 Delivery Partner Logistics System
* **Live GPS Location Broadcasting**: Automatically transmits real-time latitude/longitude coordinates to the customer and store admin via Socket.IO.
* **Order Assignment & Workflow Management**: Dedicated partner dashboard to accept incoming deliveries, view delivery addresses, customer contact details, and navigate routes.
* **Secure Delivery OTP Verification**: One-Time-Password verification to ensure verified, tamper-proof delivery handoffs.
* **Partner Earnings & Performance**: Live metrics tracking completed orders, daily earnings, and tip totals.

---

### 3. 👑 Store Administration & Business Intelligence
* **📅 Delivered Products & Sales Calendar**: An interactive calendar dashboard displaying date-wise delivery counts, daily/weekly/monthly revenue totals, average order value, and complete delivered item logs with one-click **CSV export** and **print reports**.
* **📦 Inventory & Product Catalog Management**: Full CRUD capabilities to create new grocery items, edit details, toggle instant stock availability, and delete products, backed by Cloudinary image processing.
* **👥 Multi-Role Staff & User Control**: Secure role management allowing owners to assign and adjust permissions between **Admins**, **Delivery Partners**, and **Customers**.
* **📊 Real-Time Order Management**: Centralized order pipeline to inspect orders across all statuses (`pending`, `processing`, `out_for_delivery`, and `delivered`).

---

## 🛠️ Technologies & Tools Used

### 🎨 Frontend & User Interface
* **Next.js 16 (App Router)** — Modern React framework with Server Components and dynamic routing
* **React 19** — Latest component architecture and hooks
* **TypeScript** — Strictly typed codebase for high reliability and maintainability
* **Tailwind CSS** — Custom responsive design system with fluid layout styling
* **Framer Motion** — Smooth page transitions and micro-interactions
* **Lucide React** — Minimalist vector iconography

### ⚙️ Backend & APIs
* **Next.js Server Actions & API Routes** — High-performance serverless backend handlers
* **Node.js & Express** — Lightweight runtime powering the standalone real-time service
* **Socket.IO** — Ultra-low latency, bi-directional WebSocket communication for live GPS streaming and chat

### 🗄️ Database & Storage
* **MongoDB Atlas** — Scalable cloud NoSQL database
* **Mongoose ODM** — Schema modeling with data validation and indexing
* **Cloudinary** — Cloud storage, optimization, and CDN delivery for product imagery

### 🔐 Authentication & Security
* **NextAuth v5 (Auth.js)** — Modern authentication system
* **Google OAuth 2.0** — One-click social login
* **bcryptjs** — Salted password hashing
* **JWT & Role-Based Access Control (RBAC)** — Route protection for Customer, Delivery Partner, and Admin roles

### 💳 Integrations & Cloud Infrastructure
* **Google Gemini AI API** — GenAI recipe ingredient parsing and cart automation
* **Razorpay Payment Gateway** — Secure digital transaction handling
* **Vercel** — Automated CI/CD deployment and global CDN hosting for the web application
* **Render** — 24/7 cloud container hosting for the persistent Socket.IO WebSocket server
