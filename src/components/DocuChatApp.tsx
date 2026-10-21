import React, { useState, useEffect, useCallback, useRef } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { ChatWindow } from "@/components/layout/ChatWindow";
import { SettingsDialog } from "@/components/settings/SettingsDialog";
import {
  loadState,
  saveState,
  saveSession,
  saveLLMConfig,
  saveSidebarState,
} from "@/lib/storage";
import { uploadDocument as uploadDocumentApi, askQuestion as askQuestionApi, deleteDocument as deleteDocumentApi } from "@/lib/api";
import { generateId } from "@/lib/utils";
import type {
  AppState,
  ChatSession,
  ChatMessage,
  Document,
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

  useEffect(() => {
    saveState(state);
  }, [state]);

  const activeSession = state.sessions.find(s => s.id === state.activeSessionId) || null;

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
    setState(prev => {
      const projects = prev.projects.filter(p => p.id !== projectId);
      const sessions = prev.sessions.map(s =>
        s.projectId === projectId ? { ...s, projectId: null } : s
      );
      return {
        ...prev,
        projects,
        sessions,
        activeProjectId: prev.activeProjectId === projectId ? null : prev.activeProjectId,
      };
    });
  }, []);

  const handleAttachChatToProject = useCallback((chatId: string, projectId: string) => {
    setState(prev => {
      const projects = prev.projects.map(p => ({
        ...p,
        chatIds: p.chatIds.filter(id => id !== chatId),
      }));
      const updatedProjects = projects.map(p =>
        p.id === projectId
          ? { ...p, chatIds: [...p.chatIds, chatId], updatedAt: Date.now() }
          : p
      );
      const sessions = prev.sessions.map(s =>
        s.id === chatId ? { ...s, projectId } : s
      );
      return { ...prev, projects: updatedProjects, sessions };
    });
  }, []);

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

  const handleSelectSession = useCallback((id: string) => {
    setState(prev => ({ ...prev, activeSessionId: id }));
  }, []);

  const handleSelectProject = useCallback((id: string | null) => {
    setState(prev => ({ ...prev, activeProjectId: id }));
  }, []);

  const handleDeleteSession = useCallback((id: string) => {
    setState(prev => {
      const projects = prev.projects.map(p => ({
        ...p,
        chatIds: p.chatIds.filter(cid => cid !== id),
      }));
      const sessions = prev.sessions.filter(s => s.id !== id);
      return {
        ...prev,
        projects,
        sessions,
        activeSessionId: prev.activeSessionId === id
          ? (sessions.length > 0 ? sessions[0].id : null)
          : prev.activeSessionId,
      };
    });
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

      for (const file of Array.from(files)) {
        const ext = file.name.split(".").pop()?.toLowerCase();
        if (!["pdf", "docx", "pptx", "txt"].includes(ext || "")) {
          throw new Error(`Unsupported file type: .${ext}`);
        }

        // Upload to backend
        const response = await uploadDocumentApi(file);
        
        const doc: Document = {
          id: response.document_id,
          name: file.name,
          type: ext as "pdf" | "docx" | "pptx" | "txt",
          size: file.size,
          uploadedAt: Date.now(),
          chunkCount: response.chunk_count,
          ownerId,
          ownerType,
        };

        newDocuments.push(doc);
      }

      setState(prev => {
        const documents = [...prev.documents, ...newDocuments];
        return { ...prev, documents };
      });
    } catch (error) {
      setProcessingError(error instanceof Error ? error.message : "Failed to process document");
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const handleDeleteDocument = useCallback(async (documentId: string) => {
    try {
      await deleteDocumentApi(documentId);
      setState(prev => {
        const documents = prev.documents.filter(d => d.id !== documentId);
        return { ...prev, documents };
      });
    } catch (error) {
      console.error("Failed to delete document:", error);
    }
  }, []);

  const handleSendMessage = useCallback(async (content: string) => {
    if (!activeSession) {
      handleNewChat();
      return;
    }

    const userMessage: ChatMessage = {
      id: generateId(),
      role: "user",
      content,
      timestamp: Date.now(),
    };

    const assistantMessage: ChatMessage = {
      id: generateId(),
      role: "assistant",
      content: "",
      timestamp: Date.now(),
    };

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

    setIsStreaming(true);

    try {
      // Ask question to backend
      const response = await askQuestionApi(content);
      
      // Convert sources to ChunkSource format
      const sources: ChunkSource[] = response.sources.map(s => ({
        chunkId: `chunk-${s.page_number}-${s.chunk_index}`,
        documentName: "Document", // Backend doesn't return doc name in sources
        content: s.text,
        score: 1.0, // Backend doesn't return score
      }));

      const finalSession: ChatSession = {
        ...updatedSession,
        messages: [
          ...updatedSession.messages.slice(0, -1),
          { ...assistantMessage, content: response.answer, sources },
        ],
      };

      saveSession(finalSession);
      setState(prev => ({
        ...prev,
        sessions: prev.sessions.map(s => s.id === finalSession.id ? finalSession : s),
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An error occurred";
      const finalSession: ChatSession = {
        ...updatedSession,
        messages: [
          ...updatedSession.messages.slice(0, -1),
          { ...assistantMessage, content: `Error: ${errorMessage}` },
        ],
      };
      saveSession(finalSession);
      setState(prev => ({
        ...prev,
        sessions: prev.sessions.map(s => s.id === finalSession.id ? finalSession : s),
      }));
    } finally {
      setIsStreaming(false);
    }
  }, [activeSession, handleNewChat]);

  const handleStopStreaming = useCallback(() => {
    setIsStreaming(false);
  }, []);

  useEffect(() => {
    if (state.sessions.length === 0 && state.projects.length === 0) {
      handleNewChat();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const activeProject = activeSession?.projectId
    ? state.projects.find(p => p.id === activeSession.projectId) || null
    : null;

  const accessibleDocuments = activeSession
    ? state.documents.filter(d => {
        if (d.ownerType === "chat" && d.ownerId === activeSession.id) return true;
        if (d.ownerType === "project" && activeSession.projectId && d.ownerId === activeSession.projectId) return true;
        return false;
      })
    : [];

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

      <SettingsDialog
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        config={state.llmConfig}
        onSave={handleSaveLLMConfig}
      />
    </div>
  );
}
