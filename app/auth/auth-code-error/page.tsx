"use client";

import { Suspense } from "react";
import Link from "next/link";
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import ErrorMessage from "./error-message";

function AuthCodeErrorContent() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <h1 className="text-2xl font-bold text-center">
            Authentication Error
          </h1>
          <p className="text-zinc-400 text-center mt-2">
            <Suspense fallback="Loading error details...">
              <ErrorMessage />
            </Suspense>
          </p>
        </CardHeader>
        <CardContent>
          <div className="text-center text-zinc-400">
            <p className="mb-4">This could be due to:</p>
            <ul className="list-disc text-left pl-8 mb-4">
              <li>An expired or invalid authentication code</li>
              <li>A problem with the authentication provider</li>
              <li>A network connectivity issue</li>
            </ul>
            <p>Please try signing in again.</p>
          </div>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Link href="/auth/login">
            <Button>Return to Sign In</Button>
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}

export default function AuthCodeErrorPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AuthCodeErrorContent />
    </Suspense>
  );
}
