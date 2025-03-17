/**
 * Gets the appropriate CSS class for a message based on its role
 */
export const getMessageStyle = (role: string, isStreaming: boolean): string => {
  switch (role) {
    case "system":
      return "bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-500";
    case "user":
      return "bg-blue-50 dark:bg-blue-900/20";
    case "assistant":
      return isStreaming
        ? "bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700 border"
        : "bg-green-50 dark:bg-green-900/20";
    case "tool":
      return "bg-purple-50 dark:bg-purple-900/20 text-sm";
    default:
      return "bg-gray-50 dark:bg-gray-800";
  }
}; 