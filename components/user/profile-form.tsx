"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/components/providers/auth-provider";
import { useSettings } from "@/components/providers/settings-provider";
import { User } from "lucide-react";
import Image from "next/image";

interface ProfileFormProps {
  onSuccess?: () => void;
}

export function ProfileForm({ onSuccess }: ProfileFormProps) {
  const { user } = useAuth();
  const { display, updateDisplay } = useSettings();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [name, setName] = useState(display?.displayName || "");
  const [role, setRole] = useState(display?.role || "");
  const [location, setLocation] = useState(display?.location || "");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [hasChanges, setHasChanges] = useState(false);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);
    setHasChanges(true);
  };

  const handleRoleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRole(e.target.value);
    setHasChanges(true);
  };

  const handleLocationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocation(e.target.value);
    setHasChanges(true);
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?.id) return;

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

    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append("avatar", file);
      formData.append("userId", user.id);

      const response = await fetch("/api/upload-avatar", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to upload avatar");
      }

      const { avatarPath } = await response.json();
      await updateDisplay({ avatarPath });
      setHasChanges(true);

      toast({
        title: "Success",
        description: "Avatar updated successfully",
      });
    } catch (error) {
      console.error("Failed to upload avatar:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to upload avatar",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;

    setIsLoading(true);

    try {
      await updateDisplay({
        ...display,
        displayName: name,
        role,
        location,
      });

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
    setName(display?.displayName || "");
    setRole(display?.role || "");
    setLocation(display?.location || "");
    setHasChanges(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-full overflow-hidden bg-zinc-800 flex items-center justify-center">
            {display?.avatarUrl || display?.avatarPath ? (
              <Image
                src={display.avatarUrl || `/api/avatar/${display.avatarPath}`}
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
          <Label htmlFor="role">Role</Label>
          <Input
            id="role"
            value={role}
            onChange={handleRoleChange}
            disabled={isLoading}
            placeholder="e.g. Software Engineer, Product Manager"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="location">Location</Label>
          <Input
            id="location"
            value={location}
            onChange={handleLocationChange}
            disabled={isLoading}
            placeholder="e.g. San Francisco, CA"
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
