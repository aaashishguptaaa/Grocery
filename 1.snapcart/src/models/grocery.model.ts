import mongoose from "mongoose";

export interface IGroceryReview {
    user: mongoose.Types.ObjectId;
    userName: string;
    stars: number;
    comment: string;
    createdAt?: Date;
}

export interface IGrocery {
    _id?: mongoose.Types.ObjectId;
    name: string;
    category: string;
    categories?: string[];
    price: string;
    mrp?: string;
    description?: string;
    inStock?: boolean;
    unit: string;
    image: string;
    images?: string[];
    rating?: {
        average: number;
        count: number;
    };
    reviews?: IGroceryReview[];
    createdAt?: Date;
    updatedAt?: Date;
}

const grocerySchema = new mongoose.Schema<IGrocery>({
    name: {
        type: String,
        required: true
    },
    category: {
        type: String,
        required: true
    },
    categories: {
        type: [String],
        default: []
    },
    price: {
        type: String,
        required: true
    },
    mrp: {
        type: String,
        default: ""
    },
    description: {
        type: String,
        default: ""
    },
    inStock: {
        type: Boolean,
        default: true
    },
    unit: {
        type: String,
        required: true
    },
    image: {
        type: String,
        required: true
    },
    images: {
        type: [String],
        default: []
    },
    rating: {
        average: {
            type: Number,
            default: 0
        },
        count: {
            type: Number,
            default: 0
        }
    },
    reviews: [
        {
            user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
            userName: String,
            stars: Number,
            comment: String,
            createdAt: { type: Date, default: Date.now }
        }
    ]
}, {
    timestamps: true
});

const Grocery = mongoose.models.Grocery || mongoose.model("Grocery", grocerySchema);
export default Grocery;