"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createBrowserClient } from "@supabase/ssr";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert } from "@/components/ui/alert";
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { FaGithub, FaDiscord } from "react-icons/fa";
import { FlickeringGrid } from "@/components/ui/flickering-grid";

// Separate component for error handling that uses useSearchParams
function ErrorHandlerContent({
  setError,
}: {
  setError: (error: string | null) => void;
}) {
  const searchParams = useSearchParams();

  useEffect(() => {
    const error = searchParams.get("error");
    const errorMessage = searchParams.get("message");
    if (error === "auth_failed") {
      setError(errorMessage || "Authentication failed. Please try again.");
    }
  }, [searchParams, setError]);

  return null;
}

function ErrorHandler({
  setError,
}: {
  setError: (error: string | null) => void;
}) {
  return (
    <Suspense fallback={null}>
      <ErrorHandlerContent setError={setError} />
    </Suspense>
  );
}

function SignUpForm({
  onSubmit,
  onOAuthSignIn,
  error,
  loading,
}: {
  onSubmit: (
    email: string,
    password: string,
    confirmPassword: string,
    acceptTerms: boolean,
  ) => Promise<void>;
  onOAuthSignIn: (provider: "github" | "discord") => Promise<void>;
  error: string | null;
  loading: boolean;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onSubmit(email, password, confirmPassword, acceptTerms);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <Button
          type="button"
          variant="outline"
          className="w-full bg-[#24292e] hover:bg-[#2f363d] text-white border-[#24292e]"
          onClick={() => onOAuthSignIn("github")}
        >
          <FaGithub className="mr-2 h-4 w-4" />
          GitHub
        </Button>
        <Button
          type="button"
          variant="outline"
          className="w-full bg-[#5865F2] hover:bg-[#4752C4] text-white border-[#5865F2]"
          onClick={() => onOAuthSignIn("discord")}
        >
          <FaDiscord className="mr-2 h-4 w-4" />
          Discord
        </Button>
      </div>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <Separator className="w-full" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-zinc-400">
            Or continue with email
          </span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <Alert variant="destructive">{error}</Alert>}
        <div className="space-y-2">
          <label htmlFor="email" className="block text-sm font-medium">
            Email
          </label>
          <Input
            id="email"
            name="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full"
            placeholder="you@example.com"
            autoComplete="email"
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="password" className="block text-sm font-medium">
            Password
          </label>
          <Input
            id="password"
            name="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full"
            placeholder="••••••••"
            autoComplete="new-password"
          />
        </div>
        <div className="space-y-2">
          <label
            htmlFor="confirmPassword"
            className="block text-sm font-medium"
          >
            Confirm Password
          </label>
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            className="w-full"
            placeholder="••••••••"
            autoComplete="new-password"
          />
        </div>
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="terms"
            checked={acceptTerms}
            onChange={(e) => setAcceptTerms(e.target.checked)}
            className="h-4 w-4 rounded border-zinc-700 bg-zinc-900 text-zinc-50"
          />
          <label htmlFor="terms" className="text-sm text-zinc-400">
            I accept the{" "}
            <Link href="/terms" className="text-blue-500 hover:text-blue-400">
              terms and conditions
            </Link>
          </label>
        </div>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Creating account..." : "Create Account"}
        </Button>
      </form>
    </div>
  );
}

function SignUpContent() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  const handleSubmit = async (
    email: string,
    password: string,
    confirmPassword: string,
    acceptTerms: boolean,
  ) => {
    setLoading(true);
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    if (!acceptTerms) {
      setError("You must accept the terms and conditions");
      setLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
        },
      });

      if (error) {
        throw error;
      }

      router.push("/auth/verify-email");
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to sign up");
    } finally {
      setLoading(false);
    }
  };

  const handleOAuthSignIn = async (provider: "github" | "discord") => {
    try {
      setError(null);
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw error;
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : `Failed to sign in with ${provider}`,
      );
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 bg-transparent">
      <ErrorHandler setError={setError} />
      <div className="absolute inset-0 bg-black">
        <FlickeringGrid
          className="w-full h-full"
          squareSize={8}
          gridGap={8}
          color="rgb(255, 255, 255)"
          maxOpacity={0.4}
          flickerChance={0.2}
        />
      </div>
      <Card className="w-full max-w-md relative z-10 bg-black/80 backdrop-blur">
        <CardHeader>
          <h1 className="text-2xl font-bold">Create Account</h1>
          <p className="text-zinc-400 mt-2">
            Sign up to get started with our app.
          </p>
        </CardHeader>
        <CardContent>
          <SignUpForm
            onSubmit={handleSubmit}
            onOAuthSignIn={handleOAuthSignIn}
            error={error}
            loading={loading}
          />
        </CardContent>
        <CardFooter>
          <p className="text-sm text-zinc-400 text-center w-full">
            Already have an account?{" "}
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
  );
}

export default function SignUpPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SignUpContent />
    </Suspense>
  );
}
