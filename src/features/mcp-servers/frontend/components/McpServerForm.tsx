import React from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";
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
import {
  McpServerZ,
  McpServerCommandConfigZ,
  McpServerSSEConfigZ,
} from "@core/validation/mcp-servers-schema";
import { Plus, X } from "lucide-react";

const baseFormSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, { message: "Server name is required" }),
  type: z.enum(["command", "sse"], {
    required_error: "Server type is required",
  }),
});

// Define the env field type
const envFieldSchema = z.object({
  key: z.string(),
  value: z.string(),
});

// Form schema using zod - always include both config types
const formSchema = z.discriminatedUnion("type", [
  baseFormSchema.extend({
    type: z.literal("command"),
    commandConfig: z.object({
      command: z.string().min(1, { message: "Command is required" }),
    }),
    envFields: z.array(envFieldSchema).optional().default([]),
  }),
  baseFormSchema.extend({
    type: z.literal("sse"),
    sseConfig: z.object({
      url: z.string().url({ message: "Please enter a valid URL" }),
    }),
    envFields: z.array(envFieldSchema).optional().default([]),
  }),
]);

// Server types available in the UI
const SERVER_TYPES = [
  { value: "command", label: "Command" },
  { value: "sse", label: "SSE" },
];

type FormValues = z.infer<typeof formSchema>;

interface McpServerFormProps {
  server: McpServerZ | null;
  onSubmit: (server: McpServerZ) => void;
  isSubmitting: boolean;
}

const defaultCommandConfig: McpServerCommandConfigZ = {
  command: "",
};

const defaultSSEConfig: McpServerSSEConfigZ = {
  url: "",
};

// Transform env record to array for field array use
function envRecordToArray(env?: Record<string, string>) {
  if (!env) return [];
  return Object.entries(env).map(([key, value]) => ({ key, value }));
}

// Transform array back to record for submission
function envArrayToRecord(envArray: { key: string; value: string }[]) {
  return envArray.reduce(
    (acc, { key, value }) => {
      if (key.trim()) {
        acc[key] = value;
      }
      return acc;
    },
    {} as Record<string, string>,
  );
}

function getFormInitialValues(server: McpServerZ | null): FormValues {
  const baseValues = {
    id: server?.id || "",
    name: server?.name || "",
    type: server?.type || "command",
    envFields: server
      ? server.type === "command"
        ? envRecordToArray(server.config.env)
        : envRecordToArray(server.config.env)
      : [],
  };

  if (server?.type === "command" || !server) {
    return {
      ...baseValues,
      type: "command",
      commandConfig:
        server?.type === "command" ? server.config : defaultCommandConfig,
      sseConfig: defaultSSEConfig,
    } as FormValues;
  } else {
    return {
      ...baseValues,
      type: "sse",
      commandConfig: defaultCommandConfig,
      sseConfig: server.config,
    } as FormValues;
  }
}

export const McpServerForm: React.FC<McpServerFormProps> = ({
  server,
  onSubmit,
  isSubmitting,
}) => {
  // Initialize form with default values or existing server data
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: getFormInitialValues(server),
    mode: "onChange",
  });

  // Setup field array for environment variables
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "envFields",
  });

  // Watch the server type to conditionally render fields
  const serverType = form.watch("type");

  const errors = form.formState.errors;
  console.log("Errors:", errors);

  // Handle form submission - always using both configs but only sending relevant one
  const handleSubmit = (values: FormValues) => {
    // Convert env fields array to record
    const envRecord = envArrayToRecord(values.envFields || []);

    // We do this because the form schema is discriminated union and we need to handle the different types of configs
    // It's how typescript type refinement works :D
    if (values.type === "command") {
      // Create server data with the appropriate config based on type
      const serverData: McpServerZ = {
        id: values.id || uuidv4(),
        name: values.name,
        type: values.type,
        config: {
          ...values.commandConfig,
          env: Object.keys(envRecord).length > 0 ? envRecord : undefined,
        },
      };

      onSubmit(serverData);
    } else {
      // Create server data with the appropriate config based on type
      const serverData: McpServerZ = {
        id: values.id || uuidv4(),
        name: values.name,
        type: values.type,
        config: {
          ...values.sseConfig,
          env: Object.keys(envRecord).length > 0 ? envRecord : undefined,
        },
      };

      onSubmit(serverData);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        {/* Server Name */}
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Server Name</FormLabel>
              <FormControl>
                <Input placeholder="Enter server name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Server Type */}
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Server Type</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
                value={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select server type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {SERVER_TYPES.map((type) => (
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

        {/* Command Config - Only shown when type is 'command' */}
        {serverType === "command" && (
          <FormField
            control={form.control}
            name="commandConfig.command"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Command to Run</FormLabel>
                <FormControl>
                  <Input placeholder="Enter command to run" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {/* SSE Config - Only shown when type is 'sse' */}
        {serverType === "sse" && (
          <FormField
            control={form.control}
            name="sseConfig.url"
            render={({ field }) => (
              <FormItem>
                <FormLabel>URL</FormLabel>
                <FormControl>
                  <Input placeholder="Enter SSE URL" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {/* Environment Variables Section */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <FormLabel>Environment Variables</FormLabel>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => append({ key: "", value: "" })}
              className="flex items-center gap-1"
            >
              <Plus className="h-4 w-4" /> Add Env Variable
            </Button>
          </div>

          {fields.length === 0 ? (
            <div className="text-sm text-muted-foreground italic">
              No environment variables defined
            </div>
          ) : (
            <div className="space-y-3">
              {fields.map((field, index) => (
                <div key={field.id} className="flex items-start gap-2">
                  <FormField
                    control={form.control}
                    name={`envFields.${index}.key`}
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormControl>
                          <Input placeholder="Key" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`envFields.${index}.value`}
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormControl>
                          <Input placeholder="Value" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => remove(index)}
                    className="h-10 w-10"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Submit Button */}
        <div className="flex justify-end pt-2">
          <Button type="submit" disabled={isSubmitting}>
            {server ? "Update Server" : "Add Server"}
          </Button>
        </div>
      </form>
    </Form>
  );
};
