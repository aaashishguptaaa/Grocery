import connectDb from "@/lib/db";
import User from "@/models/user.model";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

export async function POST(req: NextRequest) {
    try {
        const session = await auth()
        if (!session || session?.user?.role !== "admin") {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
        }
        await connectDb()
        const { userId, role } = await req.json()

        if (!["user", "deliveryBoy", "admin"].includes(role)) {
            return NextResponse.json({ message: "Invalid role" }, { status: 400 })
        }

        const updateFields: any = { role };
        if (role === "deliveryBoy") {
            updateFields.isApproved = true;
            updateFields.deliveryApprovalStatus = "approved";
            updateFields.approvedAt = new Date();
        } else {
            updateFields.isApproved = true;
            updateFields.deliveryApprovalStatus = "approved";
        }

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            updateFields,
            { new: true }
        ).select("-password")

        if (!updatedUser) {
            return NextResponse.json({ message: "User not found" }, { status: 404 })
        }

        return NextResponse.json(updatedUser, { status: 200 })
    } catch (error) {
        return NextResponse.json({ message: `Error: ${error}` }, { status: 500 })
    }
}
