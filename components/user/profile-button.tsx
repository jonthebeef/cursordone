"use client"

import { User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import Image from "next/image"

interface ProfileButtonProps {
  name?: string
  email?: string
  avatarUrl?: string
}

export function ProfileButton({ name, email, avatarUrl }: ProfileButtonProps) {
  const router = useRouter()
  const displayName = name || email || "Set up profile"

  return (
    <Button
      variant="ghost"
      className="w-full justify-start items-center gap-2 px-4"
      onClick={() => router.push("/profile")}
    >
      <div className="h-6 w-6 rounded-full overflow-hidden bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
        {avatarUrl ? (
          <Image
            src={avatarUrl}
            alt={displayName}
            width={24}
            height={24}
            className="object-cover"
          />
        ) : (
          <User className="h-4 w-4 text-zinc-500" />
        )}
      </div>
      <span className="truncate text-sm">{displayName}</span>
    </Button>
  )
} 