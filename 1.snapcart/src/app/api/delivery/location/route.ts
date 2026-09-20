import connectDb from "@/lib/db";
import User from "@/models/user.model";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

export async function POST(req: NextRequest) {
    try {
        await connectDb();
        const session = await auth();
        const userId = session?.user?.id || (session?.user as any)?._id;

        if (!userId) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { latitude, longitude } = body;

        if (typeof latitude !== "number" || typeof longitude !== "number") {
            return NextResponse.json({ message: "Invalid latitude or longitude" }, { status: 400 });
        }

        // Save GeoJSON [longitude, latitude]
        const updated = await User.findByIdAndUpdate(
            userId,
            {
                $set: {
                    "location.type": "Point",
                    "location.coordinates": [longitude, latitude],
                    lastActive: new Date()
                }
            },
            { new: true }
        ).select("name email location isOnline");

        return NextResponse.json({
            message: "Location updated successfully",
            location: { latitude, longitude }
        }, { status: 200 });
    } catch (err: any) {
        return NextResponse.json({ message: err.message }, { status: 500 });
    }
}
