import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    items: [
        {
            name: String,
            price: Number,
            quantity: Number,
            image: String,
            unit: String,
            rating: {
                stars: { type: Number, min: 1, max: 5, default: null },
                review: { type: String, default: "" },
                ratedAt: { type: Date, default: null }
            }
        },
    ],
    totalAmount: {
        type: Number,
        required: true,
    },
    deliveryFee: {
        type: Number,
        default: 40,
    },
    status: {
        type: String,
        enum: ["pending", "assigned", "arrived_at_mart", "out of delivery", "delivered", "cancelled"],
        default: "pending",
    },
    riderArrivedAtMart: {
        type: Boolean,
        default: false,
    },
    riderArrivedAt: {
        type: Date,
        default: null,
    },
    handoverConfirmed: {
        type: Boolean,
        default: false,
    },
    handoverConfirmedAt: {
        type: Date,
        default: null,
    },
    paymentMethod: {
        type: String,
        enum: ["cod", "online"],
        default: "cod",
    },
    isPaid: {
        type: Boolean,
        default: false,
    },
    address: {
        fullName: String,
        mobile: String,
        pincode: String,
        city: String,
        state: String,
        fullAddress: String,
        latitude: Number,
        longitude: Number,
    },
    assignedDeliveryBoy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
    },
    deliveryOtp: {
        type: String,
        default: null,
    },
    deliveredAt: {
        type: Date,
        default: null,
    },
    deliveryRating: {
        rating: { type: Number, min: 1, max: 5, default: null },
        feedback: { type: String, default: "" },
        ratedAt: { type: Date, default: null }
    }
}, { timestamps: true });

const Order = mongoose.models.Order || mongoose.model("Order", orderSchema);
export default Order;