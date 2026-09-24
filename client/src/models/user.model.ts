import mongoose from "mongoose";

export interface IUser {
    _id?: mongoose.Types.ObjectId;
    name: string;
    email: string;
    password?: string;
    mobile?: string;
    role: "user" | "deliveryBoy" | "admin";
    image?: string;
    location?: {
        type: {
            type: StringConstructor;
            enum: string[];
            default: string;
        };
        coordinates: {
            type: NumberConstructor[];
            default: number[];
        };
    };
    socketId: string | null;
    isOnline: boolean;
    rating?: {
        average: number;
        count: number;
    };
    // Delivery partner specific
    vehicleType?: string;
    vehicleNumber?: string;
    emergencyContact?: string;
    // Customer specific
    defaultAddress?: {
        fullName?: string;
        mobile?: string;
        pincode?: string;
        city?: string;
        state?: string;
        fullAddress?: string;
    };
    // Admin specific
    storeDetails?: {
        storeName?: string;
        storePhone?: string;
        storeAddress?: string;
    };
    // Ban & restriction status
    isBanned?: boolean;
    banReason?: string;
    bannedAt?: Date;
    // Verification & approval status (for delivery partners)
    isApproved?: boolean;
    deliveryApprovalStatus?: "pending" | "approved" | "rejected";
    approvalRequestedAt?: Date;
    approvedAt?: Date;
}

const userSchema = new mongoose.Schema<IUser>({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        unique: true,
        required: true,
    },
    password: {
        type: String,
        required: false,
    },
    mobile: {
        type: String,
        required: false,
    },
    role: {
        type: String,
        enum: ["user", "deliveryBoy", "admin"],
        default: "user",
    },
    image: {
        type: String,
    },
    location: {
        type: {
            type: String,
            enum: ["Point"],
            default: "Point",
        },
        coordinates: {
            type: [Number],
            default: [0, 0],
        },
    },
    socketId: {
        type: String,
        default: null,
    },
    isOnline: {
        type: Boolean,
        default: false,
    },
    rating: {
        average: {
            type: Number,
            default: 5.0,
        },
        count: {
            type: Number,
            default: 0,
        },
    },
    vehicleType: {
        type: String,
        default: "Motorcycle",
    },
    vehicleNumber: {
        type: String,
        default: "",
    },
    emergencyContact: {
        type: String,
        default: "",
    },
    defaultAddress: {
        fullName: String,
        mobile: String,
        pincode: String,
        city: String,
        state: String,
        fullAddress: String,
        latitude: Number,
        longitude: Number,
    },
    storeDetails: {
        storeName: {
            type: String,
            default: "Grocery Central Mart",
        },
        storePhone: {
            type: String,
            default: "+91 9876543210",
        },
        storeAddress: {
            type: String,
            default: "Central Mart, Prayagraj, UP - 211001",
        },
        latitude: {
            type: Number,
            default: 25.4358,
        },
        longitude: {
            type: Number,
            default: 81.8463,
        },
    },
    isBanned: {
        type: Boolean,
        default: false,
    },
    banReason: {
        type: String,
        default: "",
    },
    bannedAt: {
        type: Date,
        default: null,
    },
    isApproved: {
        type: Boolean,
        default: false,
    },
    deliveryApprovalStatus: {
        type: String,
        enum: ["pending", "approved", "rejected"],
        default: "pending",
    },
    approvalRequestedAt: {
        type: Date,
        default: null,
    },
    approvedAt: {
        type: Date,
        default: null,
    },
}, { timestamps: true });

userSchema.index({ location: "2dsphere" });
userSchema.index({ role: 1, isApproved: 1, isBanned: 1 });
userSchema.index({ role: 1, isOnline: -1 });

const User = mongoose.models.User || mongoose.model("User", userSchema);
export default User;
