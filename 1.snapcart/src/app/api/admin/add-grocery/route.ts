import { auth } from "@/auth";
import uploadOnCloudinary from "@/lib/cloudinary";
import connectDb from "@/lib/db";
import Grocery from "@/models/grocery.model";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    try {
        await connectDb();
        const session = await auth();
        if (session?.user?.role !== "admin") {
            return NextResponse.json(
                { message: "You are not authorized as admin" },
                { status: 403 }
            );
        }

        const formData = await req.formData();
        const name = formData.get("name") as string;
        const categoriesField = formData.getAll("categories") as string[];
        let categoriesList: string[] = categoriesField.filter(Boolean);
        if (categoriesList.length === 0) {
            const catSingle = formData.get("category") as string;
            if (catSingle) categoriesList.push(catSingle);
        }
        const primaryCategory = categoriesList[0] || (formData.get("category") as string) || "General";

        const unit = formData.get("unit") as string;
        const price = formData.get("price") as string;
        const mrp = (formData.get("mrp") as string) || "";
        const description = (formData.get("description") as string) || "";

        // Collect all image files (supports multi-image 'images' or legacy single 'image')
        const files = formData.getAll("images") as Blob[];
        const singleFile = formData.get("image") as Blob | null;
        const allFilesToUpload: Blob[] = [...files];

        if (allFilesToUpload.length === 0 && singleFile && singleFile.size > 0) {
            allFilesToUpload.push(singleFile);
        }

        if (allFilesToUpload.length === 0) {
            return NextResponse.json(
                { message: "Please upload at least one product image." },
                { status: 400 }
            );
        }

        // Upload all images in parallel to Cloudinary
        const uploadPromises = allFilesToUpload.map(f => uploadOnCloudinary(f));
        const uploadResults = await Promise.all(uploadPromises);
        const validImageUrls = uploadResults.filter((url): url is string => Boolean(url));

        if (validImageUrls.length === 0) {
            return NextResponse.json(
                { message: "Failed to upload images. Please check Cloudinary configuration." },
                { status: 500 }
            );
        }

        const inStockField = formData.get("inStock");
        const inStock = inStockField === null || inStockField === "true";

        const primaryImage = validImageUrls[0];

        const grocery = await Grocery.create({
            name,
            price,
            mrp,
            description,
            category: primaryCategory,
            categories: categoriesList,
            unit,
            inStock,
            image: primaryImage,
            images: validImageUrls
        });

        return NextResponse.json(grocery, { status: 201 });
    } catch (error: any) {
        console.error("Add Grocery Error:", error);
        return NextResponse.json(
            { message: error?.message || "Failed to add grocery item" },
            { status: 500 }
        );
    }
}