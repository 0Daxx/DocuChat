import React, { useState, useEffect, useCallback, useRef } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { ChatWindow } from "@/components/layout/ChatWindow";
import { SettingsDialog } from "@/components/settings/SettingsDialog";
import {
  loadState,
  saveState,
  saveSession,
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
  Project,
  DocumentOwnerType,
} from "@/lib/types";

const PROJECT_COLORS = ["📁", "📂", "🗂️", "📚", "💼", "🔬", "🎯", "⚡", "🌟", "🔧"];

export function DocuChatApp() {
  const [state, setState] = useState<AppState>(loadState);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingError, setProcessingError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Rebuild vector store when chunks change
  useEffect(() => {
    if (state.chunks.length > 0) {
      vectorStore.buildIndex(state.chunks);
    }
  }, [state.chunks]);

  // Persist state changes
  useEffect(() => {
    saveState(state);
  }, [state]);

  const activeSession = state.sessions.find(s => s.id === state.activeSessionId) || null;

  // Get documents accessible to a chat (chat's own + project's if in project)
  const getChatDocumentIds = useCallback((session: ChatSession): string[] => {
    const chatDocs = state.documents
      .filter(d => d.ownerType === "chat" && d.ownerId === session.id)
      .map(d => d.id);

    if (session.projectId) {
      const projectDocs = state.documents
        .filter(d => d.ownerType === "project" && d.ownerId === session.projectId)
        .map(d => d.id);
      return [...chatDocs, ...projectDocs];
    }
    return chatDocs;
  }, [state.documents]);

  // Create new chat session
  const handleNewChat = useCallback((projectId?: string) => {
    const newSession: ChatSession = {
      id: generateId(),
      title: "New chat",
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messages: [],
      projectId: projectId || null,
    };

    setState(prev => {
      let projects = prev.projects;
      if (projectId) {
        projects = prev.projects.map(p =>
          p.id === projectId
            ? { ...p, chatIds: [...p.chatIds, newSession.id], updatedAt: Date.now() }
            : p
        );
      }
      return {
        ...prev,
        sessions: [newSession, ...prev.sessions],
        activeSessionId: newSession.id,
        projects,
      };
    });
  }, []);

  // Create new project
  const handleNewProject = useCallback(() => {
    const colorIndex = state.projects.length % PROJECT_COLORS.length;
    const newProject: Project = {
      id: generateId(),
      name: `Project ${state.projects.length + 1}`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      chatIds: [],
      color: PROJECT_COLORS[colorIndex],
    };
    setState(prev => ({
      ...prev,
      projects: [newProject, ...prev.projects],
      activeProjectId: newProject.id,
    }));
  }, [state.projects.length]);

  // Rename project
  const handleRenameProject = useCallback((projectId: string, name: string) => {
    setState(prev => ({
      ...prev,
      projects: prev.projects.map(p =>
        p.id === projectId ? { ...p, name, updatedAt: Date.now() } : p
      ),
    }));
  }, []);

  // Delete project
  const handleDeleteProject = useCallback((projectId: string) => {
    setState(prev => {
      const projects = prev.projects.filter(p => p.id !== projectId);
      // Remove project-owned documents and chunks
      const documents = prev.documents.filter(d => !(d.ownerType === "project" && d.ownerId === projectId));
      const chunks = prev.chunks.filter(c => documents.find(d => d.id === c.documentId));
      // Detach chats
      const sessions = prev.sessions.map(s =>
        s.projectId === projectId ? { ...s, projectId: null } : s
      );
      return {
        ...prev,
        projects,
        documents,
        chunks,
        sessions,
        activeProjectId: prev.activeProjectId === projectId ? null : prev.activeProjectId,
      };
    });
    // Rebuild vector store
    setTimeout(() => {
      const currentState = loadState();
      if (currentState.chunks.length > 0) {
        vectorStore.buildIndex(currentState.chunks);
      }
    }, 0);
  }, []);

  // Attach chat to project
  const handleAttachChatToProject = useCallback((chatId: string, projectId: string) => {
    setState(prev => {
      // Remove from any existing project
      const projects = prev.projects.map(p => ({
        ...p,
        chatIds: p.chatIds.filter(id => id !== chatId),
      }));
      // Add to new project
      const updatedProjects = projects.map(p =>
        p.id === projectId
          ? { ...p, chatIds: [...p.chatIds, chatId], updatedAt: Date.now() }
          : p
      );
      // Update session
      const sessions = prev.sessions.map(s =>
        s.id === chatId ? { ...s, projectId } : s
      );
      return { ...prev, projects: updatedProjects, sessions };
    });
  }, []);

  // Detach chat from project
  const handleDetachChatFromProject = useCallback((chatId: string) => {
    setState(prev => {
      const projects = prev.projects.map(p => ({
        ...p,
        chatIds: p.chatIds.filter(id => id !== chatId),
      }));
      const sessions = prev.sessions.map(s =>
        s.id === chatId ? { ...s, projectId: null } : s
      );
      return { ...prev, projects, sessions };
    });
  }, []);

  // Select session
  const handleSelectSession = useCallback((id: string) => {
    setState(prev => ({ ...prev, activeSessionId: id }));
  }, []);

  // Select project (for sidebar navigation)
  const handleSelectProject = useCallback((id: string | null) => {
    setState(prev => ({ ...prev, activeProjectId: id }));
  }, []);

  // Delete session
  const handleDeleteSession = useCallback((id: string) => {
    setState(prev => {
      const projects = prev.projects.map(p => ({
        ...p,
        chatIds: p.chatIds.filter(cid => cid !== id),
      }));
      const sessions = prev.sessions.filter(s => s.id !== id);
      // Remove chat-owned documents and chunks
      const documents = prev.documents.filter(d => !(d.ownerType === "chat" && d.ownerId === id));
      const chunks = prev.chunks.filter(c => documents.find(d => d.id === c.documentId));
      return {
        ...prev,
        projects,
        sessions,
        documents,
        chunks,
        activeSessionId: prev.activeSessionId === id
          ? (sessions.length > 0 ? sessions[0].id : null)
          : prev.activeSessionId,
      };
    });
    // Rebuild vector store
    setTimeout(() => {
      const currentState = loadState();
      if (currentState.chunks.length > 0) {
        vectorStore.buildIndex(currentState.chunks);
      }
    }, 0);
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

  // Upload documents for a specific owner (chat or project)
  const handleUploadDocuments = useCallback(async (files: FileList, ownerId: string, ownerType: DocumentOwnerType) => {
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
          ownerId,
          ownerType,
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
    if (!state.llmConfig.model || state.llmConfig.model.trim() === "") {
      const errorMessage: ChatMessage = {
        id: generateId(),
        role: "assistant",
        content: `⚠️ **No model configured**\n\nPlease configure your LLM settings:\n\n1. Click the **Settings** icon (⚙️) in the sidebar\n2. Select a provider (Groq or Cerebras)\n3. Click **"Connect & Fetch Models"**\n4. Select a model from the dropdown (or use the default)\n5. Click **Save**\n\nThen try sending your message again.`,
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

    // Check if this is a regeneration request
    const regenerateMatch = content.match(/^\[REGENERATE:([^\]]+)\](.*)$/);
    const isRegeneration = !!regenerateMatch;
    const regenerateMessageId = regenerateMatch?.[1];
    const actualContent = regenerateMatch ? regenerateMatch[2] : content;

    const userMessage: ChatMessage = { id: generateId(), role: "user", content: actualContent, timestamp: Date.now() };
    const documentIds = getChatDocumentIds(activeSession);
    const sources: ChunkSource[] = vectorStore.search(actualContent, 5, documentIds);
    const assistantMessage: ChatMessage = {
      id: generateId(), role: "assistant", content: "", timestamp: Date.now(),
      sources: sources.length > 0 ? sources : undefined,
    };

    // For regeneration, replace the previous assistant message
    let updatedMessages = [...activeSession.messages];
    if (isRegeneration && regenerateMessageId) {
      const msgIndex = updatedMessages.findIndex(m => m.id === regenerateMessageId);
      if (msgIndex !== -1) {
        updatedMessages[msgIndex] = assistantMessage;
      }
    } else {
      updatedMessages.push(userMessage, assistantMessage);
    }

    const updatedSession: ChatSession = {
      ...activeSession,
      title: activeSession.messages.length === 0 ? actualContent.slice(0, 50) : activeSession.title,
      updatedAt: Date.now(),
      messages: updatedMessages,
    };

    setState(prev => ({ ...prev, sessions: prev.sessions.map(s => s.id === updatedSession.id ? updatedSession : s) }));

    setIsStreaming(true);
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      const historyMessages = activeSession.messages.filter(m => m.role !== "system").slice(-10).map(m => ({ role: m.role, content: m.content }));
      historyMessages.push({ role: "user", content: actualContent });
      let fullContent = "";

      await streamChatCompletion(state.llmConfig, historyMessages, sources, (chunk) => {
        fullContent += chunk;
        setState(prev => ({
          ...prev,
          sessions: prev.sessions.map(s => {
            if (s.id !== updatedSession.id) return s;
            const messages = [...s.messages];
            const targetIndex = isRegeneration && regenerateMessageId 
              ? messages.findIndex(m => m.id === regenerateMessageId)
              : messages.findIndex(m => m.id === assistantMessage.id);
            if (targetIndex !== -1 && messages[targetIndex]?.role === "assistant") {
              messages[targetIndex] = { ...messages[targetIndex], content: fullContent };
            }
            return { ...s, messages };
          }),
        }));
      }, abortController.signal);

      // Finalize the session with the complete response
      const finalMessages = [...updatedSession.messages];
      const targetIndex = isRegeneration && regenerateMessageId 
        ? finalMessages.findIndex(m => m.id === regenerateMessageId)
        : finalMessages.findIndex(m => m.id === assistantMessage.id);
      
      if (targetIndex !== -1) {
        finalMessages[targetIndex] = { ...finalMessages[targetIndex], content: fullContent };
      }

      const finalSession: ChatSession = {
        ...updatedSession,
        messages: finalMessages,
      };
      saveSession(finalSession);
      setState(prev => ({ ...prev, sessions: prev.sessions.map(s => s.id === finalSession.id ? finalSession : s) }));
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        const finalMessages = [...updatedSession.messages];
        const targetIndex = isRegeneration && regenerateMessageId 
          ? finalMessages.findIndex(m => m.id === regenerateMessageId)
          : finalMessages.findIndex(m => m.id === assistantMessage.id);
        
        if (targetIndex !== -1) {
          finalMessages[targetIndex] = { ...finalMessages[targetIndex], content: finalMessages[targetIndex].content || "[Response cancelled]" };
        }

        const finalSession: ChatSession = {
          ...updatedSession,
          messages: finalMessages,
        };
        saveSession(finalSession);
        setState(prev => ({ ...prev, sessions: prev.sessions.map(s => s.id === finalSession.id ? finalSession : s) }));
      } else {
        const errorMessage = error instanceof Error ? error.message : "An error occurred";
        const finalMessages = [...updatedSession.messages];
        const targetIndex = isRegeneration && regenerateMessageId 
          ? finalMessages.findIndex(m => m.id === regenerateMessageId)
          : finalMessages.findIndex(m => m.id === assistantMessage.id);
        
        if (targetIndex !== -1) {
          finalMessages[targetIndex] = { ...finalMessages[targetIndex], content: `Error: ${errorMessage}` };
        }

        const finalSession: ChatSession = {
          ...updatedSession,
          messages: finalMessages,
        };
        saveSession(finalSession);
        setState(prev => ({ ...prev, sessions: prev.sessions.map(s => s.id === finalSession.id ? finalSession : s) }));
      }
    } finally {
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  }, [activeSession, state.llmConfig, getChatDocumentIds, handleNewChat]);

  // Stop streaming
  const handleStopStreaming = useCallback(() => {
    abortControllerRef.current?.abort();
  }, []);

  // Create initial session if none exists
  useEffect(() => {
    if (state.sessions.length === 0 && state.projects.length === 0) {
      handleNewChat();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Get active project
  const activeProject = activeSession?.projectId
    ? state.projects.find(p => p.id === activeSession.projectId) || null
    : null;

  // Get documents accessible in current chat context
  const accessibleDocuments = activeSession
    ? state.documents.filter(d => {
        if (d.ownerType === "chat" && d.ownerId === activeSession.id) return true;
        if (d.ownerType === "project" && activeSession.projectId && d.ownerId === activeSession.projectId) return true;
        return false;
      })
    : [];

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      {/* Sidebar */}
      <Sidebar
        projects={state.projects}
        sessions={state.sessions}
        activeSessionId={state.activeSessionId}
        activeProjectId={state.activeProjectId}
        collapsed={state.sidebarCollapsed}
        onSelectSession={handleSelectSession}
        onSelectProject={handleSelectProject}
        onNewChat={handleNewChat}
        onNewProject={handleNewProject}
        onRenameProject={handleRenameProject}
        onDeleteProject={handleDeleteProject}
        onDeleteSession={handleDeleteSession}
        onAttachChat={handleAttachChatToProject}
        onDetachChat={handleDetachChatFromProject}
        onToggleCollapse={handleToggleSidebar}
        onOpenSettings={() => setSettingsOpen(true)}
      />

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Configuration Warning Banner */}
        {(!state.llmConfig.model || state.llmConfig.model.trim() === "") && (
          <div className="bg-orange-50 dark:bg-orange-950/20 border-b border-orange-200 dark:border-orange-900 px-4 py-3">
            <div className="flex items-start gap-3 max-w-3xl mx-auto">
              <div className="text-orange-600 dark:text-orange-400 mt-0.5">⚠️</div>
              <div className="flex-1 text-sm">
                <p className="font-medium text-orange-900 dark:text-orange-200 mb-1">
                  LLM Not Configured
                </p>
                <p className="text-orange-700 dark:text-orange-300 text-xs">
                  Please configure your LLM provider in Settings to start chatting. 
                  <button 
                    onClick={() => setSettingsOpen(true)}
                    className="underline font-medium ml-1 hover:no-underline"
                  >
                    Open Settings →
                  </button>
                </p>
              </div>
            </div>
          </div>
        )}
        
        {activeSession ? (
          <ChatWindow
            session={activeSession}
            project={activeProject}
            documents={accessibleDocuments}
            isStreaming={isStreaming}
            isProcessing={isProcessing}
            processingError={processingError}
            onSendMessage={handleSendMessage}
            onStopStreaming={handleStopStreaming}
            onUploadDocuments={handleUploadDocuments}
            onDeleteDocument={handleDeleteDocument}
            projects={state.projects}
            onAttachToProject={handleAttachChatToProject}
            onDetachFromProject={handleDetachChatFromProject}
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
    </div>
  );
}
