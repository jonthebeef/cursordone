"use client";

import { Suspense } from "react";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ProfileForm } from "@/components/user/profile-form";

export default function ProfilePage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-zinc-50"></div>
        </div>
      }
    >
      <div className="container max-w-2xl py-8 space-y-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Profile Settings
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage your account settings and preferences.
          </p>
        </div>

        <Separator />

        <Card className="p-6 space-y-6">
          <div>
            <h2 className="text-lg font-medium">Profile Information</h2>
            <p className="text-sm text-muted-foreground">
              Update your profile information and how you appear to others.
            </p>
          </div>
          <ProfileForm />
        </Card>

        <Card className="p-6 space-y-6">
          <div>
            <h2 className="text-lg font-medium">GitHub Connection</h2>
            <p className="text-sm text-muted-foreground">
              Connect your GitHub account to enable team collaboration features.
            </p>
          </div>
          {/* GitHub connection UI will go here */}
        </Card>

        <Card className="p-6 space-y-6">
          <div>
            <h2 className="text-lg font-medium">Account Management</h2>
            <p className="text-sm text-muted-foreground">
              Manage your account security and settings.
            </p>
          </div>
          {/* Account management options will go here */}
        </Card>
      </div>
    </Suspense>
  );
}
