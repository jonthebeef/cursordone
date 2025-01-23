"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

function ErrorMessageContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const message = searchParams.get("message");

  if (!error && !message) return null;

  return (
    <p className="text-red-500 text-center mt-2">
      {message || "An error occurred during email verification."}
    </p>
  );
}

export default function ErrorMessage() {
  return (
    <Suspense fallback={null}>
      <ErrorMessageContent />
    </Suspense>
  );
}
