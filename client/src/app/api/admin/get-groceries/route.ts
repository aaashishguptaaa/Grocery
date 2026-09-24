import connectDb from "@/lib/db";
import Grocery from "@/models/grocery.model";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
   try {
    await connectDb()
    const groceries = await Grocery.find({}).lean()
    return NextResponse.json(groceries,{status:200})
   } catch (error) {
     return NextResponse.json({message:`get groceries error ${error}`},{status:200})
   } 
}