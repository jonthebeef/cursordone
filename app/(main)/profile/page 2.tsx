"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ProfileForm } from "@/components/user/profile-form";

export default function ProfilePage() {
  return (
    <div className="container mx-auto py-6">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Profile Settings
          </h1>
          <p className="text-sm text-zinc-500">
            Manage your profile settings and preferences
          </p>
        </div>
        <Separator />

        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>
              Update your profile information and how others see you
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ProfileForm />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Account</CardTitle>
            <CardDescription>
              Manage your account settings and connected services
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-medium">Connected Accounts</h3>
              <p className="text-sm text-zinc-500 mt-1">
                You are currently signed in with your GitHub account
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
