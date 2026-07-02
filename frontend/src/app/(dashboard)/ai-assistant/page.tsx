"use client";
import { useRef, useState } from "react";
import { Send, Sparkles, Zap } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { aiApi } from "@/features/ai-assistant/services/ai.service";
import type { ChatMessage } from "@/features/ai-assistant/types/ai.types";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/page-header";

const SUGGESTED_PROMPTS = [
  "Summarize my invoices for this month",
  "How much is currently outstanding?",
  "Find GST mismatches in the latest reconciliation run",
  "Explain what CGST and SGST mean",
  "What invoices are overdue?",
  "Show me the reconciliation summary",
];

function MessageBubble({ msg }: { msg: ChatMessage }) {
  const isUser = msg.role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[80%] space-y-2`}>
        <div
          className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
            isUser
              ? "bg-primary text-primary-foreground"
              : "bg-card border border-border text-foreground"
          }`}
        >
          {msg.content}
        </div>
        {msg.actionTaken && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Zap className="size-3 text-amber" />
            <span>Action: <span className="font-medium">{msg.actionTaken.replace(/_/g, " ")}</span></span>
          </div>
        )}
        {msg.actionData && Object.keys(msg.actionData).length > 0 && (
          <pre className="rounded-md border border-border bg-muted px-3 py-2 text-xs overflow-x-auto">
            {JSON.stringify(msg.actionData, null, 2)}
          </pre>
        )}
      </div>
    </div>
  );
}

export default function AiAssistantPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [conversationId, setConversationId] = useState<string | undefined>();
  const bottomRef = useRef<HTMLDivElement>(null);

  const chat = useMutation({
    mutationFn: ({ message, cid }: { message: string; cid?: string }) =>
      aiApi.chat(message, cid),
    onSuccess: (data) => {
      if (!conversationId) setConversationId(data.conversationId);
      const assistantMsg: ChatMessage = {
        role: "assistant",
        content: data.response,
        actionTaken: data.actionTaken,
        actionData: data.actionData,
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    },
  });

  function sendMessage(text: string) {
    if (!text.trim() || chat.isPending) return;
    const userMsg: ChatMessage = {
      role: "user",
      content: text,
      actionTaken: null,
      actionData: null,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    chat.mutate({ message: text, cid: conversationId });
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
  }

  return (
    <div className="flex h-[calc(100vh-7rem)] flex-col">
      <PageHeader
        title="AI Assistant"
        description="Ask questions or give instructions in plain language. The assistant connects directly to your business data."
      />

      <div className="mt-5 flex flex-1 flex-col overflow-hidden rounded-lg border border-border bg-card">
        {/* Messages area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
            <div className="flex h-full flex-col items-center justify-center gap-6 py-8">
              <div className="flex size-14 items-center justify-center rounded-full bg-secondary">
                <Sparkles className="size-7 text-secondary-foreground" />
              </div>
              <div className="text-center">
                <p className="font-semibold">InvoiceAI Assistant</p>
                <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                  Ask me to summarize invoices, explain reconciliation issues, check outstanding amounts, or run GST analysis.
                </p>
              </div>
              <div className="grid gap-2 sm:grid-cols-2 w-full max-w-lg">
                {SUGGESTED_PROMPTS.map((p) => (
                  <button
                    key={p}
                    onClick={() => sendMessage(p)}
                    className="rounded-lg border border-border bg-muted/50 px-3 py-2 text-left text-xs hover:bg-muted transition-colors"
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <MessageBubble key={i} msg={msg} />
          ))}

          {chat.isPending && (
            <div className="flex justify-start">
              <div className="rounded-2xl border border-border bg-card px-4 py-3">
                <div className="flex gap-1">
                  <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.3s]" />
                  <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.15s]" />
                  <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground" />
                </div>
              </div>
            </div>
          )}

          {chat.isError && (
            <div className="flex justify-start">
              <div className="rounded-2xl border border-border bg-crimson-soft px-4 py-2.5 text-sm text-destructive max-w-xs">
                Something went wrong. Please try again.
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input bar */}
        <div className="border-t border-border p-3">
          <form
            onSubmit={(e) => { e.preventDefault(); sendMessage(input); }}
            className="flex gap-2"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask something about your invoices or GST…"
              disabled={chat.isPending}
              className="flex-1 rounded-lg border border-input bg-card px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
            />
            <Button type="submit" size="icon" disabled={chat.isPending || !input.trim()}>
              <Send className="size-4" />
            </Button>
          </form>
          {conversationId && (
            <p className="mt-1.5 text-center text-[10px] text-muted-foreground">
              Conversation ID: <span className="figure-numeric">{conversationId.slice(0, 8)}…</span>
              <button onClick={() => { setMessages([]); setConversationId(undefined); }} className="ml-2 hover:text-foreground underline">
                New conversation
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
