import { Navbar } from "@/components/layout/Navbar";
import { Hero } from "@/components/home/Hero";
import { Features } from "@/components/home/Features";
import { Providers } from "@/components/home/Providers";
import { Footer } from "@/components/home/Footer";

export function HomePage() {
  return (
    <div className="relative min-h-screen">
      <Navbar />
      <main>
        <Hero />
        <Features />
        <Providers />
      </main>
      <Footer />
    </div>
  );
}
