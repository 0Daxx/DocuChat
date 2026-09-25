import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Zap, Folder, MessageSquare, Code2, Cpu } from "lucide-react";

const features = [
  {
    icon: FileText,
    title: "Multi-Format Support",
    description: "Upload and chat with PDF, DOCX, and TXT documents. Automatic text extraction and chunking.",
  },
  {
    icon: Cpu,
    title: "Multiple LLM Providers",
    description: "Choose from Groq, Cerebras, or run locally with LM Studio and llama.cpp.",
  },
  {
    icon: Folder,
    title: "Project Organization",
    description: "Group related chats into projects with shared document libraries for team collaboration.",
  },
  {
    icon: Zap,
    title: "Real-Time Streaming",
    description: "Watch AI responses stream in real-time with the ability to cancel mid-generation.",
  },
  {
    icon: Code2,
    title: "Rich Markdown",
    description: "Full GFM support with syntax-highlighted code blocks, tables, and copy-to-clipboard.",
  },
  {
    icon: MessageSquare,
    title: "Context-Aware Chat",
    description: "Intelligent retrieval finds relevant document sections to answer your questions accurately.",
  },
];

export function Features() {
  return (
    <section className="py-20 md:py-32">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl">
            Everything you need for document chat
          </h2>
          <p className="text-lg text-muted-foreground">
            Powerful features designed for developers, researchers, and teams who work with documents.
          </p>
        </div>

        <div className="mx-auto mt-16 grid max-w-5xl gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <Card key={feature.title} className="transition-shadow hover:shadow-lg">
              <CardHeader>
                <div className="mb-2 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <feature.icon className="h-5 w-5 text-primary" />
                </div>
                <CardTitle>{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>{feature.description}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
