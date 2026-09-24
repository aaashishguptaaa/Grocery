import { auth } from "@/auth";
import connectDb from "@/lib/db";
import User from "@/models/user.model";
import { redirect } from "next/navigation";
import DeliveryPendingApproval from "@/components/DeliveryPendingApproval";

export const dynamic = "force-dynamic";

export default async function DeliveryApprovalPage() {
    await connectDb();
    const session = await auth();

    if (!session || !session.user) {
        redirect("/login");
    }

    const userId = session.user.id || (session.user as any)._id;
    let user = null;
    if (userId) {
        user = await User.findById(userId);
    } else if (session.user.email) {
        user = await User.findOne({ email: session.user.email });
    }

    if (!user) {
        redirect("/login");
    }

    // If user is already approved or not a delivery boy, redirect to home
    if (user.role !== "deliveryBoy" || user.isApproved) {
        redirect("/");
    }

    const plainUser = JSON.parse(JSON.stringify(user));

    return <DeliveryPendingApproval user={plainUser} />;
}
