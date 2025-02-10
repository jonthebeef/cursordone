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
      if (!user?.id) {
        console.log("No user ID available");
        return;
      }

      setIsLoading(true);
      try {
        console.log("Loading profile for user:", user.id);

        // First try to get the existing profile
        const { data: existingProfiles, error: listError } = await supabase
          .from("profiles")
          .select("full_name, avatar_url")
          .eq("id", user.id);

        if (listError) {
          console.error("Failed to check profiles:", listError);
          toast({
            title: "Error",
            description: "Failed to load profile",
            variant: "destructive",
          });
          return;
        }

        // Profile exists
        if (existingProfiles && existingProfiles.length > 0) {
          console.log("Found existing profile:", existingProfiles[0]);
          setName(existingProfiles[0].full_name || "");
          setAvatarUrl(existingProfiles[0].avatar_url || "");
          return;
        }

        // No profile exists, create one
        console.log("No profile found, creating new one with:", {
          id: user.id,
          metadata: user.user_metadata,
        });

        const { data: newProfile, error: createError } = await supabase
          .from("profiles")
          .insert([
            {
              id: user.id,
              full_name:
                user.user_metadata?.full_name || user.user_metadata?.name || "",
              avatar_url: user.user_metadata?.avatar_url || "",
              updated_at: new Date().toISOString(),
            },
          ])
          .select()
          .single();

        if (createError) {
          console.error("Failed to create profile:", createError);
          toast({
            title: "Error",
            description: "Failed to create profile",
            variant: "destructive",
          });
          return;
        }

        if (newProfile) {
          console.log("Created new profile:", newProfile);
          setName(newProfile.full_name || "");
          setAvatarUrl(newProfile.avatar_url || "");
        }
      } catch (error) {
        console.error("Unexpected error:", error);
        toast({
          title: "Error",
          description: "An unexpected error occurred",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    }

    // Initialize form with user metadata while loading
    if (user?.user_metadata) {
      console.log("Initializing with user metadata:", user.user_metadata);
      setName(user.user_metadata.full_name || user.user_metadata.name || "");
      setAvatarUrl(user.user_metadata.avatar_url || "");
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

    try {
      const formData = new FormData();
      formData.append("avatar", file);
      formData.append("userId", user?.id || "");

      const response = await fetch("/api/upload-avatar", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Failed to upload avatar");

      const { avatarUrl: newAvatarUrl } = await response.json();
      setAvatarUrl(newAvatarUrl);
      setHasChanges(true);
    } catch (error) {
      console.error("Failed to upload avatar:", error);
      toast({
        title: "Error",
        description: "Failed to upload avatar",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) {
      console.error("No user ID available for update");
      return;
    }

    setIsLoading(true);
    console.log("Submitting profile update:", { name, avatarUrl });

    try {
      const response = await fetch("/api/update-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, avatarUrl }),
        credentials: "include",
      });

      const data = await response.json();
      console.log("Profile update response:", data);

      if (!response.ok) {
        throw new Error(data.error || "Failed to update profile");
      }

      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
      setHasChanges(false);
      onSuccess?.();
    } catch (error) {
      console.error("Failed to update profile:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to update profile",
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
              size="sm"
              disabled={isLoading}
              onClick={() => fileInputRef.current?.click()}
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
            placeholder="Enter your name"
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

      <div className="flex gap-2">
        <Button
          type="submit"
          disabled={isLoading || !hasChanges}
          variant="default"
        >
          {isLoading ? "Saving..." : "Save changes"}
        </Button>
        {hasChanges && (
          <Button type="button" variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}
