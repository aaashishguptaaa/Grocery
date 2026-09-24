import { auth } from "@/auth";
import connectDb from "@/lib/db";
import User from "@/models/user.model";
import { redirect } from "next/navigation";
import SuspendedAccount from "@/components/SuspendedAccount";

export const dynamic = "force-dynamic";

export default async function AccountSuspendedPage() {
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

    // If user is not banned, send them back to home
    if (!user.isBanned) {
        redirect("/");
    }

    const plainUser = JSON.parse(JSON.stringify(user));

    return <SuspendedAccount user={plainUser} />;
}
