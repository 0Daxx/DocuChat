# Model Names & Selection UI Fix

## Issues Fixed

### Issue 1: Incorrect Model Names ❌

**Problem:** The code was using wrong model names that don't exist on the providers.

**Wrong Models:**
- Groq: `llama-3.3-70b-versatile`
- Cerebras: `llama3.1-70b`

**Correct Models:**
- **Groq:** 
  - `qwen/qwen-3.8-27b`
  - `openai/gpt-oss-120b`
- **Cerebras:**
  - `qwen-3.8-27b`
  - `gpt-oss-120b`

### Issue 2: Model Selection UI Not Showing ❌

**Problem:** The model dropdown was only showing when models were successfully fetched from the API. If the fetch failed or returned empty, users would see an input field instead of a dropdown, making it confusing.

**Root Cause:**
```typescript
// Old code - conditional rendering
{availableModels.length > 0 ? (
  <Select>...</Select>  // Dropdown
) : (
  <Input />  // Text input
)}
```

---

## Fixes Applied ✅

### Fix 1: Updated All Model Names

**File: `src/lib/storage.ts`**
```typescript
const DEFAULT_LLM_CONFIG: LLMConfig = {
  provider: "groq",
  model: "qwen/qwen-3.8-27b", // ✅ Updated from "llama-3.3-70b-versatile"
  baseUrl: "https://api.groq.com/openai/v1",
  temperature: 0.7,
  maxTokens: 4096,
};
```

**File: `src/components/settings/SettingsDialog.tsx`**
```typescript
const handleProviderChange = useCallback((providerId: LLMProviderType) => {
  // Set default model for the provider
  const defaultModel = providerId === "groq" 
    ? "qwen/qwen-3.8-27b"  // ✅ Updated
    : providerId === "cerebras"
    ? "qwen-3.8-27b"        // ✅ Updated
    : "";
  // ...
}, [localConfig]);
```

**File: `src/lib/llm/providers.ts`**
```typescript
} catch (error) {
  console.error(`Failed to get models for ${providerId}:`, error);
  // Return a default model name as fallback
  return providerId === "groq" 
    ? "qwen/qwen-3.8-27b"   // ✅ Updated
    : "qwen-3.8-27b";        // ✅ Updated
}
```

### Fix 2: Always Show Model Dropdown

**File: `src/components/settings/SettingsDialog.tsx`**

**Before:**
```typescript
{availableModels.length > 0 ? (
  <Select>
    {/* Dropdown with fetched models */}
  </Select>
) : (
  <Input />  // Text input when no models fetched
)}
```

**After:**
```typescript
<Select
  value={localConfig.model}
  onValueChange={(v) => setLocalConfig({ ...localConfig, model: v })}
>
  <SelectTrigger>
    <SelectValue placeholder="Select a model..." />
  </SelectTrigger>
  <SelectContent>
    {localConfig.provider === "groq" && (
      <>
        <SelectItem value="qwen/qwen-3.8-27b">qwen/qwen-3.8-27b</SelectItem>
        <SelectItem value="openai/gpt-oss-120b">openai/gpt-oss-120b</SelectItem>
      </>
    )}
    {localConfig.provider === "cerebras" && (
      <>
        <SelectItem value="qwen-3.8-27b">qwen-3.8-27b</SelectItem>
        <SelectItem value="gpt-oss-120b">gpt-oss-120b</SelectItem>
      </>
    )}
  </SelectContent>
</Select>
<p className="text-xs text-muted-foreground">
  Select a model from the list above. Default: {localConfig.provider === "groq" ? "qwen/qwen-3.8-27b" : "qwen-3.8-27b"}
</p>
```

---

## What Changed

### 1. Model Names Updated Everywhere
- ✅ Default configuration (`storage.ts`)
- ✅ Provider change handler (`SettingsDialog.tsx`)
- ✅ Fallback model getter (`providers.ts`)
- ✅ UI placeholder text (removed)

### 2. UI Simplified
- ✅ Always shows dropdown (no conditional rendering)
- ✅ Hardcoded models for each provider
- ✅ No dependency on API fetch for model list
- ✅ Clear helper text below dropdown

### 3. User Experience Improved
- ✅ Users always see model options
- ✅ No confusion about what to enter
- ✅ Can't enter invalid model names
- ✅ Clear indication of available models

---

## Testing the Fix

### Test 1: Groq Provider
1. Open Settings
2. Select "Groq" as provider
3. **Expected:** Dropdown shows:
   - `qwen/qwen-3.8-27b`
   - `openai/gpt-oss-120b`
4. Select a model
5. Click "Save"
6. Send a message
7. ✅ Should work with selected model

### Test 2: Cerebras Provider
1. Open Settings
2. Select "Cerebras" as provider
3. **Expected:** Dropdown shows:
   - `qwen-3.8-27b`
   - `gpt-oss-120b`
4. Select a model
5. Click "Save"
6. Send a message
7. ✅ Should work with selected model

### Test 3: Switching Providers
1. Open Settings with Groq selected
2. Switch to Cerebras
3. **Expected:** Model dropdown updates to show Cerebras models
4. **Expected:** Default model is `qwen-3.8-27b`
5. Click "Save"
6. ✅ Should work correctly

### Test 4: Fresh Install
1. Clear localStorage
2. Open app
3. Open Settings
4. **Expected:** Groq is selected by default
5. **Expected:** Model dropdown shows Groq models
6. **Expected:** Default model is `qwen/qwen-3.8-27b`
7. Click "Save"
8. ✅ Should work without any configuration

---

## Files Modified

1. **`src/lib/storage.ts`**
   - Updated default model to `qwen/qwen-3.8-27b`

2. **`src/components/settings/SettingsDialog.tsx`**
   - Updated default models in `handleProviderChange`
   - Replaced conditional rendering with always-visible dropdown
   - Hardcoded model options for each provider
   - Removed confusing input field fallback
   - Added helpful text below dropdown

3. **`src/lib/llm/providers.ts`**
   - Updated fallback model names in `getFirstAvailableModel`

---

## Build Status

```
✅ Build successful
✅ No TypeScript errors
✅ No compilation errors
✅ Bundle size: ~1.7 MB (gzipped: ~528 KB)
```

---

## Summary

### Before Fix ❌
- Wrong model names (llama models)
- Dropdown only showed when API fetch succeeded
- Confusing input field when fetch failed
- Users didn't know what model names to enter
- Poor user experience

### After Fix ✅
- Correct model names (qwen and gpt-oss)
- Dropdown always shows with correct options
- No confusing input field
- Users can only select valid models
- Clear, intuitive user experience

---

## Available Models

### Groq
| Model ID | Description |
|----------|-------------|
| `qwen/qwen-3.8-27b` | Qwen 3.8 27B parameter model |
| `openai/gpt-oss-120b` | OpenAI GPT-OSS 120B parameter model |

### Cerebras
| Model ID | Description |
|----------|-------------|
| `qwen-3.8-27b` | Qwen 3.8 27B parameter model |
| `gpt-oss-120b` | OpenAI GPT-OSS 120B parameter model |

---

**Status:** ✅ COMPLETE
**Version:** 2.3.2
**Date:** 2026
