import React, { useState } from "react";
import { useSettings } from "@/lib/hooks/use-settings";
import { GitSyncSettings } from "@/lib/settings/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Switch,
  Button,
  Input,
  Slider,
  Checkbox,
  Separator,
} from "@/components/ui/";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { GitSyncSettingsSchema } from "@/lib/settings/types";
import { toast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";

// Create a form schema based on the GitSyncSettingsSchema
const formSchema = GitSyncSettingsSchema;

export function GitSyncSettingsForm() {
  const { settings, updateSettings } = useSettings();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize form with current settings
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: settings?.gitSync || {},
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    try {
      await updateSettings({
        gitSync: values,
      });
      toast({
        title: "Settings updated",
        description: "Git synchronization settings have been saved.",
      });
    } catch (error) {
      console.error("Failed to update Git sync settings:", error);
      toast({
        title: "Error",
        description: "Failed to update Git synchronization settings.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!settings) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Git Synchronization</CardTitle>
          <CardDescription>Loading settings...</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center py-6">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Git Synchronization</CardTitle>
        <CardDescription>
          Configure how your tasks, epics, and docs sync with Git
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="enabled"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Enable Git Sync</FormLabel>
                    <FormDescription>
                      Automatically synchronize your workspace with Git
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {form.watch("enabled") && (
              <>
                <Separator />

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Auto-Sync Settings</h3>

                  <FormField
                    control={form.control}
                    name="autoPullEnabled"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel>Auto-Pull</FormLabel>
                          <FormDescription>
                            Automatically pull changes from the remote
                            repository
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  {form.watch("autoPullEnabled") && (
                    <FormField
                      control={form.control}
                      name="autoPullInterval"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Auto-Pull Interval (minutes)</FormLabel>
                          <FormControl>
                            <div className="space-y-2">
                              <Slider
                                min={1}
                                max={60}
                                step={1}
                                value={[field.value]}
                                onValueChange={(values) =>
                                  field.onChange(values[0])
                                }
                              />
                              <div className="flex justify-between">
                                <span className="text-sm text-muted-foreground">
                                  1 min
                                </span>
                                <span className="text-sm font-medium">
                                  {field.value}{" "}
                                  {field.value === 1 ? "minute" : "minutes"}
                                </span>
                                <span className="text-sm text-muted-foreground">
                                  60 min
                                </span>
                              </div>
                            </div>
                          </FormControl>
                          <FormDescription>
                            How often to check for remote changes
                          </FormDescription>
                        </FormItem>
                      )}
                    />
                  )}

                  <FormField
                    control={form.control}
                    name="autoPushEnabled"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel>Auto-Push</FormLabel>
                          <FormDescription>
                            Automatically push your changes to the remote
                            repository
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Commit Settings</h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="batchCommitsThreshold"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Batch Threshold</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min={1}
                              max={50}
                              {...field}
                              onChange={(e) =>
                                field.onChange(parseInt(e.target.value))
                              }
                            />
                          </FormControl>
                          <FormDescription>
                            Number of changes before triggering a commit
                          </FormDescription>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="batchCommitsTimeout"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Batch Timeout (seconds)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min={5}
                              max={3600}
                              value={field.value / 1000}
                              onChange={(e) =>
                                field.onChange(parseInt(e.target.value) * 1000)
                              }
                            />
                          </FormControl>
                          <FormDescription>
                            Time to wait before committing changes
                          </FormDescription>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Paths to Sync</h3>
                  <FormDescription>
                    Select which directories to include in Git synchronization
                  </FormDescription>

                  <div className="space-y-2">
                    {["tasks", "epics", "docs"].map((dir) => (
                      <FormField
                        key={dir}
                        control={form.control}
                        name="gitPaths"
                        render={({ field }) => {
                          const checked = field.value?.includes(dir) || false;
                          return (
                            <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={checked}
                                  onCheckedChange={(state) => {
                                    const currentPaths = [
                                      ...(field.value || []),
                                    ];
                                    if (state) {
                                      if (!currentPaths.includes(dir)) {
                                        field.onChange([...currentPaths, dir]);
                                      }
                                    } else {
                                      field.onChange(
                                        currentPaths.filter(
                                          (path) => path !== dir,
                                        ),
                                      );
                                    }
                                  }}
                                />
                              </FormControl>
                              <FormLabel className="font-normal">
                                {dir.charAt(0).toUpperCase() + dir.slice(1)}
                              </FormLabel>
                            </FormItem>
                          );
                        }}
                      />
                    ))}
                  </div>
                </div>
              </>
            )}

            <CardFooter className="flex justify-end px-0">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Save Settings
              </Button>
            </CardFooter>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
