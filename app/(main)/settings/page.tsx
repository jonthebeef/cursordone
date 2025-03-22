"use client";

import { Suspense, useState } from "react";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { GitSyncSettingsForm } from "@/components/GitSyncSettings";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings, GitBranch, PaintBucket, Bell } from "lucide-react";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("git");

  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-zinc-50"></div>
        </div>
      }
    >
      <div className="container max-w-4xl py-8 space-y-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
          <p className="text-sm text-muted-foreground">
            Configure application settings and preferences.
          </p>
        </div>

        <Separator />

        <Tabs
          defaultValue="git"
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full"
        >
          <TabsList className="grid grid-cols-4 mb-6">
            <TabsTrigger value="git" className="flex items-center gap-2">
              <GitBranch className="h-4 w-4" />
              <span className="hidden sm:inline">Git Sync</span>
            </TabsTrigger>
            <TabsTrigger value="appearance" className="flex items-center gap-2">
              <PaintBucket className="h-4 w-4" />
              <span className="hidden sm:inline">Appearance</span>
            </TabsTrigger>
            <TabsTrigger
              value="notifications"
              className="flex items-center gap-2"
            >
              <Bell className="h-4 w-4" />
              <span className="hidden sm:inline">Notifications</span>
            </TabsTrigger>
            <TabsTrigger value="general" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">General</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="git">
            <Card className="p-6">
              <div className="mb-6">
                <h2 className="text-lg font-medium">Git Synchronization</h2>
                <p className="text-sm text-muted-foreground">
                  Configure how your tasks, epics, and docs sync with Git.
                </p>
              </div>
              <GitSyncSettingsForm />
            </Card>
          </TabsContent>

          <TabsContent value="appearance">
            <Card className="p-6">
              <div className="mb-6">
                <h2 className="text-lg font-medium">Appearance</h2>
                <p className="text-sm text-muted-foreground">
                  Customize your application experience and appearance.
                </p>
              </div>
              <div className="text-sm text-zinc-500 py-12 text-center">
                Appearance settings will be added in a future update.
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="notifications">
            <Card className="p-6">
              <div className="mb-6">
                <h2 className="text-lg font-medium">Notifications</h2>
                <p className="text-sm text-muted-foreground">
                  Configure notification preferences and alerts.
                </p>
              </div>
              <div className="text-sm text-zinc-500 py-12 text-center">
                Notification settings will be added in a future update.
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="general">
            <Card className="p-6">
              <div className="mb-6">
                <h2 className="text-lg font-medium">General Settings</h2>
                <p className="text-sm text-muted-foreground">
                  Configure general application preferences.
                </p>
              </div>
              <div className="text-sm text-zinc-500 py-12 text-center">
                More general settings will be added in a future update.
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Suspense>
  );
}
