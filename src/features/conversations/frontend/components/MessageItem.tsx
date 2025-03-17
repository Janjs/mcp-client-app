// This file serves as a backward compatibility layer
// It re-exports the refactored MessageItem component
// This allows existing code to continue working without changes

import { MessageItem, MessageItemProps } from './message-item';

export { MessageItem };
export type { MessageItemProps };
