import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Square, FileText } from "lucide-react";
import { MarkdownRenderer } from "@/components/chat/MarkdownRenderer";
import type { ChatMessage, ChunkSource } from "@/lib/types";
import { cn } from "@/lib/utils";

interface ChatWindowProps {
  messages: ChatMessage[];
  isStreaming: boolean;
  onSendMessage: (content: string) => void;
  onStopStreaming: () => void;
  sessionTitle: string;
  documentCount?: number;
}

export function ChatWindow({
  messages,
  isStreaming,
  onSendMessage,
  onStopStreaming,
  sessionTitle,
  documentCount = 0,
}: ChatWindowProps) {
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 150) + "px";
    }
  }, [input]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isStreaming) return;
    onSendMessage(input.trim());
    setInput("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b border-border px-4 py-3 flex items-center justify-between">
        <h2 className="font-medium text-sm">{sessionTitle}</h2>
        {documentCount > 0 && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <FileText className="w-3.5 h-3.5" />
            <span>{documentCount} document{documentCount !== 1 ? "s" : ""} loaded</span>
          </div>
        )}
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1">
        <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
          {messages.length === 0 && (
            <div className="text-center py-12">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <FileText className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-medium text-lg mb-2">Start a conversation</h3>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                Upload documents in the Documents panel, then ask questions about their content.
                The AI will retrieve relevant passages and generate answers.
              </p>
            </div>
          )}
          {messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))}
          {isStreaming && messages[messages.length - 1]?.role === "assistant" && (
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-current animate-bounce" />
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-current animate-bounce [animation-delay:0.1s]" />
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-current animate-bounce [animation-delay:0.2s]" />
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="border-t border-border p-4">
        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
          <div className="relative flex items-end gap-2 bg-muted rounded-xl p-2">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask a question about your documents..."
              className="flex-1 bg-transparent resize-none border-0 outline-none text-sm px-2 py-1.5 min-h-[36px] max-h-[150px] placeholder:text-muted-foreground"
              rows={1}
            />
            {isStreaming ? (
              <Button
                type="button"
                size="icon"
                variant="destructive"
                className="h-8 w-8 shrink-0"
                onClick={onStopStreaming}
              >
                <Square className="h-3 w-3" />
              </Button>
            ) : (
              <Button
                type="submit"
                size="icon"
                className="h-8 w-8 shrink-0"
                disabled={!input.trim()}
              >
                <Send className="h-4 w-4" />
              </Button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";

  return (
    <div className={cn("flex gap-3", isUser && "flex-row-reverse")}>
      <div
        className={cn(
          "w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-medium",
          isUser
            ? "bg-primary text-primary-foreground"
            : "bg-secondary text-secondary-foreground"
        )}
      >
        {isUser ? "U" : "AI"}
      </div>
      <div className={cn("flex-1 space-y-2", isUser && "text-right")}>
        <div
          className={cn(
            "inline-block rounded-xl px-4 py-2.5 text-sm max-w-full text-left",
            isUser
              ? "bg-primary text-primary-foreground"
              : "bg-muted"
          )}
        >
          <MarkdownRenderer content={message.content} isUser={isUser} />
        </div>
        {message.sources && message.sources.length > 0 && (
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground font-medium">Sources:</p>
            {message.sources.map((source, idx) => (
              <SourceCard key={idx} source={source} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function SourceCard({ source }: { source: ChunkSource }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <button
      onClick={() => setExpanded(!expanded)}
      className="block w-full text-left text-xs border border-border rounded-lg p-2 hover:bg-muted/50 transition-colors"
    >
      <div className="flex items-center gap-1.5">
        <FileText className="w-3 h-3 text-muted-foreground" />
        <span className="font-medium truncate">{source.documentName}</span>
        <span className="text-muted-foreground ml-auto">
          {(source.score * 100).toFixed(0)}% match
        </span>
      </div>
      {expanded && (
        <p className="mt-1.5 text-muted-foreground line-clamp-4">
          {source.content}
        </p>
      )}
    </button>
  );
}
