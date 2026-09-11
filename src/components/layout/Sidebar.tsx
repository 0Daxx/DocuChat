import React from "react";
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
  FileText,
} from "lucide-react";
import type { ChatSession } from "@/lib/types";
import { cn, truncateText } from "@/lib/utils";

interface SidebarProps {
  sessions: ChatSession[];
  activeSessionId: string | null;
  collapsed: boolean;
  onSelectSession: (id: string) => void;
  onNewChat: () => void;
  onDeleteSession: (id: string) => void;
  onToggleCollapse: () => void;
  onOpenSettings: () => void;
  onOpenDocuments: () => void;
}

export function Sidebar({
  sessions,
  activeSessionId,
  collapsed,
  onSelectSession,
  onNewChat,
  onDeleteSession,
  onToggleCollapse,
  onOpenSettings,
  onOpenDocuments,
}: SidebarProps) {
  return (
    <TooltipProvider delayDuration={0}>
      <div
        className={cn(
          "flex flex-col h-full bg-sidebar border-r border-border transition-all duration-300",
          collapsed ? "w-14" : "w-64"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-2 min-h-12">
          {!collapsed && (
            <div className="flex items-center gap-2 px-2">
              <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
                <FileText className="w-4 h-4 text-primary-foreground" />
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
                onClick={onNewChat}
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

        {/* Sessions List */}
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            {sessions.length === 0 && !collapsed && (
              <p className="text-xs text-muted-foreground text-center py-4">
                No conversations yet
              </p>
            )}
            {sessions.map((session) => (
              <div key={session.id} className="group relative">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={session.id === activeSessionId ? "secondary" : "ghost"}
                      className={cn(
                        "w-full justify-start gap-2 h-auto py-2 px-2 text-left",
                        collapsed && "justify-center px-0"
                      )}
                      onClick={() => onSelectSession(session.id)}
                    >
                      <MessageSquare className="h-4 w-4 shrink-0" />
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
                {!collapsed && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteSession(session.id);
                    }}
                  >
                    <Trash2 className="h-3 w-3 text-muted-foreground" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>

        {/* Footer */}
        <Separator />
        <div className="p-2 flex flex-col gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                className={cn("w-full justify-start gap-2", collapsed && "justify-center px-0")}
                size={collapsed ? "icon" : "sm"}
                onClick={onOpenDocuments}
              >
                <FileText className="h-4 w-4" />
                {!collapsed && <span className="text-xs">Documents</span>}
              </Button>
            </TooltipTrigger>
            {collapsed && (
              <TooltipContent side="right">Documents</TooltipContent>
            )}
          </Tooltip>
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
      </div>
    </TooltipProvider>
  );
}
