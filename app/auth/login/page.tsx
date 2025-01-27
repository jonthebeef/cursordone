"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
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

function LoginForm({
  onSubmit,
  onOAuthSignIn,
  error,
  loading,
}: {
  onSubmit: (email: string, password: string) => Promise<void>;
  onOAuthSignIn: (provider: "github" | "discord") => Promise<void>;
  error: string | null;
  loading: boolean;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onSubmit(email, password);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <Button
          type="button"
          variant="outline"
          className="w-full bg-[#24292e] hover:bg-[#2f363d] text-white border-[#24292e]"
          onClick={() => onOAuthSignIn("github")}
          disabled={loading}
        >
          <FaGithub className="mr-2 h-4 w-4" />
          {loading ? "Signing in..." : "GitHub"}
        </Button>
        <Button
          type="button"
          variant="outline"
          className="w-full bg-[#5865F2] hover:bg-[#4752C4] text-white border-[#5865F2]"
          onClick={() => onOAuthSignIn("discord")}
          disabled={loading}
        >
          <FaDiscord className="mr-2 h-4 w-4" />
          {loading ? "Signing in..." : "Discord"}
        </Button>
      </div>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <Separator className="w-full" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-zinc-400">
            Or continue with
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
            disabled={loading}
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
            autoComplete="current-password"
            disabled={loading}
          />
        </div>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Signing in..." : "Sign In"}
        </Button>
      </form>
    </div>
  );
}

function LoginContent() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Handle error messages from URL parameters
  useEffect(() => {
    const errorType = searchParams.get("error");
    const errorMessage = searchParams.get("message");

    if (errorType) {
      setError(errorMessage || "Authentication failed. Please try again.");
    }
  }, [searchParams]);

  const handleSubmit = async (email: string, password: string) => {
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      router.refresh();
      router.push("/");
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to sign in");
    } finally {
      setLoading(false);
    }
  };

  const handleOAuthSignIn = async (provider: "github" | "discord") => {
    try {
      setError(null);
      setLoading(true);

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          scopes: provider === "github" ? "repo gist" : "identify email",
        },
      });

      if (error) throw error;
    } catch (error) {
      console.error("OAuth error:", error);
      setError("Failed to sign in");
      setLoading(false);
    }
  };

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      <div className="absolute inset-0">
        <FlickeringGrid
          className="w-full h-full"
          squareSize={8}
          gridGap={8}
          color="rgb(255, 255, 255)"
          accentColor="#00FF00"
          accentChance={0.05}
          maxOpacity={0.4}
          flickerChance={0.2}
        />
      </div>
      <Card className="w-full max-w-md relative z-10 bg-black/80 backdrop-blur mx-4">
        <CardHeader>
          <h1 className="text-2xl font-bold">Sign In</h1>
          <p className="text-zinc-400 mt-2">
            Welcome back! Please sign in to continue.
          </p>
        </CardHeader>
        <CardContent>
          <LoginForm
            onSubmit={handleSubmit}
            onOAuthSignIn={handleOAuthSignIn}
            error={error}
            loading={loading}
          />
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <Link
            href="/auth/reset-password"
            className="text-sm text-zinc-400 hover:text-zinc-300"
          >
            Forgot your password?
          </Link>
          <div className="text-sm text-zinc-400">
            Don&apos;t have an account?{" "}
            <Link
              href="/auth/signup"
              className="text-blue-500 hover:text-blue-400"
            >
              Sign up
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <div className="fixed inset-0 w-screen h-screen overflow-hidden">
        <LoginContent />
      </div>
    </Suspense>
  );
}
