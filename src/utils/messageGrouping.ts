import type { ChatMessage } from "@/hooks/useChat";

export type MessageItem =
  | { type: "single"; msg: ChatMessage }
  | { type: "image_group"; messages: ChatMessage[] };

/**
 * Groups consecutive image messages from the same sender within 60s into image groups.
 */
export function groupMessages(messages: ChatMessage[]): MessageItem[] {
  const result: MessageItem[] = [];
  let i = 0;

  while (i < messages.length) {
    const msg = messages[i];
    if (msg.message_type === "image" && msg.file_url) {
      // Collect consecutive images from same sender within 60s
      const group: ChatMessage[] = [msg];
      let j = i + 1;
      while (j < messages.length) {
        const next = messages[j];
        if (
          next.message_type === "image" &&
          next.file_url &&
          next.sender_id === msg.sender_id &&
          Math.abs(new Date(next.created_at).getTime() - new Date(msg.created_at).getTime()) < 60000
        ) {
          group.push(next);
          j++;
        } else {
          break;
        }
      }
      if (group.length >= 2) {
        result.push({ type: "image_group", messages: group });
      } else {
        result.push({ type: "single", msg });
      }
      i = j;
    } else {
      result.push({ type: "single", msg });
      i++;
    }
  }

  return result;
}
