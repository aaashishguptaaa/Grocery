import connectDb from "@/lib/db";
import User from "@/models/user.model";
import { NextResponse } from "next/server";
import { auth } from "@/auth";

export async function GET() {
    try {
        const [session] = await Promise.all([
            auth(),
            connectDb()
        ])
        if (!session || session?.user?.role !== "admin") {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
        }
        const users = await User.find({}).select("-password").sort({ createdAt: -1 }).lean()
        return NextResponse.json(users, { status: 200 })
    } catch (error) {
        return NextResponse.json({ message: `Error: ${error}` }, { status: 500 })
    }
}
