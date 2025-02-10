"use client";

import { Button } from "@/components/ui/button";
import { User } from "lucide-react";
import Link from "next/link";

interface ProfileButtonProps {
  email?: string | null;
}

export function ProfileButton({ email }: ProfileButtonProps) {
  return (
    <Button
      variant="ghost"
      className="w-full justify-start gap-2 text-sm text-zinc-400 hover:text-zinc-100"
      asChild
    >
      <Link href={{ pathname: "/profile" }}>
        <User className="h-4 w-4" />
        <span className="truncate">{email || "Profile"}</span>
      </Link>
    </Button>
  );
}
