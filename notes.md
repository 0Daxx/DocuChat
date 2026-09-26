# Implementation Notes - DocuChat MVP

## Current Status

### ✅ Completed Features

#### Core Application
- [x] React + TypeScript + Vite setup
- [x] Tailwind CSS 4 + ShadCN UI integration
- [x] LocalStorage-based state persistence
- [x] Document upload (PDF/DOCX/TXT)
- [x] Text chunking with overlap
- [x] TF-IDF vector store for retrieval
- [x] LLM provider abstraction (Groq, Cerebras, LM Studio, llama.cpp)
- [x] Streaming chat responses
- [x] Markdown rendering with syntax highlighting
- [x] Project-based chat organization
- [x] Document scoping (chat vs project)
- [x] Responsive sidebar with collapsible state
- [x] Settings dialog for LLM configuration
- [x] API key persistence (separate storage)
- [x] Model auto-detection for local providers

#### UI Components
- [x] Sidebar with project/chat navigation
- [x] Chat window with message bubbles
- [x] Document panel (inline, ChatGPT-style)
- [x] Settings dialog
- [x] Markdown renderer with code blocks
- [x] File upload with drag-and-drop
- [x] Copy-to-clipboard for code blocks
- [x] Source citations in responses

---

## 🚧 Implementation Plan - New Requirements

### 1. Homepage & Landing Page

**Status**: Not Started

**Requirements**:
- Modern homepage with branding
- Hero section with CTA
- Feature overview
- Demo/AI provider section
- Responsive navigation
- Footer with links
- Empty/loading states

**Implementation Approach**:

#### File Structure
```
src/
├── pages/
│   ├── HomePage.tsx           # Main landing page
│   ├── SignInPage.tsx         # Authentication
│   ├── SignUpPage.tsx         # Registration
│   └── DashboardPage.tsx      # Protected app route
├── components/
│   ├── home/
│   │   ├── Hero.tsx           # Hero section
│   │   ├── Features.tsx       # Feature grid
│   │   ├── Providers.tsx      # AI provider showcase
│   │   └── Footer.tsx         # Footer
│   └── layout/
│       ├── Navbar.tsx         # Public navigation
│       └── AppLayout.tsx      # Authenticated layout
```

#### Key Components

**Hero Section**
```tsx
- Headline: "Chat with Your Documents, Powered by AI"
- Subtitle: "Upload PDFs, DOCX, or TXT files and get instant answers"
- CTA Buttons: "Get Started" / "Sign In"
- Visual: Animated document/chat mockup
```

**Features Section**
```tsx
Grid of 6 features:
1. Multi-format support (PDF, DOCX, TXT)
2. Multiple LLM providers
3. Project organization
4. Real-time streaming
5. Markdown rendering
6. Local & cloud inference
```

**Providers Section**
```tsx
- Groq: Fast cloud inference
- Cerebras: Wafer-scale engines
- LM Studio: Local inference
- llama.cpp: Self-hosted
```

---

### 2. Authentication System

**Status**: Not Started

**Requirements**:
- Sign in / Sign up pages
- Form validation
- Email/password fields
- Password visibility toggle
- Loading states
- Error messages
- Protected routes
- Demo mode with env variable

**Implementation Approach**:

#### Auth Context
```typescript
interface AuthContext {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  isDemoMode: boolean;
}
```

#### Demo Mode Logic
```typescript
// Check for demo API key in env
const DEMO_API_KEY = import.meta.env.VITE_DEMO_API_KEY;

if (DEMO_API_KEY) {
  // Enable demo authentication
  // Mock user creation
  // Show demo indicator in UI
}
```

#### Form Validation
```typescript
- Email: regex validation
- Password: min 8 chars, 1 uppercase, 1 number
- Real-time validation feedback
- Submit button disabled until valid
```

#### Protected Routes
```tsx
<Route path="/app/*" element={<ProtectedRoute />}>
  <Route index element={<DashboardPage />} />
</Route>
```

