"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

function ErrorMessageContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const message = searchParams.get("message");

  return message || "There was a problem authenticating your account.";
}

export default function ErrorMessage() {
  return (
    <Suspense fallback="Loading error details...">
      <ErrorMessageContent />
    </Suspense>
  );
}
