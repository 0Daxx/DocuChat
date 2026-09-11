import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LLM_PROVIDERS, testConnection } from "@/lib/llm/providers";
import type { LLMConfig, LLMProviderType } from "@/lib/types";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  config: LLMConfig;
  onSave: (config: LLMConfig) => void;
}

export function SettingsDialog({ open, onOpenChange, config, onSave }: SettingsDialogProps) {
  const [localConfig, setLocalConfig] = useState<LLMConfig>(config);
  const [connectionStatus, setConnectionStatus] = useState<"idle" | "testing" | "success" | "error">("idle");

  useEffect(() => {
    setLocalConfig(config);
  }, [config]);

  const handleProviderChange = (providerId: LLMProviderType) => {
    const provider = LLM_PROVIDERS.find(p => p.id === providerId);
    if (provider) {
      setLocalConfig({
        ...localConfig,
        provider: providerId,
        baseUrl: provider.defaultBaseUrl,
        model: provider.models[0],
      });
    }
  };

  const handleTestConnection = async () => {
    setConnectionStatus("testing");
    const success = await testConnection(localConfig);
    setConnectionStatus(success ? "success" : "error");
    setTimeout(() => setConnectionStatus("idle"), 3000);
  };

  const handleSave = () => {
    onSave(localConfig);
    onOpenChange(false);
  };

  const currentProvider = LLM_PROVIDERS.find(p => p.id === localConfig.provider);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>Configure your LLM provider and model settings.</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="llm" className="w-full">
          <TabsList className="w-full">
            <TabsTrigger value="llm" className="flex-1">LLM Provider</TabsTrigger>
            <TabsTrigger value="about" className="flex-1">About</TabsTrigger>
          </TabsList>

          <TabsContent value="llm" className="space-y-4 mt-4">
            {/* Provider Selection */}
            <div className="space-y-2">
              <Label>Provider</Label>
              <Select
                value={localConfig.provider}
                onValueChange={(v) => handleProviderChange(v as LLMProviderType)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LLM_PROVIDERS.map((provider) => (
                    <SelectItem key={provider.id} value={provider.id}>
                      {provider.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {currentProvider && (
                <p className="text-xs text-muted-foreground">
                  {currentProvider.description}
                </p>
              )}
            </div>

            {/* API Key */}
            {currentProvider?.requiresApiKey && (
              <div className="space-y-2">
                <Label>API Key</Label>
                <Input
                  type="password"
                  placeholder="Enter your API key..."
                  value={localConfig.apiKey || ""}
                  onChange={(e) => setLocalConfig({ ...localConfig, apiKey: e.target.value })}
                />
              </div>
            )}

            {/* Base URL */}
            <div className="space-y-2">
              <Label>Base URL</Label>
              <Input
                value={localConfig.baseUrl}
                onChange={(e) => setLocalConfig({ ...localConfig, baseUrl: e.target.value })}
                placeholder="https://api.provider.com/v1"
              />
            </div>

            {/* Model */}
            <div className="space-y-2">
              <Label>Model</Label>
              {currentProvider && currentProvider.models.length > 1 ? (
                <Select
                  value={localConfig.model}
                  onValueChange={(v) => setLocalConfig({ ...localConfig, model: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {currentProvider.models.map((model) => (
                      <SelectItem key={model} value={model}>
                        {model}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  value={localConfig.model}
                  onChange={(e) => setLocalConfig({ ...localConfig, model: e.target.value })}
                  placeholder="Model name"
                />
              )}
            </div>

            {/* Temperature */}
            <div className="space-y-2">
              <Label>Temperature: {localConfig.temperature}</Label>
              <input
                type="range"
                min="0"
                max="2"
                step="0.1"
                value={localConfig.temperature}
                onChange={(e) => setLocalConfig({ ...localConfig, temperature: parseFloat(e.target.value) })}
                className="w-full"
              />
            </div>

            {/* Max Tokens */}
            <div className="space-y-2">
              <Label>Max Tokens</Label>
              <Input
                type="number"
                value={localConfig.maxTokens}
                onChange={(e) => setLocalConfig({ ...localConfig, maxTokens: parseInt(e.target.value) || 4096 })}
                min={100}
                max={32000}
              />
            </div>

            {/* Test Connection */}
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleTestConnection} disabled={connectionStatus === "testing"}>
                {connectionStatus === "testing" ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-1" />
                ) : null}
                Test Connection
              </Button>
              {connectionStatus === "success" && (
                <span className="text-xs text-green-500 flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" /> Connected
                </span>
              )}
              {connectionStatus === "error" && (
                <span className="text-xs text-red-500 flex items-center gap-1">
                  <XCircle className="h-3 w-3" /> Failed
                </span>
              )}
            </div>
          </TabsContent>

          <TabsContent value="about" className="space-y-3 mt-4">
            <div className="text-sm space-y-2">
              <p><strong>DocuChat MVP</strong></p>
              <p className="text-muted-foreground">
                An AI-powered document chat service that supports RAG (Retrieval Augmented Generation) 
                with multiple LLM providers.
              </p>
              <p className="text-muted-foreground">
                <strong>Supported providers:</strong> Groq, Cerebras, LM Studio, llama.cpp
              </p>
              <p className="text-muted-foreground">
                <strong>Supported formats:</strong> PDF, DOCX, TXT
              </p>
              <p className="text-xs text-muted-foreground mt-4">
                Built with React, TypeScript, Tailwind CSS, and Shadcn UI.
              </p>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave}>Save</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
