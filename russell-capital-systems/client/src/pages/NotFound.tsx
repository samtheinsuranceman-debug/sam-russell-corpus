import { Button } from "@/components/ui/button";
import { AlertCircle, Home, ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";

export default function NotFound() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#0a0f1a]">
      <div className="w-full max-w-lg mx-4 text-center">
        {/* Animated glow ring */}
        <div className="flex justify-center mb-8">
          <div className="relative">
            <div className="absolute inset-0 bg-emerald-500/10 rounded-full blur-xl animate-pulse" style={{ width: 96, height: 96, top: -16, left: -16 }} />
            <div className="w-16 h-16 rounded-full border border-emerald-500/30 flex items-center justify-center bg-[#0d1526]">
              <AlertCircle className="h-8 w-8 text-emerald-400" />
            </div>
          </div>
        </div>

        <h1 className="text-6xl font-bold text-white mb-2 tracking-tight">404</h1>

        <h2 className="text-xl font-medium text-[#7a95b8] mb-4">
          Page Not Found
        </h2>

        <p className="text-[#5a7a9b] mb-8 leading-relaxed max-w-sm mx-auto">
          The page you're looking for doesn't exist or has been moved.
          Let's get you back on track.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            onClick={() => window.history.back()}
            variant="outline"
            className="border-[#1e3a5f] text-[#7a95b8] hover:text-white hover:border-emerald-500/50 px-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </Button>
          <Button
            onClick={() => setLocation("/portal")}
            className="bg-emerald-600 hover:bg-emerald-500 text-white px-6"
          >
            <Home className="w-4 h-4 mr-2" />
            Go to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}
