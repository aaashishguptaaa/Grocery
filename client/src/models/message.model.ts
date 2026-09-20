import mongoose from "mongoose";

export interface IMessage {
    _id?: any;
    roomId: string;
    text: string;
    senderId?: any;
    senderName?: string;
    senderRole?: "user" | "deliveryBoy" | "admin" | string;
    time: string;
    isRead?: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}

const messageSchema = new mongoose.Schema<IMessage>({
    roomId: {
        type: String,
        required: true,
        index: true
    },
    text: {
        type: String,
        required: true
    },
    senderId: {
        type: mongoose.Schema.Types.Mixed,
        default: null
    },
    senderName: {
        type: String,
        default: "User"
    },
    senderRole: {
        type: String,
        enum: ["user", "deliveryBoy", "admin"],
        default: "user"
    },
    time: {
        type: String
    },
    isRead: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

// Avoid mongoose caching model with outdated schema in Next.js hot reload
if (mongoose.models && mongoose.models.Message) {
    delete (mongoose.models as any).Message;
}

const Message = mongoose.model<IMessage>("Message", messageSchema);
export default Message;