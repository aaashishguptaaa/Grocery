'use client'

import React, { FormEvent, useState } from 'react'
import { motion } from 'motion/react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import axios from 'axios'
import { ArrowLeft, EyeIcon, EyeOff, Loader2 } from 'lucide-react'
import googleImage from '@/assets/google.png'
import BrandLogo from './BrandLogo'

interface RegisterFormProps {
    previousStep: (step: number) => void
}

export default function RegisterForm({ previousStep }: RegisterFormProps) {
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [loading, setLoading] = useState(false)
    const [errorMessage, setErrorMessage] = useState<string | null>(null)
    const router = useRouter()

    const handleRegister = async (e: FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setErrorMessage(null)

        try {
            await axios.post('/api/auth/register', {
                name,
                email,
                password,
            })
            // Auto login after successful register
            const loginResult = await signIn('credentials', {
                email,
                password,
                redirect: false,
            })
            if (loginResult?.error) {
                router.push('/login')
            } else {
                router.push('/')
                router.refresh()
            }
        } catch (error: any) {
            const msg = error?.response?.data?.message || 'Failed to create account. Please check your details.'
            setErrorMessage(msg)
            setLoading(false)
        }
    }

    const formValid = name.trim() !== '' && email.trim() !== '' && password.trim() !== ''

    return (
        <div className="w-full">
            {/* Top Back Button */}
            <div className="flex items-center mb-3 -mt-1">
                <button
                    type="button"
                    onClick={() => previousStep(1)}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-emerald-700 dark:text-slate-400 dark:hover:text-emerald-400 transition cursor-pointer"
                >
                    <ArrowLeft size={14} />
                    <span>Back</span>
                </button>
            </div>

            {/* Header */}
            <div className="text-center space-y-2 mb-6">
                <div className="flex items-center justify-center">
                    <BrandLogo size="md" lightText={false} showTagline={false} />
                </div>
                <h2 className="text-2xl sm:text-[26px] font-black text-slate-900 dark:text-white tracking-tight">
                    Create Account
                </h2>
            </div>

            {/* Error Notification */}
            {errorMessage && (
                <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-4 p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-xs font-semibold text-center flex items-center justify-center gap-2"
                >
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                    <span>{errorMessage}</span>
                </motion.div>
            )}

            {/* Form */}
            <form onSubmit={handleRegister} className="space-y-4">
                {/* Full Name */}
                <div className="space-y-1 text-left">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        Full Name
                    </label>
                    <input
                        type="text"
                        placeholder="Your Name"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full h-12 bg-slate-50/90 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/80 focus:bg-white focus:dark:bg-slate-800 rounded-2xl px-4 text-xs sm:text-sm font-semibold text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-4 focus:ring-emerald-500/15 focus:border-emerald-500 outline-none transition-all shadow-inner/5"
                    />
                </div>

                {/* Email Address */}
                <div className="space-y-1 text-left">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        Email
                    </label>
                    <input
                        type="email"
                        placeholder="name@example.com"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full h-12 bg-slate-50/90 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/80 focus:bg-white focus:dark:bg-slate-800 rounded-2xl px-4 text-xs sm:text-sm font-semibold text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-4 focus:ring-emerald-500/15 focus:border-emerald-500 outline-none transition-all shadow-inner/5"
                    />
                </div>

                {/* Password */}
                <div className="space-y-1 text-left">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        Password
                    </label>
                    <div className="relative">
                        <input
                            type={showPassword ? 'text' : 'password'}
                            placeholder="••••••••"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full h-12 bg-slate-50/90 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/80 focus:bg-white focus:dark:bg-slate-800 rounded-2xl pl-4 pr-11 text-xs sm:text-sm font-semibold text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-4 focus:ring-emerald-500/15 focus:border-emerald-500 outline-none transition-all shadow-inner/5"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3.5 top-3.5 p-0.5 text-slate-400 dark:text-slate-500 hover:text-slate-600 hover:dark:text-slate-300 transition cursor-pointer"
                            aria-label="Toggle password visibility"
                        >
                            {showPassword ? <EyeOff size={17} /> : <EyeIcon size={17} />}
                        </button>
                    </div>
                </div>

                {/* Submit Button */}
                <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={loading}
                    className={`w-full h-12 rounded-2xl font-black text-xs sm:text-sm transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer ${
                        formValid
                            ? 'bg-gradient-to-r from-emerald-600 via-green-600 to-emerald-500 hover:from-emerald-700 hover:to-green-700 text-white shadow-emerald-600/30'
                            : 'bg-emerald-600/80 hover:bg-emerald-600 text-white shadow-emerald-600/20'
                    }`}
                >
                    {loading ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Creating account...</span>
                        </>
                    ) : (
                        <span>Create Account</span>
                    )}
                </motion.button>
            </form>

            {/* Divider */}
            <div className="relative my-5">
                <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200/70 dark:border-slate-800" />
                </div>
                <div className="relative flex justify-center text-[10px]">
                    <span className="px-3 bg-white dark:bg-slate-900 text-slate-400 dark:text-slate-500 font-extrabold uppercase tracking-widest transition-colors">
                        or continue with
                    </span>
                </div>
            </div>

            {/* Google One-Tap */}
            <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                type="button"
                onClick={() => signIn('google', { callbackUrl: '/' })}
                className="w-full h-12 flex items-center justify-center gap-3 bg-white dark:bg-slate-800/90 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/80 rounded-2xl text-xs sm:text-sm font-extrabold text-slate-700 dark:text-slate-200 transition-all shadow-xs hover:shadow-sm cursor-pointer"
            >
                <Image src={googleImage} width={18} height={18} alt="Google" className="shrink-0" />
                <span>Continue with Google</span>
            </motion.button>

            {/* Footer switch to login */}
            <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800/80 text-center">
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    Already have an account?{' '}
                    <Link
                        href="/login"
                        className="font-black text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 hover:dark:text-emerald-300 transition hover:underline ml-0.5"
                    >
                        Sign In
                    </Link>
                </p>
            </div>
        </div>
    )
}
