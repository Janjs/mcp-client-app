import React from "react";
import { useForm } from "react-hook-form";
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

const baseFormSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, { message: "Server name is required" }),
  type: z.enum(["command", "sse"], {
    required_error: "Server type is required",
  }),
});

// Form schema using zod - always include both config types
const formSchema = z.discriminatedUnion("type", [
  baseFormSchema.extend({
    type: z.literal("command"),
    commandConfig: z.object({
      command: z.string().min(1, { message: "Command is required" }),
    }),
  }),
  baseFormSchema.extend({
    type: z.literal("sse"),
    sseConfig: z.object({
      url: z.string().url({ message: "Please enter a valid URL" }),
    }),
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

function getFormInitialValues(server: McpServerZ | null): FormValues {
  return {
    id: server?.id || "",
    name: server?.name || "",
    type: server?.type || "command",
    commandConfig:
      server?.type === "command" ? server.config : defaultCommandConfig,
    sseConfig: server?.type === "sse" ? server.config : defaultSSEConfig,
  };
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

  // Watch the server type to conditionally render fields
  const serverType = form.watch("type");

  const errors = form.formState.errors;
  console.log("Errors:", errors);

  // Handle form submission - always using both configs but only sending relevant one
  const handleSubmit = (values: FormValues) => {
    // We do this because the form schema is discriminated union and we need to handle the different types of configs
    // It's how typescript type refinement works :D
    if (values.type === "command") {
      // Create server data with the appropriate config based on type
      const serverData: McpServerZ = {
        id: values.id || uuidv4(),
        name: values.name,
        type: values.type,
        config: values.commandConfig,
      };
      onSubmit(serverData);
    } else {
      // Create server data with the appropriate config based on type
      const serverData: McpServerZ = {
        id: values.id || uuidv4(),
        name: values.name,
        type: values.type,
        config: values.sseConfig,
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
