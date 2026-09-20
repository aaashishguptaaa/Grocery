import connectDb from "@/lib/db";
import Order from "@/models/order.model";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import UserOrderCard from "@/components/UserOrderCard";
import Link from "next/link";
import { ArrowLeft, ShoppingBag } from "lucide-react";

export default async function MyOrdersPage() {
    await connectDb();
    const session = await auth();

    if (!session) {
        redirect("/login");
    }

    const userId = session.user?.id || (session.user as any)?._id;

    // Find orders by user id (checking both string and ObjectId formats)
    const orders = await Order.find({
        $or: [
            { user: userId },
            { user: (session.user as any)?._id },
            { user: session.user?.id }
        ].filter(Boolean)
    })
        .populate("user", "name email mobile")
        .populate("assignedDeliveryBoy", "name mobile isOnline")
        .sort({ createdAt: -1 })
        .lean();

    const plainOrders = JSON.parse(JSON.stringify(orders));

    // Stats
    const totalOrders = plainOrders.length;
    const totalSpent = plainOrders
        .filter((o: any) => o.status !== "cancelled")
        .reduce((sum: number, o: any) => sum + (o.totalAmount || 0), 0);

    return (
        <div className="pt-28 w-[92%] md:w-[85%] max-w-4xl mx-auto pb-24 space-y-6">
            {/* Top Back Navigation Bar */}
            <div className="flex items-center justify-between">
                <Link
                    href="/"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 rounded-2xl border border-gray-200 text-xs font-extrabold shadow-sm transition active:scale-95 cursor-pointer"
                >
                    <ArrowLeft size={16} className="text-green-600" />
                    <span>Back to Store</span>
                </Link>

                <h1 className="text-lg sm:text-xl font-black text-gray-800 flex items-center gap-2">
                    <ShoppingBag size={20} className="text-green-600" /> My Orders History
                </h1>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-green-50 rounded-2xl p-4 border border-green-100 flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-green-100 flex items-center justify-center text-green-700 text-xl font-black">
                        📦
                    </div>
                    <div>
                        <p className="text-[10px] font-bold uppercase text-gray-400">Total Orders</p>
                        <p className="text-xl font-black text-gray-800">{totalOrders} Orders</p>
                    </div>
                </div>

                <div className="bg-amber-50 rounded-2xl p-4 border border-amber-100 flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-700 text-xl font-black">
                        ₹
                    </div>
                    <div>
                        <p className="text-[10px] font-bold uppercase text-gray-400">Total Amount Spent</p>
                        <p className="text-xl font-black text-gray-800">₹{totalSpent}</p>
                    </div>
                </div>
            </div>

            {/* Orders List */}
            {plainOrders.length > 0 ? (
                <div className="space-y-6" suppressHydrationWarning>
                    {plainOrders.map((order: any) => (
                        <UserOrderCard key={order._id} order={order} />
                    ))}
                </div>
            ) : (
                <div className="bg-white rounded-3xl p-12 text-center border border-gray-100 shadow-sm space-y-2">
                    <p className="text-4xl">🛒</p>
                    <h3 className="text-base font-bold text-gray-700">No orders yet!</h3>
                    <p className="text-xs text-gray-400">Start shopping to see your orders here.</p>
                </div>
            )}
        </div>
    );
}