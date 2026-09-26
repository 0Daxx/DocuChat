import React, { useState, useEffect, useCallback } from "react";
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
import { testConnection, fetchAvailableModels, LLM_PROVIDERS } from "@/lib/llm/providers";
import { getPreferredKey } from "@/lib/storage";
import type { LLMConfig, LLMProviderType } from "@/lib/types";
import { CheckCircle, XCircle, Loader2, RefreshCw } from "lucide-react";

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  config: LLMConfig;
  onSave: (config: LLMConfig) => void;
}

export function SettingsDialog({ open, onOpenChange, config, onSave }: SettingsDialogProps) {
  const [localConfig, setLocalConfig] = useState<LLMConfig>(config);
  const [connectionStatus, setConnectionStatus] = useState<"idle" | "testing" | "success" | "error">("idle");
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [modelError, setModelError] = useState<string | null>(null);

  useEffect(() => {
    setLocalConfig(config);
  }, [config]);

  // When dialog opens, try to fetch models with current config
  useEffect(() => {
    if (open) {
      handleFetchModels(config);
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleProviderChange = useCallback((providerId: LLMProviderType) => {
    const provider = LLM_PROVIDERS.find(p => p.id === providerId);
    if (provider) {
      // Restore saved API key for this provider if available
      const isLocal = providerId === "lmstudio" || providerId === "llamacpp";
      const preferredKey = getPreferredKey(providerId);
      const restoredApiKey = isLocal ? "" : (preferredKey?.key || "");

      const newConfig = {
        ...localConfig,
        provider: providerId,
        baseUrl: provider.defaultBaseUrl,
        model: "", // Will be populated after fetching models
        apiKey: restoredApiKey,
      };
      setLocalConfig(newConfig);
      setAvailableModels([]);
      setConnectionStatus("idle");
      setModelError(null);
      // Auto-fetch models for the new provider
      handleFetchModels(newConfig);
    }
  }, [localConfig]);

  const handleFetchModels = async (cfg: LLMConfig) => {
    setIsLoadingModels(true);
    setModelError(null);
    try {
      const result = await testConnection(cfg);
      if (result.success) {
        setAvailableModels(result.models);
        setConnectionStatus("success");
        // Auto-select first model if current model is empty or not in list
        if (result.models.length > 0) {
          setLocalConfig(prev => {
            if (!prev.model || !result.models.includes(prev.model)) {
              return { ...prev, model: result.models[0] };
            }
            return prev;
          });
        }
      } else {
        setAvailableModels([]);
        setConnectionStatus("error");
      }
    } catch (err) {
      setAvailableModels([]);
      setConnectionStatus("error");
      setModelError(err instanceof Error ? err.message : "Connection failed");
    } finally {
      setIsLoadingModels(false);
    }
  };

  const handleTestConnection = async () => {
    setConnectionStatus("testing");
    setModelError(null);
    try {
      const models = await fetchAvailableModels(localConfig);
      if (models.length > 0) {
        setAvailableModels(models);
        setConnectionStatus("success");
        // Auto-select first model if needed
        if (!localConfig.model || !models.includes(localConfig.model)) {
          setLocalConfig(prev => ({ ...prev, model: models[0] }));
        }
      } else {
        setConnectionStatus("success"); // Connected but no models listed
      }
    } catch (err) {
      setConnectionStatus("error");
      setModelError(err instanceof Error ? err.message : "Connection failed");
    }
  };

  const handleSave = () => {
    onSave(localConfig);
    onOpenChange(false);
  };

  const currentProvider = LLM_PROVIDERS.find(p => p.id === localConfig.provider);
  const isLocalProvider = localConfig.provider === "lmstudio" || localConfig.provider === "llamacpp";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
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
                <p className="text-xs text-muted-foreground">
                  Your API key is stored locally in your browser.
                </p>
              </div>
            )}

            {/* Base URL */}
            <div className="space-y-2">
              <Label>Base URL</Label>
              <Input
                value={localConfig.baseUrl}
                onChange={(e) => {
                  setLocalConfig({ ...localConfig, baseUrl: e.target.value });
                  setConnectionStatus("idle");
                  setAvailableModels([]);
                }}
                placeholder="https://api.provider.com/v1"
              />
            </div>

            {/* Connection Status & Fetch Models */}
            <div className="flex items-center gap-2 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                onClick={handleTestConnection}
                disabled={connectionStatus === "testing" || isLoadingModels}
              >
                {(connectionStatus === "testing" || isLoadingModels) ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-1" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-1" />
                )}
                {isLoadingModels ? "Fetching models..." : "Connect & Fetch Models"}
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

            {modelError && (
              <p className="text-xs text-red-500">{modelError}</p>
            )}

            {/* Model Selection */}
            <div className="space-y-2">
              <Label>Model</Label>
              {availableModels.length > 0 ? (
                <Select
                  value={localConfig.model}
                  onValueChange={(v) => setLocalConfig({ ...localConfig, model: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a model..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availableModels.map((model) => (
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
                  placeholder={isLocalProvider ? "Auto-detected after connecting" : "Model name"}
                  disabled={isLocalProvider && availableModels.length === 0}
                />
              )}
              {isLocalProvider && availableModels.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  Using locally loaded model: <strong>{localConfig.model}</strong>
                </p>
              )}
              {isLocalProvider && availableModels.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  Connect to your local server to auto-detect the loaded model.
                </p>
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
                className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-secondary"
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
                max={128000}
              />
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
                <strong>Remote providers:</strong> Groq, Cerebras (requires API key)
              </p>
              <p className="text-muted-foreground">
                <strong>Local providers:</strong> LM Studio (default port 1234), llama.cpp (default port 8080)
              </p>
              <p className="text-muted-foreground">
                <strong>Supported document formats:</strong> PDF, DOCX, TXT
              </p>
              <p className="text-xs text-muted-foreground mt-4">
                Built with React, TypeScript, Tailwind CSS, and Shadcn UI.
                All data including API keys is stored locally in your browser.
              </p>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={!localConfig.model}>
            Save
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
