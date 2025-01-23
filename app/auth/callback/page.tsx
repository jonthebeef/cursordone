"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { handleAuthCallback } from "../actions";

export default function AuthCallbackPage() {
  const searchParams = useSearchParams();
  const code = searchParams.get("code");

  useEffect(() => {
    if (code) {
      handleAuthCallback(code);
    }
  }, [code]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Completing sign in...</h1>
        <p className="text-zinc-400">Please wait while we authenticate you.</p>
      </div>
    </div>
  );
}
