import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Cloud, Server } from "lucide-react";

const providers = [
  {
    name: "Groq",
    description: "Ultra-fast cloud inference with Llama, Mixtral, and Gemma models. Get responses in milliseconds.",
    badge: "Cloud",
    icon: Cloud,
    features: ["Llama 3.3 70B", "Mixtral 8x7B", "Gemma 2 9B"],
    color: "from-orange-500 to-red-500",
  },
  {
    name: "Cerebras",
    description: "Wafer-scale engine inference for maximum throughput. Optimized for large-scale workloads.",
    badge: "Cloud",
    icon: Cloud,
    features: ["Llama 3.1 70B", "Llama 3.1 8B", "Ultra-low latency"],
    color: "from-blue-500 to-cyan-500",
  },
  {
    name: "LM Studio",
    description: "Run models locally on your machine. Full privacy and control with no API keys required.",
    badge: "Local",
    icon: Server,
    features: ["Any GGUF model", "No API key needed", "Complete privacy"],
    color: "from-green-500 to-emerald-500",
  },
  {
    name: "llama.cpp",
    description: "Self-hosted inference with llama.cpp server. Lightweight and highly configurable.",
    badge: "Local",
    icon: Server,
    features: ["Self-hosted", "Configurable", "Resource efficient"],
    color: "from-purple-500 to-pink-500",
  },
];

export function Providers() {
  return (
    <section className="py-20 md:py-32 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl">
            Choose your AI provider
          </h2>
          <p className="text-lg text-muted-foreground">
            Flexible deployment options to match your needs. Cloud for speed, local for privacy.
          </p>
        </div>

        <div className="mx-auto mt-16 grid max-w-5xl gap-6 md:grid-cols-2">
          {providers.map((provider) => (
            <Card key={provider.name} className="relative overflow-hidden transition-shadow hover:shadow-lg">
              <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${provider.color}`} />
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`inline-flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br ${provider.color}`}>
                      <provider.icon className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <CardTitle>{provider.name}</CardTitle>
                      <Badge variant={provider.badge === "Cloud" ? "default" : "secondary"} className="mt-1">
                        {provider.badge}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="mb-4">{provider.description}</CardDescription>
                <ul className="space-y-2">
                  {provider.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mx-auto mt-12 max-w-2xl text-center">
          <p className="text-sm text-muted-foreground">
            All providers use the OpenAI-compatible API format. Switch between them seamlessly in settings.
          </p>
        </div>
      </div>
    </section>
  );
}
