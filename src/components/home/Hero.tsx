import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

export function Hero() {
  return (
    <section className="relative overflow-hidden py-20 md:py-32">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" />

      <div className="container relative mx-auto px-4">
        <div className="mx-auto max-w-4xl text-center">
          {/* Badge */}
          <Badge variant="secondary" className="mb-6 px-4 py-1.5 text-sm">
            <Sparkles className="mr-1.5 h-3.5 w-3.5" />
            AI-Powered Document Chat
          </Badge>

          {/* Headline */}
          <h1 className="mb-6 text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
            Chat with Your Documents,{" "}
            <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Powered by AI
            </span>
          </h1>

          {/* Subtitle */}
          <p className="mb-8 text-lg text-muted-foreground sm:text-xl md:text-2xl">
            Upload PDFs, DOCX, or TXT files and get instant, intelligent answers.
            <br className="hidden sm:block" />
            Support for Groq, Cerebras, and local LLMs.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button asChild size="lg" className="w-full sm:w-auto px-8">
              <Link to="/signup">
                Get Started
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="w-full sm:w-auto px-8">
              <Link to="/signin">Sign In</Link>
            </Button>
          </div>

          {/* Demo credentials hint */}
          <p className="mt-6 text-sm text-muted-foreground">
            Try the demo: <code className="rounded bg-muted px-2 py-0.5 text-xs">demo@docuchat.ai</code> / <code className="rounded bg-muted px-2 py-0.5 text-xs">demo1234</code>
          </p>
        </div>

        {/* Visual mockup */}
        <div className="mx-auto mt-16 max-w-5xl">
          <div className="relative rounded-xl border bg-card p-2 shadow-2xl">
            <div className="rounded-lg bg-muted/50 p-6">
              {/* Mock chat interface */}
              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
                    U
                  </div>
                  <div className="flex-1 rounded-lg bg-background p-3 shadow-sm">
                    <p className="text-sm">What are the key findings in this research paper?</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-medium">
                    AI
                  </div>
                  <div className="flex-1 rounded-lg bg-background p-3 shadow-sm">
                    <p className="text-sm">
                      Based on the document, the key findings include:
                    </p>
                    <ul className="mt-2 list-inside list-disc space-y-1 text-sm">
                      <li>Improved accuracy by 23% over baseline</li>
                      <li>Reduced processing time by 40%</li>
                      <li>Novel approach to data preprocessing</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
