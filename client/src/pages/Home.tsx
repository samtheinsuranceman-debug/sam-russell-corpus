import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { getLoginUrl } from "@/const";

/**
 * Home page placeholder — the actual landing page is in Landing.tsx
 * This file is kept for template compatibility but is not used in routing.
 */
export default function Home() {
  const { user, loading, error, isAuthenticated, logout } = useAuth();

  return (
    <div className="min-h-screen flex flex-col">
      <main className="rc-breathe-ambient">
        <Loader2 className="animate-spin" />
        <p>Loading...</p>
        <Button variant="default">Example Button</Button>
      </main>
    </div>
  );
}
