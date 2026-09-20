import connectDb from "@/lib/db";
import User from "@/models/user.model";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    try {
        await connectDb();
        const { searchParams } = new URL(req.url);
        const partnerId = searchParams.get("partnerId");

        if (!partnerId) {
            return NextResponse.json({ message: "Partner ID required" }, { status: 400 });
        }

        const partner = await User.findById(partnerId).select("name location isOnline lastActive");
        if (!partner || !partner.location?.coordinates || partner.location.coordinates.length < 2) {
            return NextResponse.json({ location: null }, { status: 200 });
        }

        const [lng, lat] = partner.location.coordinates;
        return NextResponse.json({
            latitude: lat,
            longitude: lng,
            isOnline: partner.isOnline,
            lastActive: partner.lastActive
        }, { status: 200 });
    } catch (e: any) {
        return NextResponse.json({ message: e.message }, { status: 500 });
    }
}
