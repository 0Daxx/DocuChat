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
  Cpu,
  MessageSquare,
  Palette,
  User,
  Info,
  Plus,
  Trash2,
  Star,
  Download,
  Upload,
  Archive,
  AlertTriangle,
  CheckCircle,
  Eye,
  EyeOff,
  Loader2,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { loadState, saveState, loadAPIKeyConfig, saveAPIKeyConfig, getPreferredKey, maskApiKey } from "@/lib/storage";
import { LLM_PROVIDERS, testConnection } from "@/lib/llm/providers";
import { MODEL_REGISTRY, getModelsByProvider } from "@/lib/llm/modelRegistry";
import { generateId } from "@/lib/utils";
import type { LLMProviderType, APIKey, APIKeyConfig, UserPreferences, ChatSession } from "@/lib/types";

type SettingsSection = "general" | "usage" | "api" | "models" | "chats" | "personalisation" | "account" | "about";

const SETTINGS_SECTIONS: { id: SettingsSection; label: string; icon: React.ElementType }[] = [
  { id: "general", label: "General", icon: SettingsIcon },
  { id: "usage", label: "Usage & Billing", icon: CreditCard },
  { id: "api", label: "API", icon: Key },
  { id: "models", label: "Models", icon: Cpu },
  { id: "chats", label: "Chats", icon: MessageSquare },
  { id: "personalisation", label: "Personalisation", icon: Palette },
  { id: "account", label: "Account", icon: User },
  { id: "about", label: "About", icon: Info },
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
          {activeSection === "models" && <ModelsSettings />}
          {activeSection === "chats" && <ChatsSettings />}
          {activeSection === "personalisation" && <PersonalisationSettings />}
          {activeSection === "account" && <AccountSettings />}
          {activeSection === "about" && <AboutSettings />}
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
  const [apiConfig, setApiConfig] = useState(loadAPIKeyConfig());
  const [showAddKey, setShowAddKey] = useState(false);
  const [newKeyProvider, setNewKeyProvider] = useState<LLMProviderType>("groq");
  const [newKeyName, setNewKeyName] = useState("");
  const [newKeyValue, setNewKeyValue] = useState("");
  const [testingKey, setTestingKey] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ [key: string]: "success" | "error" }>({});

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

          {apiConfig.keys.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No API keys configured. Add one to get started.
            </p>
          ) : (
            <div className="space-y-2">
              {apiConfig.keys.map((key) => {
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
          )}
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
    </div>
  );
}

