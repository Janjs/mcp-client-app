import React, { useState, useEffect } from 'react';
import { McpServerZ, McpServerCommandConfigZ, McpServerSSEConfigZ } from '../../../../core/validation/mcp-servers-schema';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from '../../../../renderer/src/components/ui/dialog';

// Types of servers available
const SERVER_TYPES = [
  { value: 'command', label: 'Command' },
  { value: 'sse', label: 'SSE' },
];

interface FormData {
  name: string;
  type: 'command' | 'sse';
  command: string;
  url: string;
}

interface McpServerFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (server: McpServerZ) => void;
  server: McpServerZ | null;
}

/**
 * MCP Server Form Dialog Component
 * 
 * Form dialog for adding or editing MCP servers
 */
export const McpServerFormDialog: React.FC<McpServerFormDialogProps> = ({
  open,
  onClose,
  onSubmit,
  server,
}) => {
  // Initial form state
  const [formData, setFormData] = useState<FormData>({
    name: '',
    type: 'command',
    command: '',
    url: '',
  });

  // Validation error state
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Initialize form data when editing a server
  useEffect(() => {
    if (server) {
      const data: FormData = {
        name: server.name,
        type: server.type,
        command: server.type === 'command' ? (server.config as McpServerCommandConfigZ).command : '',
        url: server.type === 'sse' ? (server.config as McpServerSSEConfigZ).url : '',
      };
      setFormData(data);
    } else {
      // Reset form when adding a new server
      setFormData({
        name: '',
        type: 'command',
        command: '',
        url: '',
      });
    }
    // Clear errors when opening/closing or changing server
    setErrors({});
  }, [server, open]);

  // Handle form input changes
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    // Clear error when field is changed
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  // Validate form before submission
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (formData.type === 'command' && !formData.command.trim()) {
      newErrors.command = 'Command is required';
    }

    if (formData.type === 'sse') {
      if (!formData.url.trim()) {
        newErrors.url = 'URL is required';
      } else {
        try {
          new URL(formData.url);
        } catch (_) {
          newErrors.url = 'Please enter a valid URL';
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    // Prepare server data based on server type
    let serverData: McpServerZ;

    if (formData.type === 'command') {
      serverData = {
        id: server?.id || '',
        name: formData.name,
        type: 'command',
        config: {
          command: formData.command,
        },
      };
    } else {
      serverData = {
        id: server?.id || '',
        name: formData.name,
        type: 'sse',
        config: {
          url: formData.url,
        },
      };
    }

    onSubmit(serverData);
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{server ? 'Edit MCP Server' : 'Add New MCP Server'}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Server Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Server Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-md ${
                errors.name ? 'border-red-500' : 'border-gray-300'
              } focus:outline-none focus:ring-2 focus:ring-blue-500`}
              placeholder="Enter server name"
            />
            {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name}</p>}
          </div>

          {/* Server Type */}
          <div>
            <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
              Server Type
            </label>
            <select
              id="type"
              name="type"
              value={formData.type}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {SERVER_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          {/* Conditional Fields Based on Server Type */}
          {formData.type === 'command' && (
            <div>
              <label htmlFor="command" className="block text-sm font-medium text-gray-700 mb-1">
                Command to Run
              </label>
              <input
                type="text"
                id="command"
                name="command"
                value={formData.command}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-md ${
                  errors.command ? 'border-red-500' : 'border-gray-300'
                } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                placeholder="Enter command to run"
              />
              {errors.command && <p className="mt-1 text-sm text-red-500">{errors.command}</p>}
            </div>
          )}

          {formData.type === 'sse' && (
            <div>
              <label htmlFor="url" className="block text-sm font-medium text-gray-700 mb-1">
                Server URL
              </label>
              <input
                type="text"
                id="url"
                name="url"
                value={formData.url}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-md ${
                  errors.url ? 'border-red-500' : 'border-gray-300'
                } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                placeholder="Enter server URL (e.g., http://example.com/events)"
              />
              {errors.url && <p className="mt-1 text-sm text-red-500">{errors.url}</p>}
            </div>
          )}

          {/* Form Actions */}
          <DialogFooter className="mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
            >
              {server ? 'Update Server' : 'Add Server'}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}; 