import connectDb from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { auth } from "@/auth";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const SettingsSchema = new mongoose.Schema({
    key: { type: String, default: "store_payment", unique: true },
    upiId: { type: String, default: "store@paytm" },
    qrImage: { type: String, default: "" },
    failureAlerts: { type: Number, default: 0 },
    lastUpdated: { type: Date, default: Date.now }
});

const StoreSettings = mongoose.models.StoreSettings || mongoose.model("StoreSettings", SettingsSchema);

export async function GET() {
    try {
        await connectDb();
        let settings = await StoreSettings.findOne({ key: "store_payment" });
        if (!settings) {
            settings = await StoreSettings.create({
                key: "store_payment",
                upiId: "store@paytm",
                qrImage: ""
            });
        }
        return NextResponse.json(settings, { status: 200 });
    } catch (err: any) {
        return NextResponse.json({ message: err.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        await connectDb();
        const session = await auth();

        // Failure report handler
        const contentType = req.headers.get("content-type") || "";
        if (contentType.includes("application/json")) {
            const body = await req.json();
            if (body.action === "report_failure") {
                await StoreSettings.findOneAndUpdate(
                    { key: "store_payment" },
                    { $inc: { failureAlerts: 1 } },
                    { upsert: true }
                );
                return NextResponse.json({ success: true }, { status: 200 });
            }
        }

        if (!session || (session.user as any)?.role !== "admin") {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const formData = await req.formData();
        const upiId = formData.get("upiId") as string;
        const qrFile = formData.get("qrImage") as File | null;

        let qrImageUrl = "";

        // Direct Cloudinary upload
        if (qrFile && typeof qrFile !== "string" && qrFile.size > 0) {
            const buffer = Buffer.from(await qrFile.arrayBuffer());
            const uploadPromise = new Promise<string>((resolve, reject) => {
                cloudinary.uploader.upload_stream(
                    { folder: "snapcart_qr", resource_type: "image" },
                    (error, result) => {
                        if (error) reject(error);
                        else resolve(result?.secure_url || "");
                    }
                ).end(buffer);
            });
            qrImageUrl = await uploadPromise;
        }

        const updateData: any = {
            upiId: upiId || "store@paytm",
            failureAlerts: 0,
            lastUpdated: new Date()
        };

        if (qrImageUrl) {
            updateData.qrImage = qrImageUrl;
        }

        const updated = await StoreSettings.findOneAndUpdate(
            { key: "store_payment" },
            updateData,
            { upsert: true, new: true }
        );

        return NextResponse.json(updated, { status: 200 });
    } catch (err: any) {
        console.error("Payment settings error:", err);
        return NextResponse.json({ message: err.message }, { status: 500 });
    }
}