#### Demo Credentials
```
Email: demo@docuchat.ai
Password: demo1234
```

---

### 3. Dark/Light Mode

**Status**: Partially Implemented (theme variables exist)

**Requirements**:
- Theme toggle in navbar
- Persist preference
- Respect system preference
- All components theme-aware
- No hardcoded colors

**Implementation Approach**:

#### Theme Context
```typescript
interface ThemeContext {
  theme: 'light' | 'dark' | 'system';
  setTheme: (theme: Theme) => void;
  resolvedTheme: 'light' | 'dark';
}
```

#### System Preference Detection
```typescript
const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

// Listen for changes
mediaQuery.addEventListener('change', (e) => {
  if (theme === 'system') {
    applyTheme(e.matches ? 'dark' : 'light');
  }
});
```

#### Persistence
```typescript
localStorage.setItem('docuchat-theme', theme);
```

#### CSS Variables
```css
/* Already defined in index.css */
@theme {
  --color-background: hsl(0 0% 100%);      /* light */
  --color-foreground: hsl(240 10% 3.9%);
  /* dark mode overrides via .dark class */
}

.dark {
  --color-background: hsl(240 10% 3.9%);
  --color-foreground: hsl(0 0% 98%);
}
```

#### Theme Toggle Component
```tsx
<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="ghost" size="icon">
      <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
    </Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent>
    <DropdownMenuItem onClick={() => setTheme('light')}>Light</DropdownMenuItem>
    <DropdownMenuItem onClick={() => setTheme('dark')}>Dark</DropdownMenuItem>
    <DropdownMenuItem onClick={() => setTheme('system')}>System</DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

---

### 4. Responsive Design

**Status**: Partially Implemented (sidebar is responsive)

**Requirements**:
- Mobile-first layout
- Responsive navigation
- Touch-friendly elements
- No horizontal scroll
- Responsive typography/spacing

**Implementation Approach**:

#### Breakpoints
```typescript
// Tailwind defaults
sm: 640px   // Mobile landscape
md: 768px   // Tablet
lg: 1024px  // Laptop
xl: 1280px  // Desktop
2xl: 1536px // Large desktop
```

#### Mobile Navigation
```tsx
// Sheet component for mobile menu
<Sheet>
  <SheetTrigger asChild>
    <Button variant="ghost" size="icon" className="md:hidden">
      <Menu className="h-5 w-5" />
    </Button>
  </SheetTrigger>
  <SheetContent side="left">
    <MobileNav />
  </SheetContent>
</Sheet>
```

#### Responsive Sidebar
```tsx
// Desktop: fixed sidebar
<div className="hidden md:block w-72">
  <Sidebar />
</div>

// Mobile: slide-out sheet
<Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
  <SheetContent>
    <Sidebar />
  </SheetContent>
</Sheet>
```

#### Responsive Chat Window
```tsx
// Mobile: full width
// Desktop: max-width container
<div className="w-full md:max-w-3xl mx-auto">
  <ChatWindow />
</div>
```

#### Touch-Friendly Elements
```tsx
// Minimum 44x44px touch targets
<Button className="h-11 min-w-[44px]">
  <Icon className="h-5 w-5" />
</Button>
```

---

### 5. Styling & Components

**Status**: Implemented (ShadCN + Tailwind)

**Requirements**:
- Use ShadCN components
- Consistent spacing/typography
- No additional UI libraries
- Theme-aware components

**Current Components**:
- ✅ Button (multiple variants)
- ✅ Input
- ✅ Label
- ✅ Dialog
- ✅ ScrollArea
- ✅ Select
- ✅ Tabs
- ✅ Tooltip
- ✅ Separator

**Additional Components Needed**:
- [ ] Card (for feature sections)
- [ ] DropdownMenu (for theme toggle)
- [ ] Sheet (for mobile nav)
- [ ] Avatar (for user profile)
- [ ] Badge (for status indicators)
- [ ] Skeleton (for loading states)
- [ ] Toast/Sonner (for notifications)
- [ ] Form (for auth forms)

**Design Tokens**:
```typescript
// Spacing
const spacing = {
  xs: '0.25rem',   // 4px
  sm: '0.5rem',    // 8px
  md: '1rem',      // 16px
  lg: '1.5rem',    // 24px
  xl: '2rem',      // 32px
  '2xl': '3rem',   // 48px
};

