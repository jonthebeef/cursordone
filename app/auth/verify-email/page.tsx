"use client";

import { Suspense } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import ErrorMessage from "./error-message";

function VerifyEmailContent() {
  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <h1 className="text-2xl font-bold text-center">Check your email</h1>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-center text-muted-foreground">
          We&apos;ve sent you a verification link. If you don&apos;t see it,
          check your spam folder.
        </p>
        <p className="text-center text-sm text-muted-foreground">
          The link will expire in 24 hours.
        </p>
        <Suspense
          fallback={
            <p className="text-center text-sm">Loading error details...</p>
          }
        >
          <ErrorMessage />
        </Suspense>
      </CardContent>
      <CardFooter>
        <Button asChild className="w-full">
          <Link href="/auth/login">Back to sign in</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <VerifyEmailContent />
    </Suspense>
  );
}
