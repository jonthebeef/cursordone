'use client'

import Link from 'next/link'
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card'

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <h1 className="text-2xl font-bold text-center">Check Your Email</h1>
          <p className="text-zinc-400 text-center mt-2">
            We've sent you a verification link. Please check your email to continue.
          </p>
        </CardHeader>
        <CardContent>
          <div className="text-center text-zinc-400">
            <p className="mb-4">
              Click the link in the email to verify your account. If you don't see it,
              check your spam folder.
            </p>
            <p>
              The link will expire in 24 hours.
            </p>
          </div>
        </CardContent>
        <CardFooter>
          <p className="text-sm text-zinc-400 text-center w-full">
            Return to{' '}
            <Link
              href="/auth/login"
              className="text-blue-500 hover:text-blue-400"
            >
              Sign in
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
} 