// Typography
const typography = {
  xs: '0.75rem',    // 12px
  sm: '0.875rem',   // 14px
  base: '1rem',     // 16px
  lg: '1.125rem',   // 18px
  xl: '1.25rem',    // 20px
  '2xl': '1.5rem',  // 24px
  '3xl': '1.875rem',// 30px
  '4xl': '2.25rem', // 36px
};

// Border radius
const radius = {
  sm: '0.25rem',   // 4px
  md: '0.375rem',  // 6px
  lg: '0.5rem',    // 8px
  xl: '0.75rem',   // 12px
  '2xl': '1rem',   // 16px
  full: '9999px',
};
```

---

### 6. Demo Mode & AI Providers

**Status**: Partially Implemented (providers work, demo mode needed)

**Requirements**:
- Demo mode with env variable
- Provider selector
- Consistent interface
- Mock responses when no API key
- Error handling
- Rate limit handling

**Implementation Approach**:

#### Demo Mode Detection
```typescript
const isDemoMode = !import.meta.env.VITE_GROQ_API_KEY && 
                   !import.meta.env.VITE_CEREBRAS_API_KEY;

if (isDemoMode) {
  // Show demo banner
  // Use mock responses
  // Limit features
}
```

#### Provider Abstraction
```typescript
interface LLMProvider {
  id: string;
  name: string;
  description: string;
  baseUrl: string;
  requiresApiKey: boolean;
  models: string[];
  
  // Methods
  testConnection(): Promise<boolean>;
  fetchModels(): Promise<string[]>;
  streamChat(messages: Message[], config: Config): AsyncIterable<string>;
}
```

#### Mock Responses
```typescript
const MOCK_RESPONSES = {
  greeting: "Hello! I'm in demo mode. In production, I would analyze your documents and provide detailed answers.",
  document: "Based on the document context, I would typically extract relevant information and synthesize an answer. This is a mock response for demonstration purposes.",
  error: "I'm currently running in demo mode. Please configure an API key in settings to enable full functionality.",
};
```

#### Environment Variables
```bash
# .env.example
VITE_DEMO_API_KEY=demo_key_for_testing
VITE_GROQ_API_KEY=your_groq_key
VITE_CEREBRAS_API_KEY=your_cerebras_key
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_key
```

#### Error Handling
```typescript
try {
  const response = await fetchLLM(messages);
} catch (error) {
  if (error.status === 429) {
    // Rate limit
    showToast("Rate limit exceeded. Please wait before trying again.");
  } else if (error.status === 401) {
    // Invalid API key
    showToast("Invalid API key. Please check your settings.");
  } else {
    // Network error
    showToast("Network error. Please check your connection.");
  }
}
```

---

## 📋 Implementation Checklist

### Phase 1: Foundation (Priority: High)
- [ ] Add React Router for navigation
- [ ] Create AuthContext with demo mode
- [ ] Create ThemeContext with system preference
- [ ] Add protected route wrapper
- [ ] Create basic page structure (Home, SignIn, SignUp, Dashboard)

### Phase 2: Homepage (Priority: High)
- [ ] Create Navbar component with theme toggle
- [ ] Build Hero section
- [ ] Build Features section
- [ ] Build Providers section
- [ ] Build Footer
- [ ] Add responsive mobile menu

### Phase 3: Authentication (Priority: High)
- [ ] Create SignIn page with form validation
- [ ] Create SignUp page with form validation
- [ ] Add password visibility toggle
- [ ] Implement demo authentication
- [ ] Add loading states
- [ ] Add error messages
- [ ] Implement redirect after auth

### Phase 4: Theme System (Priority: Medium)
- [ ] Create ThemeProvider
- [ ] Add theme toggle to navbar
- [ ] Persist theme preference
- [ ] Respect system preference
- [ ] Test all components in both themes
- [ ] Fix any hardcoded colors

### Phase 5: Responsive Design (Priority: Medium)
- [ ] Add mobile navigation (Sheet)
- [ ] Make sidebar responsive
- [ ] Optimize chat window for mobile
- [ ] Test all pages on mobile/tablet
- [ ] Ensure touch-friendly elements
- [ ] Fix any overflow issues

### Phase 6: Demo Mode (Priority: Medium)
- [ ] Detect demo mode from env
- [ ] Add demo banner/indicator
- [ ] Implement mock responses
- [ ] Add demo credentials display
- [ ] Handle missing API keys gracefully
- [ ] Add rate limit handling

### Phase 7: Polish (Priority: Low)
- [ ] Add loading skeletons
- [ ] Add toast notifications
- [ ] Improve empty states
- [ ] Add smooth transitions
- [ ] Optimize performance
- [ ] Add accessibility improvements

---

## 🔧 Technical Decisions

### Routing Strategy
```typescript
// Public routes
/                    → HomePage
/signin              → SignInPage
/signup              → SignUpPage

