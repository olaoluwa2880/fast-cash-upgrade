import { useEffect, useRef, useState } from "react";
import { ChevronLeft, X } from "lucide-react";
import { Conversation, ConversationContent, ConversationScrollButton } from "@/components/ai-elements/conversation";
import { Message, MessageContent, MessageResponse } from "@/components/ai-elements/message";
import { PromptInput, PromptInputFooter, PromptInputSubmit, PromptInputTextarea } from "@/components/ai-elements/prompt-input";
import { Shimmer } from "@/components/ai-elements/shimmer";

export type SupportSection = "live";

type ChatMsg = { role: "user" | "assistant"; content: string };

function LiveChat() {
  const [messages, setMessages] = useState<ChatMsg[]>([
    { role: "assistant", content: "Hi, I'm FastCredit Live Support. How can I help you today?" },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  async function send(text: string) {
    const value = text.trim();
    if (!value || loading) return;
    const next = [...messages, { role: "user" as const, content: value }];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/support-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next.map(({ role, content }) => ({ role, content })) }),
      });
      if (!res.ok) throw new Error(res.status === 429 ? "Support is busy right now, please try again in a moment." : "Support is unavailable right now.");
      const data = (await res.json()) as { reply: string };
      setMessages((m) => [...m, { role: "assistant", content: data.reply }]);
    } catch (e) {
      setMessages((m) => [...m, {
        role: "assistant",
        content: e instanceof Error ? e.message : "Something went wrong.",
      }]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <Conversation className="min-h-0">
        <ConversationContent className="gap-4 px-0 py-3">
        {messages.map((m, i) => (
          <Message key={`${m.role}-${i}`} from={m.role}>
            <MessageContent className={m.role === "user" ? "bg-primary text-primary-foreground" : "bg-transparent px-0 py-0"}>
              <MessageResponse>{m.content}</MessageResponse>
            </MessageContent>
          </Message>
        ))}
        {loading && (
          <Message from="assistant">
            <MessageContent className="bg-transparent px-0 py-0">
              <Shimmer className="text-sm">Thinking...</Shimmer>
            </MessageContent>
          </Message>
        )}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      <PromptInput
        onSubmit={({ text }) => send(text)}
        className="border-border bg-card"
      >
        <PromptInputTextarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask Live Support..."
          className="min-h-20 max-h-36"
        />
        <PromptInputFooter className="justify-end">
          <PromptInputSubmit disabled={loading || !input.trim()} status={loading ? "submitted" : "ready"} />
        </PromptInputFooter>
      </PromptInput>
    </div>
  );
}
export function SupportCenter({ onClose }: {
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[70] flex flex-col bg-background text-foreground">
      <header className="mx-auto flex w-full max-w-[720px] shrink-0 items-center gap-3 border-b border-border px-4 py-4">
        <button onClick={onClose} aria-label="Back to dashboard" className="grid h-9 w-9 place-items-center rounded-full border border-border bg-card">
          <ChevronLeft className="h-4 w-4 text-primary" />
        </button>
        <div className="flex-1 text-center">
          <p className="font-black">FastCredit Live Chat</p>
          <p className="text-[11px] text-muted-foreground">Online support</p>
        </div>
        <button onClick={onClose} aria-label="Close Live Chat" className="grid h-9 w-9 place-items-center rounded-full border border-border bg-card">
          <X className="h-4 w-4" />
        </button>
      </header>
      <main className="mx-auto min-h-0 w-full max-w-[720px] flex-1 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-2">
        <LiveChat />
      </main>
    </div>
  );
}
