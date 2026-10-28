import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ArrowLeft,
  Settings as SettingsIcon,
  CreditCard,
  Key,
  Plus,
  Trash2,
  Star,
  AlertTriangle,
  CheckCircle,
  Loader2,
} from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { loadState, saveState, loadAPIKeyConfig, saveAPIKeyConfig, getPreferredKey, maskApiKey, getSystemApiKeys } from "@/lib/storage";
import { LLM_PROVIDERS, testConnection } from "@/lib/llm/providers";
import { generateId } from "@/lib/utils";
import type { LLMProviderType, APIKey, UserPreferences } from "@/lib/types";

type SettingsSection = "general" | "usage" | "api";

const SETTINGS_SECTIONS: { id: SettingsSection; label: string; icon: React.ElementType }[] = [
  { id: "general", label: "General", icon: SettingsIcon },
  { id: "usage", label: "Usage & Billing", icon: CreditCard },
  { id: "api", label: "API", icon: Key },
];

export function SettingsPage() {
  const [activeSection, setActiveSection] = useState<SettingsSection>("general");
  const navigate = useNavigate();

  return (
    <div className="flex h-screen bg-background">
      {/* Settings Sidebar */}
      <div className="w-64 border-r bg-muted/30 flex flex-col">
        <div className="p-4 border-b flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => navigate("/app")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="font-semibold">Settings</h1>
        </div>
        <ScrollArea className="flex-1">
          <nav className="p-2 space-y-1">
            {SETTINGS_SECTIONS.map((section) => (
              <Button
                key={section.id}
                variant={activeSection === section.id ? "secondary" : "ghost"}
                className="w-full justify-start gap-2"
                onClick={() => setActiveSection(section.id)}
              >
                <section.icon className="h-4 w-4" />
                {section.label}
              </Button>
            ))}
          </nav>
        </ScrollArea>
      </div>

      {/* Settings Content */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-3xl mx-auto p-6">
          {activeSection === "general" && <GeneralSettings />}
          {activeSection === "usage" && <UsageSettings />}
          {activeSection === "api" && <APISettings />}
        </div>
      </div>
    </div>
  );
}

// General Settings
function GeneralSettings() {
  const { theme, setTheme } = useTheme();
  const [state, setState] = useState(loadState());

  const handleToggle = (key: keyof UserPreferences) => {
    const newPrefs = { ...state.preferences, [key]: !state.preferences[key] };
    const newState = { ...state, preferences: newPrefs };
    setState(newState);
    saveState(newState);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">General</h2>
        <p className="text-muted-foreground">Manage your general preferences</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
          <CardDescription>Customize how DocuChat looks</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Theme</Label>
              <p className="text-sm text-muted-foreground">Choose your preferred theme</p>
            </div>
            <select
              value={theme}
              onChange={(e) => setTheme(e.target.value as "light" | "dark" | "system")}
              className="rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
              <option value="system">System</option>
            </select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Chat Behavior</CardTitle>
          <CardDescription>Configure how chats work</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Show Sources</Label>
              <p className="text-sm text-muted-foreground">Display document sources in responses</p>
            </div>
            <button
              onClick={() => handleToggle("showSources")}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                state.preferences.showSources ? "bg-primary" : "bg-muted"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-background transition-transform ${
                  state.preferences.showSources ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label>Stream Responses</Label>
              <p className="text-sm text-muted-foreground">Show responses as they generate</p>
            </div>
            <button
              onClick={() => handleToggle("streamResponses")}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                state.preferences.streamResponses ? "bg-primary" : "bg-muted"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-background transition-transform ${
                  state.preferences.streamResponses ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label>Auto-save Chats</Label>
              <p className="text-sm text-muted-foreground">Automatically save chat history</p>
            </div>
            <button
              onClick={() => handleToggle("autoSaveChats")}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                state.preferences.autoSaveChats ? "bg-primary" : "bg-muted"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-background transition-transform ${
                  state.preferences.autoSaveChats ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Usage & Billing Settings
function UsageSettings() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Usage & Billing</h2>
        <p className="text-muted-foreground">View your usage and manage billing</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Current Plan</CardTitle>
          <CardDescription>Your subscription details</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Demo Mode</p>
              <p className="text-sm text-muted-foreground">Using demo credentials</p>
            </div>
            <Badge variant="secondary">Free</Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Usage Statistics</CardTitle>
          <CardDescription>Your API usage this month</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">API Calls</span>
              <span className="font-medium">Not tracked in demo mode</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Documents Processed</span>
              <span className="font-medium">Local only</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Billing</CardTitle>
          <CardDescription>Manage your payment methods</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Billing functionality is not available in demo mode. Configure your own API keys in the API settings to use your own billing.
          </p>
          <Button disabled>Manage Billing</Button>
        </CardContent>
      </Card>
    </div>
  );
}

// API Settings
function APISettings() {
  const [state, setState] = useState(loadState());
  const [apiConfig, setApiConfig] = useState(loadAPIKeyConfig());
  const [showAddKey, setShowAddKey] = useState(false);
  const [newKeyProvider, setNewKeyProvider] = useState<LLMProviderType>("groq");
  const [newKeyName, setNewKeyName] = useState("");
  const [newKeyValue, setNewKeyValue] = useState("");
  const [testingKey, setTestingKey] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ [key: string]: "success" | "error" }>({});
  
  // Get system API keys from environment
  const systemKeys = getSystemApiKeys();
  
  // Combine system keys with user keys
  const allKeys = [...systemKeys, ...apiConfig.keys.filter(k => !k.isSystemKey)];

  const handleAddKey = () => {
    if (!newKeyValue.trim()) return;

    const newKey: APIKey = {
      id: generateId(),
      provider: newKeyProvider,
      name: newKeyName || `Key ${apiConfig.keys.length + 1}`,
      key: newKeyValue,
      isPreferred: apiConfig.keys.filter(k => k.provider === newKeyProvider).length === 0,
      createdAt: Date.now(),
    };

    const newConfig = {
      ...apiConfig,
      keys: [...apiConfig.keys, newKey],
    };
    setApiConfig(newConfig);
    saveAPIKeyConfig(newConfig);
    setShowAddKey(false);
    setNewKeyName("");
    setNewKeyValue("");
  };

  const handleDeleteKey = (keyId: string) => {
    if (!confirm("Are you sure you want to delete this API key? This action cannot be undone.")) {
      return;
    }
    const newConfig = {
      ...apiConfig,
      keys: apiConfig.keys.filter(k => k.id !== keyId),
    };
    setApiConfig(newConfig);
    saveAPIKeyConfig(newConfig);
  };

  const handleSetPreferred = (keyId: string) => {
    const key = apiConfig.keys.find(k => k.id === keyId);
    if (!key) return;

    const newConfig = {
      ...apiConfig,
      keys: apiConfig.keys.map(k => ({
        ...k,
        isPreferred: k.provider === key.provider ? k.id === keyId : k.isPreferred,
      })),
    };
    setApiConfig(newConfig);
    saveAPIKeyConfig(newConfig);
  };

  const handleTestKey = async (key: APIKey) => {
    setTestingKey(key.id);
    const provider = LLM_PROVIDERS.find(p => p.id === key.provider);
    if (!provider) {
      setTestResult({ ...testResult, [key.id]: "error" });
      setTestingKey(null);
      return;
    }

    const result = await testConnection({
      provider: key.provider,
      model: "",
      apiKey: key.key,
      baseUrl: provider.defaultBaseUrl,
      temperature: 0.7,
      maxTokens: 4096,
    });

    setTestResult({ ...testResult, [key.id]: result.success ? "success" : "error" });
    setTestingKey(null);
  };

  // Diagnostics removed - backend no longer exists
  // API key testing is done via the "Test" button on each key

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">API Keys</h2>
        <p className="text-muted-foreground">Manage your API keys for LLM providers</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>API Keys</CardTitle>
              <CardDescription>Add and manage API keys for different providers</CardDescription>
            </div>
            <Button onClick={() => setShowAddKey(!showAddKey)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Key
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {showAddKey && (
            <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
              <div>
                <Label>Provider</Label>
                <select
                  value={newKeyProvider}
                  onChange={(e) => setNewKeyProvider(e.target.value as LLMProviderType)}
                  className="w-full mt-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  {LLM_PROVIDERS.filter(p => p.requiresApiKey).map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Name (optional)</Label>
                <Input
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  placeholder="My API Key"
                />
              </div>
              <div>
                <Label>API Key</Label>
                <Input
                  type="password"
                  value={newKeyValue}
                  onChange={(e) => setNewKeyValue(e.target.value)}
                  placeholder="sk-..."
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleAddKey} disabled={!newKeyValue.trim()}>
                  Save Key
                </Button>
                <Button variant="outline" onClick={() => setShowAddKey(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* System API Keys (Free Tier) */}
          {systemKeys.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <Badge variant="secondary">Free Tier</Badge>
                Default API Keys (Read-only)
              </h4>
              {systemKeys.map((key) => {
                const provider = LLM_PROVIDERS.find(p => p.id === key.provider);
                return (
                  <div key={key.id} className="flex items-center justify-between p-3 border rounded-lg bg-muted/30">
                    <div className="flex items-center gap-3">
                      {key.isPreferred && <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />}
                      <div>
                        <p className="font-medium text-sm flex items-center gap-2">
                          {key.name}
                          <Badge variant="outline" className="text-xs">Free</Badge>
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {provider?.name} • {maskApiKey(key.key)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {testResult[key.id] === "success" && (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      )}
                      {testResult[key.id] === "error" && (
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleTestKey(key)}
                        disabled={testingKey === key.id}
                      >
                        {testingKey === key.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          "Test"
                        )}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* User API Keys */}
          {apiConfig.keys.filter(k => !k.isSystemKey).length === 0 && systemKeys.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No API keys configured. Add one to get started.
            </p>
          ) : apiConfig.keys.filter(k => !k.isSystemKey).length > 0 ? (
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Your API Keys</h4>
              {apiConfig.keys.filter(k => !k.isSystemKey).map((key) => {
                const provider = LLM_PROVIDERS.find(p => p.id === key.provider);
                return (
                  <div key={key.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {key.isPreferred && <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />}
                      <div>
                        <p className="font-medium text-sm">{key.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {provider?.name} • {maskApiKey(key.key)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {testResult[key.id] === "success" && (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      )}
                      {testResult[key.id] === "error" && (
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleTestKey(key)}
                        disabled={testingKey === key.id}
                      >
                        {testingKey === key.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          "Test"
                        )}
                      </Button>
                      {!key.isPreferred && (
                        <Button variant="ghost" size="sm" onClick={() => handleSetPreferred(key.id)}>
                          <Star className="h-4 w-4" />
                        </Button>
                      )}
                      <Button variant="ghost" size="sm" onClick={() => handleDeleteKey(key.id)}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Fallback Behavior</CardTitle>
          <CardDescription>Configure what happens when your preferred key fails</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Enable Fallback</Label>
              <p className="text-sm text-muted-foreground">Try other keys when the preferred key fails</p>
            </div>
            <button
              onClick={() => {
                const newConfig = { ...apiConfig, fallbackEnabled: !apiConfig.fallbackEnabled };
                setApiConfig(newConfig);
                saveAPIKeyConfig(newConfig);
              }}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                apiConfig.fallbackEnabled ? "bg-primary" : "bg-muted"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-background transition-transform ${
                  apiConfig.fallbackEnabled ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>
          <div>
            <Label>Max Retries</Label>
            <p className="text-sm text-muted-foreground mb-2">Maximum number of keys to try before giving up</p>
            <Input
              type="number"
              value={apiConfig.maxRetries}
              onChange={(e) => {
                const newConfig = { ...apiConfig, maxRetries: parseInt(e.target.value) || 3 };
                setApiConfig(newConfig);
                saveAPIKeyConfig(newConfig);
              }}
              min={1}
              max={10}
              className="w-24"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Local Provider URLs</CardTitle>
          <CardDescription>Configure base URLs for local LLM servers</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>LM Studio URL</Label>
            <Input
              value={state.llmConfig.provider === "lmstudio" ? state.llmConfig.baseUrl : (import.meta.env.VITE_LMSTUDIO_DEFAULT_URL || "http://localhost:1234/v1")}
              onChange={(e) => {
                if (state.llmConfig.provider === "lmstudio") {
                  const newConfig = { ...state.llmConfig, baseUrl: e.target.value };
                  setState({ ...state, llmConfig: newConfig });
                  saveState({ ...state, llmConfig: newConfig });
                }
              }}
              placeholder="http://localhost:1234/v1"
              disabled={state.llmConfig.provider !== "lmstudio"}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Default: {import.meta.env.VITE_LMSTUDIO_DEFAULT_URL || "http://localhost:1234/v1"}
            </p>
          </div>
          <div>
            <Label>llama.cpp URL</Label>
            <Input
              value={state.llmConfig.provider === "llamacpp" ? state.llmConfig.baseUrl : (import.meta.env.VITE_LLAMACPP_DEFAULT_URL || "http://localhost:8080/v1")}
              onChange={(e) => {
                if (state.llmConfig.provider === "llamacpp") {
                  const newConfig = { ...state.llmConfig, baseUrl: e.target.value };
                  setState({ ...state, llmConfig: newConfig });
                  saveState({ ...state, llmConfig: newConfig });
                }
              }}
              placeholder="http://localhost:8080/v1"
              disabled={state.llmConfig.provider !== "llamacpp"}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Default: {import.meta.env.VITE_LLAMACPP_DEFAULT_URL || "http://localhost:8080/v1"}
            </p>
          </div>
          <p className="text-xs text-muted-foreground">
            Switch to the respective provider in the chat settings to edit these URLs.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}


