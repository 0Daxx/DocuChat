import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MarkdownRenderer } from "@/components/chat/MarkdownRenderer";
import {
  Send,
  Square,
  FileText,
  Paperclip,
  X,
  Folder,
  Link2,
  Unlink,
  Upload,
  Trash2,
} from "lucide-react";
import type {
  ChatSession,
  ChatMessage,
  ChunkSource,
  Document,
  DocumentOwnerType,
  Project,
} from "@/lib/types";
import { cn } from "@/lib/utils";

interface ChatWindowProps {
  session: ChatSession;
  project: Project | null;
  documents: Document[];
  isStreaming: boolean;
  isProcessing: boolean;
  processingError: string | null;
  onSendMessage: (content: string) => void;
  onStopStreaming: () => void;
  onUploadDocuments: (files: FileList, ownerId: string, ownerType: DocumentOwnerType) => void;
  onDeleteDocument: (documentId: string) => void;
  projects: Project[];
  onAttachToProject: (chatId: string, projectId: string) => void;
  onDetachFromProject: (chatId: string) => void;
}

export function ChatWindow({
  session,
  project,
  documents,
  isStreaming,
  isProcessing,
  processingError,
  onSendMessage,
  onStopStreaming,
  onUploadDocuments,
  onDeleteDocument,
  projects,
  onAttachToProject,
  onDetachFromProject,
}: ChatWindowProps) {
  const [input, setInput] = useState("");
  const [showDocPanel, setShowDocPanel] = useState(false);
  const [uploadTarget, setUploadTarget] = useState<"chat" | "project">("chat");
  const [showProjectMenu, setShowProjectMenu] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const projectMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [session.messages]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + "px";
    }
  }, [input]);

  // Reset upload target when session changes
  useEffect(() => {
    setUploadTarget("chat");
    setShowDocPanel(false);
  }, [session.id]);

  // Close project menu on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (projectMenuRef.current && !projectMenuRef.current.contains(e.target as Node)) {
        setShowProjectMenu(false);
      }
    };
    if (showProjectMenu) {
      document.addEventListener("mousedown", handleClick);
      return () => document.removeEventListener("mousedown", handleClick);
    }
  }, [showProjectMenu]);

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

  const handleFileClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const ownerId = uploadTarget === "project" && project ? project.id : session.id;
      const ownerType: DocumentOwnerType = uploadTarget === "project" && project ? "project" : "chat";
      onUploadDocuments(e.target.files, ownerId, ownerType);
      e.target.value = "";
    }
  };

  const chatDocs = documents.filter(d => d.ownerType === "chat" && d.ownerId === session.id);
  const projectDocs = project
    ? documents.filter(d => d.ownerType === "project" && d.ownerId === project.id)
    : [];

  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b border-border px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          <h2 className="font-medium text-sm truncate">{session.title}</h2>
          {project && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
              <span>{project.color}</span>
              <span className="truncate max-w-[100px]">{project.name}</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-1">
          {/* Project attachment controls */}
          {!project ? (
            <div className="relative" ref={projectMenuRef}>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs gap-1"
                onClick={() => setShowProjectMenu(!showProjectMenu)}
                disabled={projects.length === 0}
              >
                <Link2 className="h-3 w-3" />
                <span className="hidden sm:inline">Add to project</span>
              </Button>
              {showProjectMenu && projects.length > 0 && (
                <div className="absolute right-0 top-full mt-1 z-50 bg-popover border border-border rounded-md shadow-md py-1 min-w-[180px]">
                  {projects.map((p) => (
                    <button
                      key={p.id}
                      className="w-full text-left px-3 py-1.5 text-xs hover:bg-accent transition-colors flex items-center gap-2"
                      onClick={() => {
                        onAttachToProject(session.id, p.id);
                        setShowProjectMenu(false);
                      }}
                    >
                      <span>{p.color}</span>
                      <span className="truncate">{p.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs gap-1"
              onClick={() => onDetachFromProject(session.id)}
            >
              <Unlink className="h-3 w-3" />
              <span className="hidden sm:inline">Detach</span>
            </Button>
          )}

          {/* Document panel toggle */}
          <Button
            variant={showDocPanel ? "secondary" : "ghost"}
            size="sm"
            className="h-7 text-xs gap-1"
            onClick={() => setShowDocPanel(!showDocPanel)}
          >
            <FileText className="h-3 w-3" />
            <span className="hidden sm:inline">{documents.length}</span>
          </Button>
        </div>
      </div>

      {/* Document Panel (inline) */}
      {showDocPanel && (
        <div className="border-b border-border bg-muted/30">
          <div className="max-w-3xl mx-auto px-4 py-3">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Documents
              </h3>
              <div className="flex items-center gap-1">
                {/* Upload target selector */}
                {project && (
                  <div className="flex items-center rounded-md border border-border overflow-hidden mr-2">
                    <button
                      className={cn(
                        "px-2 py-0.5 text-[10px] font-medium transition-colors",
                        uploadTarget === "chat"
                          ? "bg-primary text-primary-foreground"
                          : "hover:bg-muted"
                      )}
                      onClick={() => setUploadTarget("chat")}
                    >
                      This chat
                    </button>
                    <button
                      className={cn(
                        "px-2 py-0.5 text-[10px] font-medium transition-colors",
                        uploadTarget === "project"
                          ? "bg-primary text-primary-foreground"
                          : "hover:bg-muted"
                      )}
                      onClick={() => setUploadTarget("project")}
                    >
                      {project.name}
                    </button>
                  </div>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  className="h-6 text-xs gap-1"
                  onClick={handleFileClick}
                  disabled={isProcessing}
                >
                  <Upload className="h-3 w-3" />
                  Upload
                </Button>
              </div>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx,.txt"
              multiple
              className="hidden"
              onChange={handleFileChange}
            />

            {isProcessing && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground py-2">
                <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                Processing document...
              </div>
            )}

            {processingError && (
              <div className="text-xs text-red-500 bg-red-50 dark:bg-red-950/20 rounded-md p-2 mb-2">
                {processingError}
              </div>
            )}

            {documents.length === 0 ? (
              <p className="text-xs text-muted-foreground py-2">
                No documents yet. Upload files to chat with them.
              </p>
            ) : (
              <div className="space-y-2">
                {/* Project documents */}
                {projectDocs.length > 0 && (
                  <div>
                    <p className="text-[10px] text-muted-foreground font-medium mb-1 flex items-center gap-1">
                      <Folder className="h-3 w-3" />
                      {project?.name} (shared)
                    </p>
                    <div className="space-y-1">
                      {projectDocs.map((doc) => (
                        <DocItem
                          key={doc.id}
                          doc={doc}
                          formatSize={formatSize}
                          onDelete={onDeleteDocument}
                        />
                      ))}
                    </div>
                  </div>
                )}
                {/* Chat documents */}
                {chatDocs.length > 0 && (
                  <div>
                    <p className="text-[10px] text-muted-foreground font-medium mb-1 flex items-center gap-1">
                      <FileText className="h-3 w-3" />
                      This chat
                    </p>
                    <div className="space-y-1">
                      {chatDocs.map((doc) => (
                        <DocItem
                          key={doc.id}
                          doc={doc}
                          formatSize={formatSize}
                          onDelete={onDeleteDocument}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Messages */}
      <ScrollArea className="flex-1">
        <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
          {session.messages.length === 0 && (
            <div className="text-center py-12">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📄</span>
              </div>
              <h3 className="font-medium text-lg mb-2">Start a conversation</h3>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                {project
                  ? `This chat is part of "${project.name}" and can access its shared documents. Upload files using the paperclip icon below.`
                  : "Upload documents using the paperclip icon below, then ask questions about their content."}
              </p>
            </div>
          )}
          {session.messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))}
          {isStreaming && session.messages[session.messages.length - 1]?.role === "assistant" && (
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-current animate-bounce" />
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-current animate-bounce [animation-delay:0.1s]" />
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-current animate-bounce [animation-delay:0.2s]" />
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Input Area - ChatGPT style */}
      <div className="border-t border-border p-4">
        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
          <div className="relative bg-muted rounded-2xl border border-border shadow-sm">
            {/* Textarea */}
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything..."
              className="w-full bg-transparent resize-none border-0 outline-none text-sm px-4 pt-3 pb-2 min-h-[44px] max-h-[200px] placeholder:text-muted-foreground"
              rows={1}
            />

            {/* Bottom toolbar */}
            <div className="flex items-center justify-between px-2 pb-2">
              {/* Left side: file upload */}
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-lg hover:bg-background"
                  onClick={handleFileClick}
                  disabled={isProcessing}
                  title={`Upload document to ${uploadTarget === "project" && project ? project.name : "this chat"}`}
                >
                  <Paperclip className="h-4 w-4 text-muted-foreground" />
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.docx,.txt"
                  multiple
                  className="hidden"
                  onChange={handleFileChange}
                />
                {/* Upload target toggle if in project */}
                {project && (
                  <div className="flex items-center rounded-md border border-border overflow-hidden">
                    <button
                      type="button"
                      className={cn(
                        "px-2 py-1 text-[10px] font-medium transition-colors",
                        uploadTarget === "chat"
                          ? "bg-primary text-primary-foreground"
                          : "hover:bg-muted text-muted-foreground"
                      )}
                      onClick={() => setUploadTarget("chat")}
                      title="Upload to this chat"
                    >
                      Chat
                    </button>
                    <button
                      type="button"
                      className={cn(
                        "px-2 py-1 text-[10px] font-medium transition-colors",
                        uploadTarget === "project"
                          ? "bg-primary text-primary-foreground"
                          : "hover:bg-muted text-muted-foreground"
                      )}
                      onClick={() => setUploadTarget("project")}
                      title={`Upload to ${project.name}`}
                    >
                      {project.name}
                    </button>
                  </div>
                )}
              </div>

              {/* Right side: send/stop button */}
              <div className="flex items-center gap-1">
                {isStreaming ? (
                  <Button
                    type="button"
                    size="icon"
                    variant="destructive"
                    className="h-8 w-8 rounded-lg"
                    onClick={onStopStreaming}
                  >
                    <Square className="h-3.5 w-3.5" />
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    size="icon"
                    className="h-8 w-8 rounded-lg"
                    disabled={!input.trim()}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Document chips below input */}
          {documents.length > 0 && (
            <div className="flex items-center gap-1.5 mt-2 flex-wrap">
              <span className="text-[10px] text-muted-foreground">
                {documents.length} doc{documents.length !== 1 ? "s" : ""} available
              </span>
              {documents.slice(0, 3).map((doc) => (
                <span
                  key={doc.id}
                  className="inline-flex items-center gap-1 text-[10px] bg-muted rounded-full px-2 py-0.5 text-muted-foreground"
                >
                  <FileText className="h-2.5 w-2.5" />
                  <span className="truncate max-w-[80px]">{doc.name}</span>
                </span>
              ))}
              {documents.length > 3 && (
                <span className="text-[10px] text-muted-foreground">
                  +{documents.length - 3} more
                </span>
              )}
            </div>
          )}
        </form>
      </div>
    </div>
  );
}

// Document item in the panel
function DocItem({
  doc,
  formatSize,
  onDelete,
}: {
  doc: Document;
  formatSize: (bytes: number) => string;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="flex items-center gap-2 p-1.5 rounded-md bg-background border border-border hover:bg-muted/50 transition-colors group">
      <div className="w-6 h-6 rounded bg-primary/10 flex items-center justify-center shrink-0">
        <FileText className="w-3 h-3 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium truncate">{doc.name}</p>
        <p className="text-[10px] text-muted-foreground">
          {formatSize(doc.size)} • {doc.chunkCount} chunks
        </p>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="h-5 w-5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={() => onDelete(doc.id)}
      >
        <Trash2 className="h-3 w-3 text-muted-foreground" />
      </Button>
    </div>
  );
}

// Message bubble component
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
      <div className={cn("flex-1 space-y-2 min-w-0", isUser && "text-right")}>
        <div
          className={cn(
            "inline-block rounded-2xl px-4 py-2.5 text-sm max-w-full text-left",
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
