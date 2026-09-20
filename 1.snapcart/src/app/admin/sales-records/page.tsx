import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import React from 'react'
import AdminSalesCalendar from '@/components/AdminSalesCalendar'

export const dynamic = 'force-dynamic'

export const metadata = {
    title: 'Sales & Delivery Records Calendar | Snapcart Admin',
    description: 'Track delivered orders, product delivery timestamps, and daily/weekly/monthly sales metrics.'
}

export default async function SalesRecordsPage() {
    const session = await auth()

    if (!session || (session.user as any)?.role !== 'admin') {
        redirect('/login')
    }

    return <AdminSalesCalendar />
}