// Models Settings
function ModelsSettings() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Models</h2>
        <p className="text-muted-foreground">View available models and their capabilities</p>
      </div>

      {LLM_PROVIDERS.map((provider) => {
        const models = getModelsByProvider(provider.id);
        if (models.length === 0) return null;

        return (
          <Card key={provider.id}>
            <CardHeader>
              <CardTitle>{provider.name}</CardTitle>
              <CardDescription>{provider.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {models.map((model) => (
                  <div key={model.id} className="p-3 border rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-medium">{model.name}</p>
                        <p className="text-xs text-muted-foreground">Family: {model.family}</p>
                      </div>
                      <Badge variant={model.available ? "default" : "secondary"}>
                        {model.available ? "Available" : "Unavailable"}
                      </Badge>
                    </div>
                    {model.contextWindow && (
                      <p className="text-xs text-muted-foreground mb-2">
                        Context Window: {model.contextWindow.toLocaleString()} tokens
                      </p>
                    )}
                    <div className="flex flex-wrap gap-1 mb-2">
                      {model.capabilities.map((cap) => (
                        <Badge key={cap} variant="outline" className="text-xs">
                          {cap}
                        </Badge>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Recommended for: {model.recommendedFor.join(", ")}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

// Chats Settings
function ChatsSettings() {
  const [state, setState] = useState(loadState());
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);

  const handleExport = () => {
    setExporting(true);
    try {
      const exportData = {
        version: "1.0",
        exportedAt: Date.now(),
        sessions: state.sessions,
        archivedSessions: state.archivedSessions,
        projects: state.projects,
      };
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `docuchat-export-${new Date().toISOString().split("T")[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Export failed:", error);
    }
    setExporting(false);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (!data.sessions || !Array.isArray(data.sessions)) {
          alert("Invalid export file format");
          return;
        }

        // Validate sessions
        const validSessions = data.sessions.filter((s: any) => s.id && s.title && Array.isArray(s.messages));
        const validArchived = data.archivedSessions?.filter((s: any) => s.id && s.title) || [];
        const validProjects = data.projects?.filter((p: any) => p.id && p.name) || [];

        const newState = {
          ...state,
          sessions: [...state.sessions, ...validSessions],
          archivedSessions: [...state.archivedSessions, ...validArchived],
          projects: [...state.projects, ...validProjects],
        };
        setState(newState);
        saveState(newState);
        alert(`Successfully imported ${validSessions.length} chats`);
      } catch (error) {
        alert("Failed to import: Invalid file format");
      }
      setImporting(false);
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const handleArchiveAll = () => {
    if (!confirm("Archive all chats? They will be moved to archived chats.")) return;
    const newState = {
      ...state,
      archivedSessions: [...state.archivedSessions, ...state.sessions],
      sessions: [],
      activeSessionId: null,
    };
    setState(newState);
    saveState(newState);
  };

  const handleDeleteAll = () => {
    if (!confirm("Delete ALL chats? This action cannot be undone!")) return;
    if (!confirm("Are you absolutely sure? All chat data will be permanently deleted.")) return;
    const newState = {
      ...state,
      sessions: [],
      archivedSessions: [],
      activeSessionId: null,
    };
    setState(newState);
    saveState(newState);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Chats</h2>
        <p className="text-muted-foreground">Manage your chat history</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Import & Export</CardTitle>
          <CardDescription>Backup and restore your chats</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button onClick={handleExport} disabled={exporting}>
              {exporting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Download className="h-4 w-4 mr-2" />}
              Export Chats
            </Button>
            <Button variant="outline" onClick={() => document.getElementById("import-input")?.click()} disabled={importing}>
              {importing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Upload className="h-4 w-4 mr-2" />}
              Import Chats
            </Button>
            <input id="import-input" type="file" accept=".json" onChange={handleImport} className="hidden" />
          </div>
          <p className="text-xs text-muted-foreground">
            Export includes all chats, archived chats, and projects. Import validates data before adding.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Archive</CardTitle>
          <CardDescription>Move chats to archive</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            You have {state.sessions.length} active chats and {state.archivedSessions.length} archived chats.
          </p>
          <Button variant="outline" onClick={handleArchiveAll} disabled={state.sessions.length === 0}>
            <Archive className="h-4 w-4 mr-2" />
            Archive All Chats
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-red-600">Danger Zone</CardTitle>
          <CardDescription>Irreversible actions</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            This will permanently delete all chats and archived chats. This action cannot be undone.
          </p>
          <Button variant="destructive" onClick={handleDeleteAll}>
            <Trash2 className="h-4 w-4 mr-2" />
            Delete All Chats
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

// Personalisation Settings
function PersonalisationSettings() {
  const [state, setState] = useState(loadState());

  const handleSave = () => {
    saveState(state);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Personalisation</h2>
        <p className="text-muted-foreground">Customize your chat experience</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>System Prompt</CardTitle>
          <CardDescription>Custom instructions for the AI</CardDescription>
        </CardHeader>
        <CardContent>
          <textarea
            value={state.preferences.systemPrompt}
            onChange={(e) => setState({ ...state, preferences: { ...state.preferences, systemPrompt: e.target.value } })}
            placeholder="You are a helpful assistant specialized in..."
            className="w-full h-32 rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
          <p className="text-xs text-muted-foreground mt-2">
            This prompt will be prepended to all conversations.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Default Parameters</CardTitle>
          <CardDescription>Default values for new chats</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Temperature: {state.preferences.defaultTemperature}</Label>
            <input
              type="range"
              min="0"
              max="2"
              step="0.1"
              value={state.preferences.defaultTemperature}
              onChange={(e) => setState({ ...state, preferences: { ...state.preferences, defaultTemperature: parseFloat(e.target.value) } })}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Controls randomness. Lower = more focused, higher = more creative.
            </p>
          </div>
          <div>
            <Label>Max Tokens</Label>
            <Input
              type="number"
              value={state.preferences.defaultMaxTokens}
              onChange={(e) => setState({ ...state, preferences: { ...state.preferences, defaultMaxTokens: parseInt(e.target.value) || 4096 } })}
              min={100}
              max={32000}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Maximum length of AI responses.
            </p>
          </div>
        </CardContent>
      </Card>

      <Button onClick={handleSave}>Save Changes</Button>
    </div>
  );
}

// Account Settings
function AccountSettings() {
  const { user, signOut, isDemoMode } = useAuth();
  const navigate = useNavigate();
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState(user?.name || "");

  const handleLogout = () => {
    signOut();
    navigate("/");
  };

  const handleDeleteAccount = () => {
    if (!confirm("Are you sure you want to delete your account? This will remove all your data.")) return;
    if (!confirm("This action is permanent and cannot be undone. Continue?")) return;

    // Clear all data
    localStorage.clear();
    signOut();
    navigate("/");
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Account</h2>
        <p className="text-muted-foreground">Manage your account settings</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Your account information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Email</Label>
            <Input value={user?.email || ""} disabled />
          </div>
          <div>
            <Label>Name</Label>
            {editingName ? (
              <div className="flex gap-2">
                <Input value={newName} onChange={(e) => setNewName(e.target.value)} />
                <Button onClick={() => setEditingName(false)}>Save</Button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Input value={user?.name || ""} disabled />
                <Button variant="outline" onClick={() => setEditingName(true)}>Edit</Button>
              </div>
            )}
          </div>
          {isDemoMode && (
            <p className="text-sm text-muted-foreground">
              You are using demo mode. Account changes are stored locally.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Security</CardTitle>
          <CardDescription>Manage your security settings</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" disabled>
            Change Password
          </Button>
          {isDemoMode && (
            <p className="text-sm text-muted-foreground mt-2">
              Password management is not available in demo mode.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Session</CardTitle>
          <CardDescription>Manage your current session</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" onClick={handleLogout}>
            Log Out
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-red-600">Danger Zone</CardTitle>
          <CardDescription>Irreversible actions</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Deleting your account will permanently remove all your data, including chats, documents, and settings.
          </p>
          <Button variant="destructive" onClick={handleDeleteAccount}>
            Delete Account
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

// About Settings
function AboutSettings() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">About</h2>
        <p className="text-muted-foreground">Information about DocuChat</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>DocuChat</CardTitle>
          <CardDescription>AI-powered document chat service</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm">Version</span>
            <span className="font-mono text-sm">1.0.0</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">Build</span>
            <span className="font-mono text-sm">{new Date().toISOString().split("T")[0]}</span>
          </div>
          <Separator />
          <div>
            <p className="text-sm font-medium mb-2">Built with</p>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">React</Badge>
              <Badge variant="outline">TypeScript</Badge>
              <Badge variant="outline">Tailwind CSS</Badge>
              <Badge variant="outline">ShadCN UI</Badge>
              <Badge variant="outline">Vite</Badge>
            </div>
          </div>
          <Separator />
          <div>
            <p className="text-sm font-medium mb-2">Supported Providers</p>
            <div className="flex flex-wrap gap-2">
              {LLM_PROVIDERS.map((p) => (
                <Badge key={p.id} variant="secondary">{p.name}</Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Links</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <a href="#" className="block text-sm text-primary hover:underline">Documentation</a>
          <a href="#" className="block text-sm text-primary hover:underline">GitHub Repository</a>
          <a href="#" className="block text-sm text-primary hover:underline">Report an Issue</a>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>License</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            MIT License - See LICENSE file for details
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
