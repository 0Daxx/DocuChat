import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export function SignInPage() {
  const { user, signInAsDemo } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // If already signed in, redirect to app
    if (user) {
      navigate("/app");
    }
  }, [user, navigate]);

  const handleDemoSignIn = async () => {
    await signInAsDemo();
    navigate("/app");
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Welcome to DocuChat</h1>
          <p className="mt-2 text-muted-foreground">
            AI-powered document chat with Groq and Cerebras
          </p>
        </div>

        <div className="space-y-4">
          <button
            onClick={handleDemoSignIn}
            className="w-full rounded-lg bg-primary px-4 py-3 text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Start Demo
          </button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Demo Mode
              </span>
            </div>
          </div>

          <div className="rounded-lg border bg-card p-4 text-sm text-muted-foreground">
            <p className="font-medium text-foreground mb-2">Demo Features:</p>
            <ul className="space-y-1 list-disc list-inside">
              <li>Chat with AI using Groq and Cerebras</li>
              <li>Upload and analyze documents (PDF, DOCX, TXT)</li>
              <li>Create projects and organize chats</li>
              <li>Multiple API keys with automatic fallback</li>
              <li>All data stored locally in your browser</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
