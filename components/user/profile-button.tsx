"use client";

import { User } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/components/providers/auth-provider";
import { useSettings } from "@/components/providers/settings-provider";

export function ProfileButton() {
  const { user } = useAuth();
  const { display } = useSettings();

  const displayName = display?.displayName || user?.email || "Set up profile";

  return (
    <Button
      variant="ghost"
      className="w-full justify-start items-center gap-2 px-4"
      asChild
    >
      <Link href={{ pathname: "/profile" }}>
        <div className="h-6 w-6 rounded-full overflow-hidden bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
          {display?.avatarPath ? (
            <Image
              src={`/api/avatar/${display.avatarPath}`}
              alt={displayName}
              width={24}
              height={24}
              className="object-cover"
              unoptimized
            />
          ) : (
            <User className="h-4 w-4 text-zinc-500" />
          )}
        </div>
        <span className="truncate text-sm">{displayName}</span>
      </Link>
    </Button>
  );
}
