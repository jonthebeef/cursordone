"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/components/providers/auth-provider";
import { User } from "lucide-react";
import Image from "next/image";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

interface ProfileFormProps {
  onSuccess?: () => void;
}

export function ProfileForm({ onSuccess }: ProfileFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [name, setName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const supabase = createClientComponentClient();

  useEffect(() => {
    async function loadProfile() {
      if (!user?.id) return;

      setIsLoading(true);
      try {
        const { data: profile, error } = await supabase
          .from("profiles")
          .select("full_name, avatar_url")
          .eq("id", user.id)
          .single();

        if (error) {
          if (error.code === "PGRST116") {
            // Profile doesn't exist, create it
            const { data: newProfile, error: createError } = await supabase
              .from("profiles")
              .upsert({
                id: user.id,
                full_name:
                  user.user_metadata?.full_name ||
                  user.user_metadata?.name ||
                  "",
                avatar_url: user.user_metadata?.avatar_url || "",
                updated_at: new Date().toISOString(),
              })
              .select()
              .single();

            if (createError) throw createError;

            setName(newProfile?.full_name || "");
            setAvatarUrl(newProfile?.avatar_url || "");
          } else {
            throw error;
          }
        } else {
          setName(profile?.full_name || "");
          setAvatarUrl(profile?.avatar_url || "");
        }
      } catch (error) {
        console.error("Profile error:", error);
        toast({
          title: "Error",
          description: "Failed to load profile",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    }

    loadProfile();
  }, [user?.id, user?.user_metadata, supabase, toast]);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);
    setHasChanges(true);
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Error",
        description: "Please select an image file",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Error",
        description: "Image must be less than 5MB",
        variant: "destructive",
      });
      return;
    }

    try {
      const formData = new FormData();
      formData.append("avatar", file);
      formData.append("userId", user?.id || "");

      const response = await fetch("/api/upload-avatar", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to upload avatar");
      }

      const { avatarUrl: newAvatarUrl } = await response.json();
      setAvatarUrl(newAvatarUrl);
      setHasChanges(true);
    } catch (error) {
      console.error("Failed to upload avatar:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to upload avatar",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;

    setIsLoading(true);

    try {
      const { error } = await supabase.from("profiles").upsert({
        id: user.id,
        full_name: name,
        avatar_url: avatarUrl,
        updated_at: new Date().toISOString(),
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
      setHasChanges(false);
      onSuccess?.();
    } catch (error) {
      console.error("Update error:", error);
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setName(user?.user_metadata?.full_name || user?.user_metadata?.name || "");
    setAvatarUrl(user?.user_metadata?.avatar_url || "");
    setHasChanges(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-full overflow-hidden bg-zinc-800 flex items-center justify-center">
            {avatarUrl ? (
              <Image
                src={avatarUrl}
                alt={name || "Profile"}
                width={64}
                height={64}
                className="object-cover"
                unoptimized
              />
            ) : (
              <User className="h-8 w-8 text-zinc-500" />
            )}
          </div>
          <div className="space-y-2">
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*"
              onChange={handleAvatarChange}
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
            >
              Change avatar
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="name">Display Name</Label>
          <Input
            id="name"
            value={name}
            onChange={handleNameChange}
            disabled={isLoading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            value={user?.email || ""}
            disabled
            className="bg-zinc-900/50"
          />
        </div>
      </div>

      <div className="flex gap-4">
        <Button type="submit" disabled={!hasChanges || isLoading}>
          {isLoading ? "Saving..." : "Save changes"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={handleCancel}
          disabled={!hasChanges || isLoading}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
