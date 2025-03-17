import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ConfiguredProvider } from "../../types/models";

// Provider types available in the UI
const PROVIDER_TYPES = [
  { value: "openai", label: "OpenAI" },
  { value: "anthropic", label: "Anthropic" },
];

const urlSchema = z.string().url({ message: "Please enter a valid URL" });
// Form schema using zod
const formSchema = z.object({
  provider: z.enum(["openai", "anthropic"], {
    required_error: "Provider type is required",
  }),
  settings: z.object({
    apiKey: z.string().min(1, { message: "API Key is required" }),
    baseUrl: z
      .string()
      .optional()
      .superRefine((val, ctx) => {
        if (!val) return;
        const parsedUrl = urlSchema.safeParse(val);
        if (!parsedUrl.success) {
          ctx.addIssue(parsedUrl.error.issues[0]);
        }
      }),
  }),
});

type FormValues = z.infer<typeof formSchema>;

interface ModelProviderFormProps {
  provider: ConfiguredProvider | null;
  onSubmit: (provider: ConfiguredProvider) => void;
  isSubmitting: boolean;
}

function getFormInitialValues(provider: ConfiguredProvider | null): FormValues {
  return {
    provider: provider?.provider || "openai",
    settings: {
      apiKey: provider?.settings.apiKey || "",
      baseUrl: provider?.settings.baseUrl || "",
    },
  };
}

/**
 * ModelProviderForm Component
 *
 * Form for adding or editing AI model providers
 */
export const ModelProviderForm: React.FC<ModelProviderFormProps> = ({
  provider,
  onSubmit,
  isSubmitting,
}) => {
  // Initialize form with default values or existing provider data
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: getFormInitialValues(provider),
    mode: "onChange",
  });

  // Handle form submission
  const handleSubmit = (values: FormValues) => {
    const providerData: ConfiguredProvider = {
      provider: values.provider,
      settings: {
        apiKey: values.settings.apiKey,
        baseUrl: values.settings.baseUrl,
      },
    };
    onSubmit(providerData);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        {/* Provider Type */}
        <FormField
          control={form.control}
          name="provider"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Provider Type</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
                value={field.value}
                disabled={provider !== null} // Cannot change provider type when editing
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select provider type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {PROVIDER_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* API Key */}
        <FormField
          control={form.control}
          name="settings.apiKey"
          render={({ field }) => (
            <FormItem>
              <FormLabel>API Key</FormLabel>
              <FormControl>
                <Input type="text" placeholder="Enter API key" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Base URL - Optional */}
        <FormField
          control={form.control}
          name="settings.baseUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Base URL (Optional)</FormLabel>
              <FormControl>
                <Input
                  placeholder="Enter base URL"
                  {...field}
                  value={field.value || ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Submit Button */}
        <div className="flex justify-end pt-2">
          <Button type="submit" disabled={isSubmitting}>
            {provider ? "Update Provider" : "Add Provider"}
          </Button>
        </div>
      </form>
    </Form>
  );
};