// Protected routes
/app                 → DashboardPage (redirect to /app/chat)
/app/chat/:id        → ChatPage
/app/settings        → SettingsPage
```

### State Management
```typescript
// Global state (Context)
- AuthContext: user, signIn, signOut
- ThemeContext: theme, setTheme
- AppState: projects, sessions, documents, chunks

// Local state (useState)
- Form inputs
- UI toggles
- Temporary data
```

### Error Handling Strategy
```typescript
// Error boundaries for React errors
// Try-catch for async operations
// Toast notifications for user feedback
// Console logging for debugging
```

### Performance Optimizations
```typescript
// React.memo for expensive components
// useMemo for computed values
// useCallback for stable callbacks
// Lazy loading for routes
// Code splitting for large bundles
```

---

## 🧪 Testing Strategy

### Manual Testing Checklist
- [ ] Homepage renders correctly
- [ ] Theme toggle works
- [ ] Auth forms validate correctly
- [ ] Demo mode works without API keys
- [ ] Chat works with documents
- [ ] Projects group chats correctly
- [ ] Mobile layout is usable
- [ ] All buttons are clickable
- [ ] Forms submit correctly
- [ ] Error messages display

### Browser Testing
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile Safari
- [ ] Mobile Chrome

### Device Testing
- [ ] iPhone (375px)
- [ ] iPad (768px)
- [ ] Laptop (1024px)
- [ ] Desktop (1440px+)

---

## 📦 Dependencies to Add

```json
{
  "dependencies": {
    "react-router-dom": "^6.8.0",  // Already installed
    "sonner": "^1.0.0",            // Toast notifications
    "react-hook-form": "^7.43.0",  // Form handling
    "@hookform/resolvers": "^3.0.0", // Form validation
    "zod": "^3.22.0"               // Schema validation
  }
}
```

---

## 🚀 Deployment Notes

### Vercel Configuration
```json
{
  "framework": "vite",
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ],
  "env": {
    "VITE_DEMO_API_KEY": "@demo-api-key"
  }
}
```

### Environment Variables in Vercel
```
VITE_DEMO_API_KEY = demo_key_here
VITE_GROQ_API_KEY = (optional)
VITE_CEREBRAS_API_KEY = (optional)
VITE_SUPABASE_URL = (future)
VITE_SUPABASE_ANON_KEY = (future)
```

---

## 📝 Notes

### Demo Mode Behavior
- When no API keys are configured, app runs in demo mode
- Demo mode shows a banner at the top
- Mock responses are used for chat
- Users can still test the UI and document upload
- Clear indication that it's a demo

### Authentication Flow
1. User visits homepage
2. Clicks "Get Started" → SignUp page
3. Fills form → validates → submits
4. In demo mode: creates mock user
5. Redirects to /app/dashboard
6. Can access chat features

### Theme Persistence
- Stored in localStorage as 'docuchat-theme'
- Values: 'light' | 'dark' | 'system'
- Applied on app load
- Updates immediately on change

### Document Processing
- All processing happens client-side
- No server upload required
- Works in demo mode
- Chunks stored in localStorage

### Future Supabase Integration
- Will replace localStorage with database
- Will add real authentication
- Will add server-side document processing
- Will add vector embeddings
- Migration path: keep localStorage as fallback

---

## 🎯 Success Criteria

### Homepage
- [ ] Loads in < 2 seconds
- [ ] Looks professional and modern
- [ ] Clear value proposition
- [ ] Working CTA buttons
- [ ] Responsive on all devices

### Authentication
- [ ] Forms validate correctly
- [ ] Demo mode works without backend
- [ ] Protected routes redirect to sign-in
- [ ] Clear error messages
- [ ] Smooth transitions

### Theme
- [ ] Toggle works instantly
- [ ] Preference persists across sessions
- [ ] System preference respected
- [ ] All components theme-aware
- [ ] No contrast issues

### Responsive
- [ ] Works on 320px+ screens
- [ ] No horizontal scroll
- [ ] Touch targets are 44px+
- [ ] Text is readable
- [ ] Navigation is accessible

### Demo Mode
- [ ] Works without API keys
- [ ] Clear demo indicator
- [ ] Mock responses are helpful
- [ ] Graceful error handling
- [ ] Can test all features

---

---

## ✅ Implementation Complete - Settings & Message Actions

### What Was Implemented

#### 1. Full Settings Page (`/settings`)
- **Sidebar navigation** with 8 sections: General, Usage & Billing, API, Models, Chats, Personalisation, Account, About
- **Back button** returns to chat screen
- **Responsive layout** with proper sidebar + content areas
- **Accessible navigation** with keyboard support

#### 2. General Settings
- Theme selection (light/dark/system)
- Chat behavior toggles (show sources, stream responses, auto-save)
- All preferences persisted to localStorage

#### 3. Usage & Billing
- Displays current plan (Demo Mode indicator)
- Usage statistics (placeholder for future backend)
- Billing management (disabled in demo mode with clear messaging)

#### 4. API Key Management
- **Multiple keys per provider** (Groq, Cerebras)
- **Add/Edit/Delete** API keys with confirmation
- **Preferred key** selection (star icon)
- **Key masking** (only shows last 4 characters)
- **Test connection** button for each key
- **Fallback behavior** configuration (enable/disable, max retries)
- **Security**: Keys stored in separate localStorage key, never logged, never exposed in UI

#### 5. Models Registry
- Centralized model metadata in `src/lib/llm/modelRegistry.ts`
- Displays models by provider with:
  - Name, family, context window
  - Capabilities (badges)
  - Recommended use cases
  - Availability status
- Extensible for adding new providers

#### 6. Chat Management
- **Export** all chats/projects to JSON
- **Import** with validation (checks format, deduplicates)
- **Archive** all chats (moves to archived section)
- **Delete all** with double confirmation
- Progress states and error handling

#### 7. Personalisation
- Custom system prompt
- Default temperature slider
- Default max tokens
- All settings applied to new chats

#### 8. Account Settings
- View/edit profile (name, email)
- Password change (disabled in demo mode with explanation)
- Logout functionality
- Delete account with double confirmation and data wipe

#### 9. About Page
- App version and build info
- Technology stack badges
- Supported providers list
- Links to documentation

#### 10. Message Actions (Chat Window)
- **Copy button** on assistant messages
  - Copies clean text to clipboard
  - Shows "Copied" feedback for 2 seconds
  - Handles clipboard permission errors
- **Regenerate button** on assistant messages
  - Finds original user message
  - Re-sends to generate new response
  - Preserves original until new response succeeds
  - Only shows when not streaming

#### 11. UX & Accessibility
- All controls have accessible labels
- Icons have tooltips
- Keyboard navigation works
- Focus states visible
- Destructive actions clearly identified (red color, confirmation dialogs)
- Loading, empty, success, and error states implemented
- Responsive on mobile and desktop
- Existing visual styles preserved

### Files Changed

**New Files:**
- `src/pages/SettingsPage.tsx` - Full settings page with all 8 sections
- `src/lib/llm/modelRegistry.ts` - Centralized model metadata

**Modified Files:**
- `src/lib/types.ts` - Added APIKey, APIKeyConfig, UserPreferences, ModelInfo types
- `src/lib/storage.ts` - Added API key management functions, preferences support
- `src/components/settings/SettingsDialog.tsx` - Updated to use new API key system
- `src/components/layout/ChatWindow.tsx` - Added copy/regenerate actions
- `src/components/layout/Sidebar.tsx` - Settings button now navigates to /settings
- `src/App.tsx` - Added /settings route
- `notes.md` - This documentation

### Data Model Changes

**New Types:**
```typescript
interface APIKey {
  id: string;
  provider: LLMProviderType;
  name: string;
  key: string;
  isPreferred: boolean;
  createdAt: number;
  lastUsed?: number;
  isValid?: boolean;
}

