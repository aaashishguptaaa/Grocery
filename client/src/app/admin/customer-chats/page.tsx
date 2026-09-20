import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import React from 'react'
import AdminChatCenter from '@/components/AdminChatCenter'

export const dynamic = 'force-dynamic'

export default async function CustomerChatsPage() {
    const session = await auth()

    if (!session || (session.user as any)?.role !== 'admin') {
        redirect('/login')
    }

    return <AdminChatCenter currentUser={session.user} />
}
