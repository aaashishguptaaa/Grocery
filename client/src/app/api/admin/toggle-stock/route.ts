import { auth } from "@/auth";
import connectDb from "@/lib/db";
import Grocery from "@/models/grocery.model";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    try {
        await connectDb();
        const session = await auth();
        if (session?.user?.role !== "admin") {
            return NextResponse.json({ message: "Unauthorized as admin" }, { status: 403 });
        }

        const { groceryId, inStock } = await req.json();
        if (!groceryId) {
            return NextResponse.json({ message: "Grocery ID is required" }, { status: 400 });
        }

        const updated = await Grocery.findByIdAndUpdate(
            groceryId,
            { inStock: Boolean(inStock) },
            { new: true }
        );

        if (!updated) {
            return NextResponse.json({ message: "Product not found" }, { status: 404 });
        }

        return NextResponse.json({
            message: `Product is now marked as ${inStock ? "In Stock" : "Out of Stock"}`,
            grocery: updated
        }, { status: 200 });
    } catch (error: any) {
        console.error("Toggle Stock Error:", error);
        return NextResponse.json({ message: error?.message || "Failed to update stock" }, { status: 500 });
    }
}
