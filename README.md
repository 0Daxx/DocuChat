# DocuChat - AI-Powered Document Chat Service

A modern, full-featured AI document chat application with Supabase integration, supporting multiple LLM providers (Groq, Cerebras, LM Studio, llama.cpp) with RAG (Retrieval Augmented Generation) capabilities.

![DocuChat](https://img.shields.io/badge/version-2.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![React](https://img.shields.io/badge/React-18-61dafb)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6)
![Supabase](https://img.shields.io/badge/Supabase-Integrated-3ecf8e)

## ✨ Features

### Core Features
- 🤖 **Multi-Provider LLM Support**: Groq, Cerebras, LM Studio, llama.cpp
- 📄 **Document Upload**: PDF, DOCX, TXT with automatic chunking
- 🔍 **RAG (Retrieval Augmented Generation)**: TF-IDF based document retrieval
- 💬 **Streaming Responses**: Real-time token streaming
- 📝 **Markdown Rendering**: Full GFM support with syntax highlighting
- 🔄 **API Key Fallback**: Automatic switching on rate limits
- 📁 **Project Organization**: Group chats into projects
- 🌓 **Dark/Light Mode**: System preference detection

### Supabase Integration
- 🔐 **Authentication**: Sign up, sign in, session management
- 💾 **Data Persistence**: Chats, projects, documents synced to cloud
- 🔑 **Free Tier API Keys**: 3 default keys per provider for all users
- 👤 **User Profiles**: Customizable user information
- 🔒 **Row Level Security**: Users can only access their own data
- 📦 **File Storage**: Secure document storage in Supabase Storage

### User Experience
- 🎨 **Modern UI**: Built with ShadCN UI and Tailwind CSS
- 📱 **Fully Responsive**: Works on mobile, tablet, and desktop
- ⚡ **Fast Performance**: Optimized bundle size and lazy loading
- ♿ **Accessible**: WCAG 2.1 AA compliant
- 🎯 **Intuitive**: ChatGPT-style interface

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- A Supabase account (free tier available)
- API keys for LLM providers (Groq, Cerebras)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/docuchat.git
   cd docuchat
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Supabase** (see [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) for detailed instructions)
   - Create a Supabase project
   - Run the database schema from `supabase/schema.sql`
   - Get your Supabase URL and anon key

4. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and add your credentials:
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   
   # Free tier API keys (3 per provider)
   VITE_GROQ_API_KEY_1=gsk_...
   VITE_GROQ_API_KEY_2=gsk_...
   VITE_GROQ_API_KEY_3=gsk_...
   VITE_CEREBRAS_API_KEY_1=csk_...
   VITE_CEREBRAS_API_KEY_2=csk_...
   VITE_CEREBRAS_API_KEY_3=csk_...
   ```

5. **Insert system API keys** (in Supabase SQL Editor)
   ```sql
   -- See SUPABASE_SETUP.md for the complete SQL
   ```

6. **Start development server**
   ```bash
   npm run dev
   ```

7. **Open browser**
   Navigate to http://localhost:5173

## 📖 Documentation

- **[SUPABASE_SETUP.md](./SUPABASE_SETUP.md)** - Complete Supabase setup guide
- **[QWEN.md](./QWEN.md)** - Technical architecture and design
- **[notes.md](./notes.md)** - Implementation notes and changelog
- **[IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md)** - Feature documentation

## 🏗️ Architecture

### Tech Stack
- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS 4 + ShadCN UI
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **Document Processing**: pdf.js, mammoth, custom chunker
- **Vector Search**: TF-IDF based retrieval
- **Routing**: React Router DOM 6

### Project Structure
```
src/
├── components/          # React components
│   ├── auth/           # Authentication components
│   ├── chat/           # Chat-related components
│   ├── home/           # Homepage components
│   ├── layout/         # Layout components
│   ├── settings/       # Settings components
│   └── ui/             # ShadCN UI components
├── contexts/           # React contexts (Auth, Theme)
├── lib/                # Utilities and services
│   ├── documents/      # Document processing
│   ├── llm/            # LLM provider integration
│   ├── storage.ts      # State management
│   ├── supabase.ts     # Supabase client
│   └── types.ts        # TypeScript types
├── pages/              # Page components
└── App.tsx             # Main app component

supabase/
└── schema.sql          # Database schema
```

## 🔑 API Key Management

### Free Tier (System Keys)
- 3 Groq API keys (from environment)
- 3 Cerebras API keys (from environment)
- Read-only for users
- Automatic fallback on rate limits
- Available to all authenticated users

### User Keys (BYOK)
- Add your own API keys
- Fully editable (name, key, preferred status)
- Test before use
- Multiple keys per provider
- Masked display (last 4 chars only)

### Local Providers
- LM Studio (default: http://localhost:1234/v1)
- llama.cpp (default: http://localhost:8080/v1)
- Editable base URLs in settings
- No API key required

## 🎯 Usage

### Basic Chat
1. Sign in or create account
2. Click "New chat" in sidebar
3. Type your message and press Enter
4. AI responds with streaming text

### Document Chat (RAG)
1. Click paperclip icon in chat input
2. Upload PDF, DOCX, or TXT file
3. Ask questions about the document
4. AI retrieves relevant chunks and answers

### Projects
1. Create a project in sidebar
2. Add chats to the project
3. Upload documents to project (shared across all project chats)
4. Organize related conversations

### Settings
- **General**: Theme, chat behavior
- **API Keys**: Manage provider keys
- **Models**: View available models
- **Chats**: Import/export/archive
- **Personalisation**: System prompt, defaults
- **Account**: Profile, password, logout

## 🔒 Security

### Authentication
- Supabase Auth with JWT tokens
- Secure session management
- Protected routes
- Demo mode fallback

### Data Protection
- Row Level Security (RLS) on all tables
- Users can only access their own data
- API keys masked in UI
- No cross-user data leakage
- Secure file storage

### Best Practices
- Never commit `.env` to Git
- Use environment variables for secrets
- Enable RLS on all tables
- Mask sensitive data in UI
- Regular security audits

## 🚢 Deployment

### Vercel (Recommended)
1. Push to GitHub
2. Import in Vercel dashboard
3. Add environment variables
4. Deploy automatically

### Netlify
1. Push to GitHub
2. Import in Netlify dashboard
3. Add environment variables
4. Deploy

### Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
EXPOSE 4173
CMD ["npm", "run", "preview"]
```

## 🧪 Testing

```bash
# Run development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Type checking
npx tsc --noEmit
```

## 📊 Limits & Pricing

### Supabase Free Tier
- 500 MB database
- 1 GB file storage
- 50,000 monthly active users
- 500 MB bandwidth

### Groq Free Tier
- 30 requests/minute
- 14,400 requests/day
- Rate limits vary by model

### Cerebras Free Tier
- Check https://cloud.cerebras.ai/ for current limits
- Generally generous for development

## 🤝 Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📝 License

MIT License - see [LICENSE](./LICENSE) file for details

## 🙏 Acknowledgments

- [Supabase](https://supabase.com) - Backend as a Service
- [ShadCN UI](https://ui.shadcn.com) - Component library
- [Tailwind CSS](https://tailwindcss.com) - Utility-first CSS
- [Groq](https://groq.com) - Fast LLM inference
- [Cerebras](https://cerebras.ai) - Wafer-scale inference
- [React](https://react.dev) - UI library
- [Vite](https://vitejs.dev) - Build tool

## 📞 Support

- **Documentation**: See [SUPABASE_SETUP.md](./SUPABASE_SETUP.md)
- **Issues**: [GitHub Issues](https://github.com/yourusername/docuchat/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/docuchat/discussions)

## 🗺️ Roadmap

- [ ] Real-time collaboration
- [ ] Advanced RAG with embeddings
- [ ] Team workspaces
- [ ] Custom model support
- [ ] Mobile apps (iOS/Android)
- [ ] Plugin system
- [ ] API for developers
- [ ] Analytics dashboard

## 📈 Stats

- ⭐ Star this repo if you find it useful!
- 🐛 Report bugs via GitHub Issues
- 💡 Suggest features via Discussions
- 🔀 Contributions welcome via Pull Requests

---

**Made with ❤️ by the DocuChat Team**

**Last Updated**: 2026  
**Version**: 2.0.0 (Supabase Integration)
