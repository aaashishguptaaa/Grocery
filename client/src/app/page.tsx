import { auth } from '@/auth'
import AdminDashboard from '@/components/AdminDashboard'
import DeliveryBoy from '@/components/DeliveryBoy'
import EditRoleMobile from '@/components/EditRoleMobile'
import Footer from '@/components/Footer'
import GeoUpdater from '@/components/GeoUpdater'
import Nav from '@/components/Nav'
import UserDashboard from '@/components/UserDashboard'
import connectDb from '@/lib/db'
import Grocery, { IGrocery } from '@/models/grocery.model'
import SuspendedAccount from '@/components/SuspendedAccount'
import DeliveryPendingApproval from '@/components/DeliveryPendingApproval'
import User from '@/models/user.model'
import { redirect } from 'next/navigation'

async function Home(props: {
  searchParams: Promise<{
    q?: string
    category?: string
  }>
}) {
  const searchParams = await props.searchParams

  await connectDb()
  const session = await auth()

  let plainUser: any = { name: "Guest", role: "user" }
  let userRole = "user"

  if (session) {
    const userId = session?.user?.id || (session?.user as any)?._id
    if (userId) {
      const user = await User.findById(userId)
      if (user) {
        if (user.isBanned) {
          return <SuspendedAccount user={JSON.parse(JSON.stringify(user))} />
        }
        const inComplete = !user.mobile || !user.role || (!user.mobile && user.role === "user")
        if (inComplete) {
          return <EditRoleMobile />
        }
        plainUser = JSON.parse(JSON.stringify(user))
        userRole = user.role

        // Delivery partners must be verified and approved by admin
        if (userRole === "deliveryBoy" && !user.isApproved) {
          return <DeliveryPendingApproval user={plainUser} />
        }
      }
    }
  }

  let groceryList: IGrocery[] = []

  if (userRole === "user") {
    const filterQuery: any = {}
    const conditions: any[] = []

    if (searchParams?.q) {
      conditions.push({
        $or: [
          { name: { $regex: searchParams.q, $options: "i" } },
          { category: { $regex: searchParams.q, $options: "i" } },
          { categories: { $elemMatch: { $regex: searchParams.q, $options: "i" } } }
        ]
      })
    }

    if (searchParams?.category) {
      conditions.push({
        $or: [
          { category: searchParams.category },
          { categories: searchParams.category }
        ]
      })
    }

    if (conditions.length > 0) {
      filterQuery.$and = conditions
    }

    const rawGroceries = await Grocery.find(filterQuery).sort({ inStock: -1, createdAt: -1 })
    groceryList = JSON.parse(JSON.stringify(rawGroceries))
  }

  return (
    <>
      <Nav user={plainUser} />
      {plainUser?._id && <GeoUpdater userId={plainUser._id} />}
      {userRole === "user" ? (
        <UserDashboard
          groceryList={groceryList}
          activeCategory={searchParams?.category}
          searchQuery={searchParams?.q}
        />
      ) : userRole === "admin" ? (
        <AdminDashboard />
      ) : (
        <DeliveryBoy />
      )}
      <Footer />
    </>
  )
}

export default Home