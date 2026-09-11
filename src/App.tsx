import React, { useState, useEffect, useCallback, useRef } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { ChatWindow } from "@/components/layout/ChatWindow";
import { SettingsDialog } from "@/components/settings/SettingsDialog";
import { DocumentPanel } from "@/components/documents/DocumentPanel";
import {
  loadState,
  saveState,
  saveSession,
  deleteSession,
  saveDocuments,
  saveChunks,
  saveLLMConfig,
  saveSidebarState,
} from "@/lib/storage";
import { parseDocument } from "@/lib/documents/parser";
import { chunkText } from "@/lib/documents/chunker";
import { vectorStore } from "@/lib/documents/vectorStore";
import { streamChatCompletion } from "@/lib/llm/providers";
import { generateId } from "@/lib/utils";
import type {
  AppState,
  ChatSession,
  ChatMessage,
  Document,
  DocumentChunk,
  LLMConfig,
  ChunkSource,
} from "@/lib/types";

export default function App() {
  const [state, setState] = useState<AppState>(loadState);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [documentsOpen, setDocumentsOpen] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingError, setProcessingError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const vectorStoreBuilt = useRef(false);

  // Rebuild vector store when chunks change
  useEffect(() => {
    if (state.chunks.length > 0) {
      vectorStore.buildIndex(state.chunks);
      vectorStoreBuilt.current = true;
    }
  }, [state.chunks]);

  // Persist state changes
  useEffect(() => {
    saveState(state);
  }, [state]);

  const activeSession = state.sessions.find(s => s.id === state.activeSessionId) || null;

  // Create new chat session
  const handleNewChat = useCallback(() => {
    const newSession: ChatSession = {
      id: generateId(),
      title: "New chat",
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messages: [],
      documentIds: state.documents.map(d => d.id),
    };
    setState(prev => ({
      ...prev,
      sessions: [newSession, ...prev.sessions],
      activeSessionId: newSession.id,
    }));
  }, [state.documents]);

  // Select session
  const handleSelectSession = useCallback((id: string) => {
    setState(prev => ({ ...prev, activeSessionId: id }));
  }, []);

  // Delete session
  const handleDeleteSession = useCallback((id: string) => {
    deleteSession(id);
    setState(prev => {
      const sessions = prev.sessions.filter(s => s.id !== id);
      return {
        ...prev,
        sessions,
        activeSessionId: prev.activeSessionId === id
          ? (sessions.length > 0 ? sessions[0].id : null)
          : prev.activeSessionId,
      };
    });
  }, []);

  // Toggle sidebar
  const handleToggleSidebar = useCallback(() => {
    setState(prev => {
      const collapsed = !prev.sidebarCollapsed;
      saveSidebarState(collapsed);
      return { ...prev, sidebarCollapsed: collapsed };
    });
  }, []);

  // Save LLM config
  const handleSaveLLMConfig = useCallback((config: LLMConfig) => {
    saveLLMConfig(config);
    setState(prev => ({ ...prev, llmConfig: config }));
  }, []);

  // Upload documents
  const handleUploadDocuments = useCallback(async (files: FileList) => {
    setIsProcessing(true);
    setProcessingError(null);

    try {
      const newDocuments: Document[] = [];
      const newChunks: DocumentChunk[] = [];

      for (const file of Array.from(files)) {
        const ext = file.name.split(".").pop()?.toLowerCase();
        if (!["pdf", "docx", "txt"].includes(ext || "")) {
          throw new Error(`Unsupported file type: .${ext}. Please upload PDF, DOCX, or TXT files.`);
        }

        // Parse document
        const text = await parseDocument(file);
        if (!text.trim()) {
          throw new Error(`No text could be extracted from ${file.name}`);
        }

        const docId = generateId();
        const chunks = chunkText(text, docId, file.name);

        const doc: Document = {
          id: docId,
          name: file.name,
          type: ext as "pdf" | "docx" | "txt",
          size: file.size,
          uploadedAt: Date.now(),
          chunkCount: chunks.length,
        };

        newDocuments.push(doc);
        newChunks.push(...chunks);
      }

      // Update state
      setState(prev => {
        const documents = [...prev.documents, ...newDocuments];
        const chunks = [...prev.chunks, ...newChunks];
        saveDocuments(documents);
        saveChunks(chunks);
        return { ...prev, documents, chunks };
      });

      // Rebuild vector store
      const allChunks = [...state.chunks, ...newChunks];
      vectorStore.buildIndex(allChunks);
    } catch (error) {
      setProcessingError(error instanceof Error ? error.message : "Failed to process document");
    } finally {
      setIsProcessing(false);
    }
  }, [state.chunks]);

  // Delete document
  const handleDeleteDocument = useCallback((documentId: string) => {
    setState(prev => {
      const documents = prev.documents.filter(d => d.id !== documentId);
      const chunks = prev.chunks.filter(c => c.documentId !== documentId);
      saveDocuments(documents);
      saveChunks(chunks);

      // Rebuild vector store
      if (chunks.length > 0) {
        vectorStore.buildIndex(chunks);
      }

      return { ...prev, documents, chunks };
    });
  }, []);

  // Send message
  const handleSendMessage = useCallback(async (content: string) => {
    if (!activeSession) {
      handleNewChat();
      return;
    }

    // Validate LLM configuration
    if (!state.llmConfig.model) {
      const errorMessage: ChatMessage = {
        id: generateId(),
        role: "assistant",
        content: "⚠️ No model configured. Please go to Settings and connect to your LLM provider to select a model.",
        timestamp: Date.now(),
      };
      const updatedSession: ChatSession = {
        ...activeSession,
        updatedAt: Date.now(),
        messages: [...activeSession.messages, { id: generateId(), role: "user", content, timestamp: Date.now() }, errorMessage],
      };
      setState(prev => ({
        ...prev,
        sessions: prev.sessions.map(s => s.id === updatedSession.id ? updatedSession : s),
      }));
      return;
    }

    // Add user message
    const userMessage: ChatMessage = {
      id: generateId(),
      role: "user",
      content,
      timestamp: Date.now(),
    };

    // Retrieve relevant chunks
    const documentIds = activeSession.documentIds.length > 0
      ? activeSession.documentIds
      : state.documents.map(d => d.id);

    const sources: ChunkSource[] = vectorStore.search(content, 5, documentIds);

    // Create assistant message placeholder
    const assistantMessage: ChatMessage = {
      id: generateId(),
      role: "assistant",
      content: "",
      timestamp: Date.now(),
      sources: sources.length > 0 ? sources : undefined,
    };

    // Update session with user message
    const updatedSession: ChatSession = {
      ...activeSession,
      title: activeSession.messages.length === 0 ? content.slice(0, 50) : activeSession.title,
      updatedAt: Date.now(),
      messages: [...activeSession.messages, userMessage, assistantMessage],
    };

    setState(prev => ({
      ...prev,
      sessions: prev.sessions.map(s => s.id === updatedSession.id ? updatedSession : s),
    }));

    // Stream response
    setIsStreaming(true);
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      // Build conversation history (last N messages for context)
      const historyMessages = activeSession.messages
        .filter(m => m.role !== "system")
        .slice(-10)
        .map(m => ({ role: m.role, content: m.content }));

      historyMessages.push({ role: "user", content });

      let fullContent = "";

      await streamChatCompletion(
        state.llmConfig,
        historyMessages,
        sources,
        (chunk) => {
          fullContent += chunk;
          // Update the assistant message with streamed content
          setState(prev => ({
            ...prev,
            sessions: prev.sessions.map(s => {
              if (s.id !== updatedSession.id) return s;
              const messages = [...s.messages];
              const lastMsg = messages[messages.length - 1];
              if (lastMsg && lastMsg.role === "assistant") {
                messages[messages.length - 1] = { ...lastMsg, content: fullContent };
              }
              return { ...s, messages };
            }),
          }));
        },
        abortController.signal
      );

      // Final save
      const finalSession: ChatSession = {
        ...updatedSession,
        messages: [
          ...updatedSession.messages.slice(0, -1),
          { ...assistantMessage, content: fullContent },
        ],
      };
      saveSession(finalSession);
      setState(prev => ({
        ...prev,
        sessions: prev.sessions.map(s => s.id === finalSession.id ? finalSession : s),
      }));
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        // User cancelled
        const finalSession: ChatSession = {
          ...updatedSession,
          messages: updatedSession.messages.slice(0, -1).concat({
            ...assistantMessage,
            content: assistantMessage.content || "[Response cancelled]",
          }),
        };
        saveSession(finalSession);
        setState(prev => ({
          ...prev,
          sessions: prev.sessions.map(s => s.id === finalSession.id ? finalSession : s),
        }));
      } else {
        // Error - update message with error
        const errorMessage = error instanceof Error ? error.message : "An error occurred";
        const finalSession: ChatSession = {
          ...updatedSession,
          messages: updatedSession.messages.slice(0, -1).concat({
            ...assistantMessage,
            content: `Error: ${errorMessage}\n\nPlease check your LLM settings and try again.`,
          }),
        };
        saveSession(finalSession);
        setState(prev => ({
          ...prev,
          sessions: prev.sessions.map(s => s.id === finalSession.id ? finalSession : s),
        }));
      }
    } finally {
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  }, [activeSession, state.llmConfig, state.documents, handleNewChat]);

  // Stop streaming
  const handleStopStreaming = useCallback(() => {
    abortControllerRef.current?.abort();
  }, []);

  // Create initial session if none exists
  useEffect(() => {
    if (state.sessions.length === 0) {
      handleNewChat();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      {/* Sidebar */}
      <Sidebar
        sessions={state.sessions}
        activeSessionId={state.activeSessionId}
        collapsed={state.sidebarCollapsed}
        onSelectSession={handleSelectSession}
        onNewChat={handleNewChat}
        onDeleteSession={handleDeleteSession}
        onToggleCollapse={handleToggleSidebar}
        onOpenSettings={() => setSettingsOpen(true)}
        onOpenDocuments={() => setDocumentsOpen(true)}
      />

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        {activeSession ? (
          <ChatWindow
            messages={activeSession.messages}
            isStreaming={isStreaming}
            onSendMessage={handleSendMessage}
            onStopStreaming={handleStopStreaming}
            sessionTitle={activeSession.title}
            documentCount={state.documents.length}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <h2 className="text-xl font-semibold mb-2">Welcome to DocuChat</h2>
              <p className="text-muted-foreground">
                Click "New chat" in the sidebar to get started.
              </p>
            </div>
          </div>
        )}
      </main>

      {/* Settings Dialog */}
      <SettingsDialog
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        config={state.llmConfig}
        onSave={handleSaveLLMConfig}
      />

      {/* Document Panel */}
      <DocumentPanel
        open={documentsOpen}
        onOpenChange={setDocumentsOpen}
        documents={state.documents}
        onUpload={handleUploadDocuments}
        onDelete={handleDeleteDocument}
        isProcessing={isProcessing}
        processingError={processingError}
      />
    </div>
  );
}