interface APIKeyConfig {
  keys: APIKey[];
  fallbackEnabled: boolean;
  maxRetries: number;
}

interface UserPreferences {
  systemPrompt: string;
  defaultTemperature: number;
  defaultMaxTokens: number;
  showSources: boolean;
  streamResponses: boolean;
  autoSaveChats: boolean;
}

interface ModelInfo {
  id: string;
  name: string;
  provider: LLMProviderType;
  family: string;
  contextWindow?: number;
  capabilities: string[];
  recommendedFor: string[];
  available: boolean;
}
```

**AppState Extended:**
- Added `archivedSessions: ChatSession[]`
- Added `apiKeyConfig: APIKeyConfig`
- Added `preferences: UserPreferences`

### Security Considerations

1. **API Keys Storage**
   - Stored in separate localStorage key (`docuchat_api_keys_v2`)
   - Never included in main state snapshots
   - Masked in UI (only last 4 chars shown)
   - Never logged to console
   - Never included in error messages or URLs

2. **Limitations**
   - Client-side storage is not truly secure
   - For production: requires backend/Supabase for secure secret storage
   - Current implementation is acceptable for MVP/demo mode
   - Documented in QWEN.md for future migration

3. **Fallback Behavior**
   - Tries preferred key first
   - Detects retryable failures (rate limits, 5xx errors)
   - Tries next eligible key
   - Max retries configurable (default: 3)
   - Does not retry on auth errors (401, 403)
   - Returns user-friendly error if all keys fail

### Test Commands

```bash
# Build
npm run build

# Dev server
npm run dev

# Type check
npx tsc --noEmit
```

### Remaining Limitations / Backend Work Required

1. **Secure API Key Storage**
   - Current: localStorage (client-side)
   - Required for production: Server-side encryption + database
   - Migration path: Supabase with RLS policies

2. **Usage Tracking**
   - Current: Not implemented
   - Required: Backend API call logging
   - Migration path: Supabase functions + database

3. **Billing Integration**
   - Current: Placeholder UI
   - Required: Stripe/payment provider integration
   - Migration path: Stripe + webhook handlers

4. **Account Management**
   - Current: Demo mode with localStorage
   - Required: Supabase Auth integration
   - Migration path: Already planned in AuthContext

5. **Chat Sync**
   - Current: localStorage only
   - Required: Real-time sync across devices
   - Migration path: Supabase Realtime

---

**Last Updated**: 2026
**Version**: 1.1.0
**Status**: Settings & Message Actions Complete
