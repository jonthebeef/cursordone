"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

function NextParamsContent() {
  const searchParams = useSearchParams();
  return searchParams.get("next");
}

export function useNextParam() {
  return (
    <Suspense fallback={null}>
      <NextParamsContent />
    </Suspense>
  );
}
