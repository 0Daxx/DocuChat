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
  saveProject,
  deleteProject,
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

  useEffect(() => {
    if (state.chunks.length > 0) {
      vectorStore.buildIndex(state.chunks);
    }
  }, [state.chunks]);

  useEffect(() => {
    saveState(state);
  }, [state]);

  const activeSession = state.sessions.find(s => s.id === state.activeSessionId) || null;

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

  const handleRenameProject = useCallback((projectId: string, name: string) => {
    setState(prev => ({
      ...prev,
      projects: prev.projects.map(p =>
        p.id === projectId ? { ...p, name, updatedAt: Date.now() } : p
      ),
    }));
  }, []);

  const handleDeleteProject = useCallback((projectId: string) => {
    deleteProject(projectId);
    setState(prev => {
      const projects = prev.projects.filter(p => p.id !== projectId);
      const documents = prev.documents.filter(d => !(d.ownerType === "project" && d.ownerId === projectId));
      const chunks = prev.chunks.filter(c => documents.find(d => d.id === c.documentId));
      const sessions = prev.sessions.map(s =>
        s.projectId === projectId ? { ...s, projectId: null } : s
      );
      return { ...prev, projects, documents, chunks, sessions, activeProjectId: prev.activeProjectId === projectId ? null : prev.activeProjectId };
    });
    setTimeout(() => {
      const currentState = loadState();
      if (currentState.chunks.length > 0) vectorStore.buildIndex(currentState.chunks);
    }, 0);
  }, []);

  const handleAttachChatToProject = useCallback((chatId: string, projectId: string) => {
    setState(prev => {
      const projects = prev.projects.map(p => ({ ...p, chatIds: p.chatIds.filter(id => id !== chatId) }));
      const updatedProjects = projects.map(p =>
        p.id === projectId ? { ...p, chatIds: [...p.chatIds, chatId], updatedAt: Date.now() } : p
      );
      const sessions = prev.sessions.map(s => s.id === chatId ? { ...s, projectId } : s);
      return { ...prev, projects: updatedProjects, sessions };
    });
  }, []);

  const handleDetachChatFromProject = useCallback((chatId: string) => {
    setState(prev => {
      const projects = prev.projects.map(p => ({ ...p, chatIds: p.chatIds.filter(id => id !== chatId) }));
      const sessions = prev.sessions.map(s => s.id === chatId ? { ...s, projectId: null } : s);
      return { ...prev, projects, sessions };
    });
  }, []);

  const handleSelectSession = useCallback((id: string) => {
    setState(prev => ({ ...prev, activeSessionId: id }));
  }, []);

  const handleSelectProject = useCallback((id: string | null) => {
    setState(prev => ({ ...prev, activeProjectId: id }));
  }, []);

  const handleDeleteSession = useCallback((id: string) => {
    setState(prev => {
      const projects = prev.projects.map(p => ({ ...p, chatIds: p.chatIds.filter(cid => cid !== id) }));
      const sessions = prev.sessions.filter(s => s.id !== id);
      const documents = prev.documents.filter(d => !(d.ownerType === "chat" && d.ownerId === id));
      const chunks = prev.chunks.filter(c => documents.find(d => d.id === c.documentId));
      return {
        ...prev, projects, sessions, documents, chunks,
        activeSessionId: prev.activeSessionId === id ? (sessions.length > 0 ? sessions[0].id : null) : prev.activeSessionId,
      };
    });
    setTimeout(() => {
      const currentState = loadState();
      if (currentState.chunks.length > 0) vectorStore.buildIndex(currentState.chunks);
    }, 0);
  }, []);

  const handleToggleSidebar = useCallback(() => {
    setState(prev => {
      const collapsed = !prev.sidebarCollapsed;
      saveSidebarState(collapsed);
      return { ...prev, sidebarCollapsed: collapsed };
    });
  }, []);

  const handleSaveLLMConfig = useCallback((config: LLMConfig) => {
    saveLLMConfig(config);
    setState(prev => ({ ...prev, llmConfig: config }));
  }, []);

  const handleUploadDocuments = useCallback(async (files: FileList, ownerId: string, ownerType: DocumentOwnerType) => {
    setIsProcessing(true);
    setProcessingError(null);
    try {
      const newDocuments: Document[] = [];
      const newChunks: DocumentChunk[] = [];
      for (const file of Array.from(files)) {
        const ext = file.name.split(".").pop()?.toLowerCase();
        if (!["pdf", "docx", "txt"].includes(ext || "")) {
          throw new Error(`Unsupported file type: .${ext}`);
        }
        const text = await parseDocument(file);
        if (!text.trim()) throw new Error(`No text extracted from ${file.name}`);
        const docId = generateId();
        const chunks = chunkText(text, docId, file.name);
        newDocuments.push({
          id: docId, name: file.name, type: ext as "pdf" | "docx" | "txt",
          size: file.size, uploadedAt: Date.now(), chunkCount: chunks.length, ownerId, ownerType,
        });
        newChunks.push(...chunks);
      }
      setState(prev => {
        const documents = [...prev.documents, ...newDocuments];
        const chunks = [...prev.chunks, ...newChunks];
        saveDocuments(documents);
        saveChunks(chunks);
        return { ...prev, documents, chunks };
      });
      vectorStore.buildIndex([...state.chunks, ...newChunks]);
    } catch (error) {
      setProcessingError(error instanceof Error ? error.message : "Failed to process document");
    } finally {
      setIsProcessing(false);
    }
  }, [state.chunks]);

  const handleDeleteDocument = useCallback((documentId: string) => {
    setState(prev => {
      const documents = prev.documents.filter(d => d.id !== documentId);
      const chunks = prev.chunks.filter(c => c.documentId !== documentId);
      saveDocuments(documents);
      saveChunks(chunks);
      if (chunks.length > 0) vectorStore.buildIndex(chunks);
      return { ...prev, documents, chunks };
    });
  }, []);

  const handleSendMessage = useCallback(async (content: string) => {
    if (!activeSession) { handleNewChat(); return; }
    if (!state.llmConfig.model) {
      const errorMessage: ChatMessage = {
        id: generateId(), role: "assistant",
        content: "⚠️ No model configured. Please go to Settings and connect to your LLM provider.",
        timestamp: Date.now(),
      };
      const updatedSession: ChatSession = {
        ...activeSession, updatedAt: Date.now(),
        messages: [...activeSession.messages, { id: generateId(), role: "user", content, timestamp: Date.now() }, errorMessage],
      };
      setState(prev => ({ ...prev, sessions: prev.sessions.map(s => s.id === updatedSession.id ? updatedSession : s) }));
      return;
    }

    const userMessage: ChatMessage = { id: generateId(), role: "user", content, timestamp: Date.now() };
    const documentIds = getChatDocumentIds(activeSession);
    const sources: ChunkSource[] = vectorStore.search(content, 5, documentIds);
    const assistantMessage: ChatMessage = {
      id: generateId(), role: "assistant", content: "", timestamp: Date.now(),
      sources: sources.length > 0 ? sources : undefined,
    };

    const updatedSession: ChatSession = {
      ...activeSession,
      title: activeSession.messages.length === 0 ? content.slice(0, 50) : activeSession.title,
      updatedAt: Date.now(),
      messages: [...activeSession.messages, userMessage, assistantMessage],
    };

    setState(prev => ({ ...prev, sessions: prev.sessions.map(s => s.id === updatedSession.id ? updatedSession : s) }));

    setIsStreaming(true);
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      const historyMessages = activeSession.messages.filter(m => m.role !== "system").slice(-10).map(m => ({ role: m.role, content: m.content }));
      historyMessages.push({ role: "user", content });
      let fullContent = "";

      await streamChatCompletion(state.llmConfig, historyMessages, sources, (chunk) => {
        fullContent += chunk;
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
      }, abortController.signal);

      const finalSession: ChatSession = {
        ...updatedSession,
        messages: [...updatedSession.messages.slice(0, -1), { ...assistantMessage, content: fullContent }],
      };
      saveSession(finalSession);
      setState(prev => ({ ...prev, sessions: prev.sessions.map(s => s.id === finalSession.id ? finalSession : s) }));
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        const finalSession: ChatSession = {
          ...updatedSession,
          messages: updatedSession.messages.slice(0, -1).concat({ ...assistantMessage, content: assistantMessage.content || "[Response cancelled]" }),
        };
        saveSession(finalSession);
        setState(prev => ({ ...prev, sessions: prev.sessions.map(s => s.id === finalSession.id ? finalSession : s) }));
      } else {
        const errorMessage = error instanceof Error ? error.message : "An error occurred";
        const finalSession: ChatSession = {
          ...updatedSession,
          messages: updatedSession.messages.slice(0, -1).concat({ ...assistantMessage, content: `Error: ${errorMessage}` }),
        };
        saveSession(finalSession);
        setState(prev => ({ ...prev, sessions: prev.sessions.map(s => s.id === finalSession.id ? finalSession : s) }));
      }
    } finally {
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  }, [activeSession, state.llmConfig, getChatDocumentIds, handleNewChat]);

  const handleStopStreaming = useCallback(() => { abortControllerRef.current?.abort(); }, []);

  useEffect(() => {
    if (state.sessions.length === 0 && state.projects.length === 0) handleNewChat();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const activeProject = activeSession?.projectId ? state.projects.find(p => p.id === activeSession.projectId) || null : null;
  const accessibleDocuments = activeSession ? state.documents.filter(d => {
    if (d.ownerType === "chat" && d.ownerId === activeSession.id) return true;
    if (d.ownerType === "project" && activeSession.projectId && d.ownerId === activeSession.projectId) return true;
    return false;
  }) : [];

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
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
      <main className="flex-1 flex flex-col min-w-0">
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
              <p className="text-muted-foreground">Click "New chat" in the sidebar to get started.</p>
            </div>
          </div>
        )}
      </main>
      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} config={state.llmConfig} onSave={handleSaveLLMConfig} />
    </div>
  );
}
