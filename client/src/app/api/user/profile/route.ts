import { auth } from "@/auth";
import uploadOnCloudinary from "@/lib/cloudinary";
import connectDb from "@/lib/db";
import User from "@/models/user.model";
import Order from "@/models/order.model";
import Grocery from "@/models/grocery.model";
import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";

// GET Profile and Role-Specific Stats
export async function GET() {
    try {
        await connectDb();
        const session = await auth();
        const userId = session?.user?.id || (session?.user as any)?._id;

        if (!userId) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const user: any = await User.findById(userId).select("-password").lean();
        if (!user) {
            return NextResponse.json({ message: "User not found" }, { status: 404 });
        }

        // Gather role-specific stats
        let stats: any = {};

        if (user.role === "user") {
            const orders = await Order.find({ user: userId }).select("totalAmount status createdAt");
            const completedOrders = orders.filter(o => o.status !== "cancelled");
            stats = {
                totalOrders: orders.length,
                completedOrders: completedOrders.length,
                totalSpent: completedOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0),
                joinedAt: (user as any).createdAt || new Date()
            };
        } else if (user.role === "deliveryBoy") {
            const deliveredOrders = await Order.find({
                assignedDeliveryBoy: userId,
                status: "delivered"
            }).select("totalAmount updatedAt");

            stats = {
                completedDeliveries: deliveredOrders.length,
                totalEarnings: deliveredOrders.length * 40,
                rating: user.rating?.average || 5.0,
                reviewsCount: user.rating?.count || 0
            };
        } else if (user.role === "admin") {
            const [totalOrders, totalUsers, totalGroceries] = await Promise.all([
                Order.countDocuments(),
                User.countDocuments(),
                Grocery.countDocuments()
            ]);
            stats = {
                totalOrders,
                totalUsers,
                totalGroceries
            };
        }

        return NextResponse.json({ user, stats }, { status: 200 });
    } catch (error: any) {
        console.error("GET Profile Error:", error);
        return NextResponse.json({ message: error.message || "Failed to fetch profile" }, { status: 500 });
    }
}

// POST/PUT Update Profile Details & Image
export async function POST(req: NextRequest) {
    try {
        await connectDb();
        const session = await auth();
        const userId = session?.user?.id || (session?.user as any)?._id;

        if (!userId) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const user = await User.findById(userId);
        if (!user) {
            return NextResponse.json({ message: "User not found" }, { status: 404 });
        }

        const formData = await req.formData();
        const name = formData.get("name") as string | null;
        const email = formData.get("email") as string | null;
        const mobile = formData.get("mobile") as string | null;
        const imageFile = formData.get("image") as Blob | null;

        // Delivery boy specific fields
        const vehicleType = formData.get("vehicleType") as string | null;
        const vehicleNumber = formData.get("vehicleNumber") as string | null;
        const emergencyContact = formData.get("emergencyContact") as string | null;

        // Customer specific default address
        const addressJson = formData.get("defaultAddress") as string | null;

        // Admin specific store details
        const storeJson = formData.get("storeDetails") as string | null;

        // Password change
        const currentPassword = formData.get("currentPassword") as string | null;
        const newPassword = formData.get("newPassword") as string | null;

        // 1. Image upload
        if (imageFile && imageFile.size > 0) {
            const uploadedUrl = await uploadOnCloudinary(imageFile);
            if (uploadedUrl) {
                user.image = uploadedUrl;
            }
        }

        // 2. Name validation
        if (name && name.trim()) {
            user.name = name.trim();
        }

        // 3. Email uniqueness check
        if (email && email.trim().toLowerCase() !== user.email.toLowerCase()) {
            const existingEmail = await User.findOne({ 
                email: email.trim().toLowerCase(), 
                _id: { $ne: user._id } 
            });

            if (existingEmail) {
                return NextResponse.json({ message: "This email address is already in use by another account." }, { status: 400 });
            }
            user.email = email.trim().toLowerCase();
        }

        // 4. Mobile validation
        if (mobile && mobile.trim()) {
            const cleanedMobile = mobile.trim().replace(/\D/g, "");
            if (cleanedMobile.length < 10) {
                return NextResponse.json({ message: "Please provide a valid 10-digit mobile number." }, { status: 400 });
            }
            user.mobile = cleanedMobile;
        }

        // 5. Delivery partner fields
        if (vehicleType) user.vehicleType = vehicleType;
        if (vehicleNumber !== null) user.vehicleNumber = vehicleNumber.trim();
        if (emergencyContact !== null) user.emergencyContact = emergencyContact.trim();

        // 6. Default address for customer
        if (addressJson) {
            try {
                user.defaultAddress = JSON.parse(addressJson);
            } catch (e) {
                // ignore
            }
        }

        // 7. Store details for admin
        if (storeJson) {
            try {
                user.storeDetails = JSON.parse(storeJson);
            } catch (e) {
                // ignore
            }
        }

        // 8. Password change
        if (newPassword && newPassword.trim()) {
            if (newPassword.trim().length < 6) {
                return NextResponse.json({ message: "New password must be at least 6 characters long." }, { status: 400 });
            }

            if (user.password) {
                if (!currentPassword) {
                    return NextResponse.json({ message: "Current password is required to set a new password." }, { status: 400 });
                }
                const isMatch = await bcrypt.compare(currentPassword, user.password);
                if (!isMatch) {
                    return NextResponse.json({ message: "Current password does not match our records." }, { status: 400 });
                }
            }

            user.password = await bcrypt.hash(newPassword.trim(), 10);
        }

        await user.save();

        const updatedUser = await User.findById(user._id).select("-password").lean();

        return NextResponse.json({
            message: "Profile updated successfully!",
            user: updatedUser
        }, { status: 200 });
    } catch (error: any) {
        console.error("POST Profile Error:", error);
        return NextResponse.json({ message: error.message || "Failed to update profile" }, { status: 500 });
    }
}
