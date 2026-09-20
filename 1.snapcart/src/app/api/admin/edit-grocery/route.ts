import { auth } from "@/auth";
import uploadOnCloudinary from "@/lib/cloudinary";
import connectDb from "@/lib/db";
import Grocery from "@/models/grocery.model";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req:NextRequest) {
    try {
        await connectDb()
        const session=await auth()
        if(session?.user?.role!=="admin"){
            return NextResponse.json(
                {message:"you are not admin"},
                {status:400}
            )
        }
    const formData=await req.formData()
    const name=formData.get("name") as string
    const groceryId=formData.get("groceryId") as string
    const category=formData.get("category") as string
      const unit=formData.get("unit") as string
    const price=formData.get("price") as string
    const file=formData.get("image") as Blob | null
    let imageUrl
    if(file){
     imageUrl=await uploadOnCloudinary(file)
    }
    const categoriesField = formData.getAll("categories") as string[]
    let categoriesList: string[] = categoriesField.filter(Boolean)
    if (categoriesList.length === 0 && category) {
        categoriesList.push(category)
    }
    const primaryCategory = categoriesList[0] || category

    const inStockField = formData.get("inStock")
    const updateData: any = { name, price, category: primaryCategory, unit }
    if (categoriesList.length > 0) {
        updateData.categories = categoriesList
    }
    if (imageUrl) {
        updateData.image = imageUrl
    }
    if (inStockField !== null) {
        updateData.inStock = inStockField === "true"
    }

    const grocery = await Grocery.findByIdAndUpdate(groceryId, updateData, { new: true })
     return NextResponse.json(
                grocery,
                {status:200}
            )
    } catch (error) {
         return NextResponse.json(
                {message:`edit grocery error ${error}`},
                {status:500}
            )
    }
}


