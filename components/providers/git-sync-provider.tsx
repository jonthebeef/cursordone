import React from "react";
import { GitSyncProvider as GitSyncContextProvider } from "@/lib/contexts/GitSyncContext";

export function GitSyncProvider({ children }: { children: React.ReactNode }) {
  // On client side, this component will initialize the GitSyncManager
  // On server side, it simply passes children through
  return <GitSyncContextProvider>{children}</GitSyncContextProvider>;
}
