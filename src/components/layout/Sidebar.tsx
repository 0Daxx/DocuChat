import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  MessageSquarePlus,
  PanelLeftClose,
  PanelLeftOpen,
  MessageSquare,
  Trash2,
  Settings,
  FolderPlus,
  FolderOpen,
  Folder,
  ChevronRight,
  ChevronDown,
  MoreHorizontal,
  Link2,
  Unlink,
  Pencil,
} from "lucide-react";
import type { ChatSession, Project } from "@/lib/types";
import { cn, truncateText } from "@/lib/utils";

interface SidebarProps {
  projects: Project[];
  sessions: ChatSession[];
  activeSessionId: string | null;
  activeProjectId: string | null;
  collapsed: boolean;
  onSelectSession: (id: string) => void;
  onSelectProject: (id: string | null) => void;
  onNewChat: (projectId?: string) => void;
  onNewProject: () => void;
  onRenameProject: (id: string, name: string) => void;
  onDeleteProject: (id: string) => void;
  onDeleteSession: (id: string) => void;
  onAttachChat: (chatId: string, projectId: string) => void;
  onDetachChat: (chatId: string) => void;
  onToggleCollapse: () => void;
  onOpenSettings: () => void;
}

export function Sidebar({
  projects,
  sessions,
  activeSessionId,
  activeProjectId,
  collapsed,
  onSelectSession,
  onSelectProject,
  onNewChat,
  onNewProject,
  onRenameProject,
  onDeleteProject,
  onDeleteSession,
  onAttachChat,
  onDetachChat,
  onToggleCollapse,
  onOpenSettings,
}: SidebarProps) {
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [contextMenu, setContextMenu] = useState<{ chatId: string; x: number; y: number } | null>(null);

  // Standalone chats (not in any project)
  const standaloneSessions = sessions.filter(s => !s.projectId);

  const toggleProjectExpanded = (projectId: string) => {
    setExpandedProjects(prev => {
      const next = new Set(prev);
      if (next.has(projectId)) {
        next.delete(projectId);
      } else {
        next.add(projectId);
      }
      return next;
    });
  };

  const startRenameProject = (project: Project) => {
    setEditingProjectId(project.id);
    setEditName(project.name);
  };

  const finishRenameProject = () => {
    if (editingProjectId && editName.trim()) {
      onRenameProject(editingProjectId, editName.trim());
    }
    setEditingProjectId(null);
    setEditName("");
  };

  const handleChatContextMenu = (e: React.MouseEvent, chatId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ chatId, x: e.clientX, y: e.clientY });
  };

  // Close context menu on click outside
  React.useEffect(() => {
    const handleClick = () => setContextMenu(null);
    if (contextMenu) {
      document.addEventListener("click", handleClick);
      return () => document.removeEventListener("click", handleClick);
    }
  }, [contextMenu]);

  return (
    <TooltipProvider delayDuration={0}>
      <div
        className={cn(
          "flex flex-col h-full bg-sidebar border-r border-border transition-all duration-300",
          collapsed ? "w-14" : "w-72"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-2 min-h-12">
          {!collapsed && (
            <div className="flex items-center gap-2 px-2">
              <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-sm">📄</span>
              </div>
              <span className="font-semibold text-sm">DocuChat</span>
            </div>
          )}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={onToggleCollapse}
                className="h-8 w-8 shrink-0"
              >
                {collapsed ? (
                  <PanelLeftOpen className="h-4 w-4" />
                ) : (
                  <PanelLeftClose className="h-4 w-4" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              {collapsed ? "Expand sidebar" : "Collapse sidebar"}
            </TooltipContent>
          </Tooltip>
        </div>

        {/* New Chat Button */}
        <div className="p-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={() => onNewChat()}
                className={cn("w-full justify-start gap-2", collapsed && "justify-center px-0")}
                size={collapsed ? "icon" : "default"}
              >
                <MessageSquarePlus className="h-4 w-4" />
                {!collapsed && <span>New chat</span>}
              </Button>
            </TooltipTrigger>
            {collapsed && (
              <TooltipContent side="right">New chat</TooltipContent>
            )}
          </Tooltip>
        </div>

        <Separator />

        {/* Content: Projects + Chats */}
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            {/* Projects Section */}
            {!collapsed && (
              <div className="space-y-1">
                <div className="flex items-center justify-between px-2 py-1">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Projects
                  </span>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5"
                        onClick={onNewProject}
                      >
                        <FolderPlus className="h-3.5 w-3.5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="right">New project</TooltipContent>
                  </Tooltip>
                </div>

                {projects.length === 0 && (
                  <p className="text-xs text-muted-foreground px-2 py-2">
                    No projects yet
                  </p>
                )}

                {projects.map((project) => {
                  const isExpanded = expandedProjects.has(project.id);
                  const projectChats = sessions.filter(s => s.projectId === project.id);
                  const isActive = activeProjectId === project.id;

                  return (
                    <div key={project.id} className="space-y-0.5">
                      {/* Project header */}
                      <div
                        className={cn(
                          "group flex items-center gap-1 rounded-md px-1 py-1 cursor-pointer hover:bg-accent/50 transition-colors",
                          isActive && "bg-accent"
                        )}
                        onClick={() => {
                          onSelectProject(project.id);
                          toggleProjectExpanded(project.id);
                        }}
                      >
                        <button
                          className="h-5 w-5 flex items-center justify-center shrink-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleProjectExpanded(project.id);
                          }}
                        >
                          {isExpanded ? (
                            <ChevronDown className="h-3 w-3" />
                          ) : (
                            <ChevronRight className="h-3 w-3" />
                          )}
                        </button>
                        <span className="text-sm shrink-0">{project.color}</span>
                        {editingProjectId === project.id ? (
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            onBlur={finishRenameProject}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") finishRenameProject();
                              if (e.key === "Escape") {
                                setEditingProjectId(null);
                                setEditName("");
                              }
                            }}
                            className="flex-1 text-xs bg-background border border-border rounded px-1 py-0.5 outline-none focus:ring-1 focus:ring-ring"
                            autoFocus
                            onClick={(e) => e.stopPropagation()}
                          />
                        ) : (
                          <span className="flex-1 text-xs font-medium truncate">
                            {project.name}
                          </span>
                        )}
                        <span className="text-[10px] text-muted-foreground mr-1">
                          {projectChats.length}
                        </span>
                        {/* Project actions */}
                        <div className="hidden group-hover:flex items-center gap-0.5">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-5 w-5"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onNewChat(project.id);
                                }}
                              >
                                <MessageSquarePlus className="h-3 w-3" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent side="right">Add chat</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-5 w-5"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  startRenameProject(project);
                                }}
                              >
                                <Pencil className="h-3 w-3" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent side="right">Rename</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-5 w-5"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (confirm(`Delete project "${project.name}"? Chats will become standalone.`)) {
                                    onDeleteProject(project.id);
                                  }
                                }}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent side="right">Delete</TooltipContent>
                          </Tooltip>
                        </div>
                      </div>

                      {/* Project chats */}
                      {isExpanded && (
                        <div className="ml-4 space-y-0.5 border-l border-border pl-1">
                          {projectChats.length === 0 && (
                            <p className="text-[10px] text-muted-foreground px-2 py-1">
                              No chats in this project
                            </p>
                          )}
                          {projectChats.map((session) => (
                            <ChatItem
                              key={session.id}
                              session={session}
                              isActive={session.id === activeSessionId}
                              collapsed={false}
                              onSelect={onSelectSession}
                              onDelete={onDeleteSession}
                              onDetach={() => onDetachChat(session.id)}
                              projects={projects}
                              onAttach={onAttachChat}
                              onContextMenu={handleChatContextMenu}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Standalone Chats Section */}
            {!collapsed && (
              <>
                {projects.length > 0 && standaloneSessions.length > 0 && (
                  <Separator className="my-2" />
                )}
                <div className="px-2 py-1">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Chats
                  </span>
                </div>
              </>
            )}

            {standaloneSessions.length === 0 && projects.length === 0 && !collapsed && (
              <p className="text-xs text-muted-foreground text-center py-4">
                No conversations yet
              </p>
            )}

            {standaloneSessions.map((session) => (
              <ChatItem
                key={session.id}
                session={session}
                isActive={session.id === activeSessionId}
                collapsed={collapsed}
                onSelect={onSelectSession}
                onDelete={onDeleteSession}
                onDetach={() => {}}
                projects={projects}
                onAttach={onAttachChat}
                onContextMenu={handleChatContextMenu}
              />
            ))}
          </div>
        </ScrollArea>

        {/* Footer */}
        <Separator />
        <div className="p-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                className={cn("w-full justify-start gap-2", collapsed && "justify-center px-0")}
                size={collapsed ? "icon" : "sm"}
                onClick={onOpenSettings}
              >
                <Settings className="h-4 w-4" />
                {!collapsed && <span className="text-xs">Settings</span>}
              </Button>
            </TooltipTrigger>
            {collapsed && (
              <TooltipContent side="right">Settings</TooltipContent>
            )}
          </Tooltip>
        </div>

        {/* Context Menu */}
        {contextMenu && projects.length > 0 && (
          <div
            className="fixed z-50 bg-popover border border-border rounded-md shadow-md py-1 min-w-[160px]"
            style={{ top: contextMenu.y, left: contextMenu.x }}
          >
            <p className="px-3 py-1 text-xs text-muted-foreground font-medium">
              Attach to project
            </p>
            {projects.map((p) => (
              <button
                key={p.id}
                className="w-full text-left px-3 py-1.5 text-xs hover:bg-accent transition-colors flex items-center gap-2"
                onClick={() => {
                  onAttachChat(contextMenu.chatId, p.id);
                  setContextMenu(null);
                }}
              >
                <span>{p.color}</span>
                <span>{p.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}

// Individual chat item component
interface ChatItemProps {
  session: ChatSession;
  isActive: boolean;
  collapsed: boolean;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onDetach: () => void;
  projects: Project[];
  onAttach: (chatId: string, projectId: string) => void;
  onContextMenu: (e: React.MouseEvent, chatId: string) => void;
}

function ChatItem({
  session,
  isActive,
  collapsed,
  onSelect,
  onDelete,
  onDetach,
  projects,
  onAttach,
  onContextMenu,
}: ChatItemProps) {
  const [showActions, setShowActions] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);

  return (
    <div
      className="group relative"
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => {
        setShowActions(false);
        setShowAttachMenu(false);
      }}
    >
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={isActive ? "secondary" : "ghost"}
            className={cn(
              "w-full justify-start gap-2 h-auto py-1.5 px-2 text-left",
              collapsed && "justify-center px-0"
            )}
            onClick={() => onSelect(session.id)}
            onContextMenu={(e) => onContextMenu(e, session.id)}
          >
            <MessageSquare className="h-3.5 w-3.5 shrink-0" />
            {!collapsed && (
              <span className="text-xs truncate">
                {truncateText(session.title, 24)}
              </span>
            )}
          </Button>
        </TooltipTrigger>
        {collapsed && (
          <TooltipContent side="right">
            {session.title}
          </TooltipContent>
        )}
      </Tooltip>

      {/* Actions */}
      {!collapsed && showActions && (
        <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
          {/* Attach to project button (only for standalone chats) */}
          {!session.projectId && projects.length > 0 && (
            <div className="relative">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowAttachMenu(!showAttachMenu);
                    }}
                  >
                    <Link2 className="h-3 w-3 text-muted-foreground" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">Attach to project</TooltipContent>
              </Tooltip>
              {showAttachMenu && (
                <div className="absolute right-0 top-full mt-1 z-50 bg-popover border border-border rounded-md shadow-md py-1 min-w-[140px]">
                  {projects.map((p) => (
                    <button
                      key={p.id}
                      className="w-full text-left px-2 py-1 text-xs hover:bg-accent transition-colors flex items-center gap-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        onAttach(session.id, p.id);
                        setShowAttachMenu(false);
                      }}
                    >
                      <span>{p.color}</span>
                      <span className="truncate">{p.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
          {/* Detach from project button */}
          {session.projectId && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDetach();
                  }}
                >
                  <Unlink className="h-3 w-3 text-muted-foreground" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">Detach from project</TooltipContent>
            </Tooltip>
          )}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(session.id);
                }}
              >
                <Trash2 className="h-3 w-3 text-muted-foreground" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">Delete</TooltipContent>
          </Tooltip>
        </div>
      )}
    </div>
  );
}
