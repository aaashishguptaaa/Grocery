import { auth } from "@/auth";
import connectDb from "@/lib/db";
import User from "@/models/user.model";

import { NextRequest, NextResponse } from "next/server";

export async function POST(req:NextRequest){
    try {
       await connectDb()
       const {role,mobile}=await req.json() 
       const session=await auth()
       
       const updateFields: any = { role, mobile };
       if (role === "deliveryBoy") {
           updateFields.isApproved = false;
           updateFields.deliveryApprovalStatus = "pending";
           updateFields.approvalRequestedAt = new Date();
           updateFields.isOnline = false;
       } else {
           updateFields.isApproved = true;
           updateFields.deliveryApprovalStatus = "approved";
       }

       const user=await User.findOneAndUpdate({email:session?.user?.email}, updateFields, {new:true})
       if(!user){
        return NextResponse.json(
            {message:"user not found"},
            {status:400}
        )
       }
       return NextResponse.json(
            user,
            {status:200}
        )
    } catch (error) {
         return NextResponse.json(
             {message:`edit role and mobile error ${error}`},
            {status:500}
        )
    }
}