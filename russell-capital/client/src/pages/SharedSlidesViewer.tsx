import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import {
  Presentation, ChevronRight, ChevronLeft, Loader2, Eye,
  MessageSquare, Lock, Maximize2, Minimize2,
} from "lucide-react";
import SlideComments from "@/components/SlideComments";
import { useRoute } from "wouter";

const audienceLabel: Record<string, string> = { client: "Client-Facing", advisor: "Advisor", team: "Internal Team" };

export default function SharedSlidesViewer() {
  const [, params] = useRoute("/shared-slides/:token");
  const token = params?.token || "";

  const { data, isLoading, error } = trpc.slides.getByShareToken.useQuery(
    { token },
    { enabled: !!token, retry: false }
  );

  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-emerald-400 mx-auto mb-4" />
          <p className="text-zinc-400">Loading presentation...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <Card className="border-zinc-700/50 max-w-md">
          <CardContent className="py-12 text-center">
            <Lock className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-zinc-200 mb-2">Access Denied</h2>
            <p className="text-sm text-zinc-500">
              This share link is invalid, expired, or you don't have permission to view it.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { deck, permission } = data;
  const slides = deck.slides || [];
  const activeSlide = slides[activeSlideIndex];
  const canComment = permission === "comment" || permission === "edit";

  if (fullscreen && activeSlide) {
    return (
      <div className="fixed inset-0 bg-zinc-950 z-50 flex flex-col">
        {/* Top bar */}
        <div className="flex items-center justify-between px-6 py-3 bg-zinc-900/80 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <Presentation className="h-5 w-5 text-emerald-400" />
            <span className="text-sm font-semibold text-white">{deck.title}</span>
            <Badge variant="outline" className="text-[10px] text-zinc-500 border-zinc-700">
              {activeSlideIndex + 1} / {slides.length}
            </Badge>
          </div>
          <Button variant="ghost" size="sm" className="text-zinc-400" onClick={() => setFullscreen(false)}>
            <Minimize2 className="h-4 w-4 mr-1" /> Exit
          </Button>
        </div>

        {/* Slide */}
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] rounded-2xl border border-white/10 p-12 max-w-4xl w-full min-h-[400px] flex flex-col justify-center relative">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-emerald-500 via-emerald-400 to-transparent rounded-t-2xl" />
            <h2 className="text-3xl font-bold text-white mb-2">{activeSlide.title}</h2>
            {activeSlide.subtitle && <p className="text-lg text-white/50 mb-8">{activeSlide.subtitle}</p>}
            <ul className="space-y-3">
              {activeSlide.bullets?.map((b: string, i: number) => (
                <li key={i} className="flex items-start gap-3">
                  <ChevronRight className="h-5 w-5 text-emerald-400 mt-0.5 shrink-0" />
                  <span className="text-base text-white/85">{b}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom nav */}
        <div className="flex items-center justify-between px-8 py-4 bg-zinc-900/80 border-t border-zinc-800">
          <Button variant="ghost" size="sm" className="text-zinc-400" onClick={() => setActiveSlideIndex(Math.max(0, activeSlideIndex - 1))} disabled={activeSlideIndex === 0}>
            <ChevronLeft className="h-4 w-4 mr-1" /> Previous
          </Button>
          <div className="flex gap-1.5">
            {slides.map((_: any, i: number) => (
              <button
                key={i}
                onClick={() => setActiveSlideIndex(i)}
                className={`w-2.5 h-2.5 rounded-full transition-all ${i === activeSlideIndex ? "bg-emerald-400 scale-125" : "bg-zinc-600 hover:bg-zinc-500"}`}
              />
            ))}
          </div>
          <Button variant="ghost" size="sm" className="text-zinc-400" onClick={() => setActiveSlideIndex(Math.min(slides.length - 1, activeSlideIndex + 1))} disabled={activeSlideIndex === slides.length - 1}>
            Next <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Header */}
      <div className="bg-zinc-900/80 border-b border-zinc-800">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <Presentation className="h-4 w-4 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">{deck.title}</h1>
              <p className="text-xs text-zinc-500">
                {slides.length} slides · {deck.toolName} · {audienceLabel[deck.audience] || deck.audience}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-[10px] border-zinc-700 text-zinc-500">
              <Eye className="h-3 w-3 mr-1" />
              {permission === "view" ? "View Only" : permission === "comment" ? "Can Comment" : "Can Edit"}
            </Badge>
            <Button variant="outline" size="sm" className="text-zinc-300 border-zinc-600" onClick={() => setFullscreen(true)}>
              <Maximize2 className="h-3 w-3 mr-1" /> Present
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Slide viewer — 2/3 */}
          <div className="lg:col-span-2 space-y-4">
            {activeSlide && (
              <>
                <div className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] rounded-xl border border-white/10 p-8 min-h-[280px] flex flex-col justify-center relative">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 via-emerald-400 to-transparent rounded-t-xl" />
                  <div className="absolute top-3 right-4">
                    <Badge variant="outline" className="text-[10px] text-emerald-400 border-emerald-500/30">
                      {activeSlide.layout?.toUpperCase()}
                    </Badge>
                  </div>
                  <h2 className="text-xl font-bold text-white mb-1">{activeSlide.title}</h2>
                  {activeSlide.subtitle && <p className="text-sm text-white/50 mb-5">{activeSlide.subtitle}</p>}
                  <ul className="space-y-2">
                    {activeSlide.bullets?.map((b: string, i: number) => (
                      <li key={i} className="flex items-start gap-2">
                        <ChevronRight className="h-4 w-4 text-emerald-400 mt-0.5 shrink-0" />
                        <span className="text-sm text-white/85">{b}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {activeSlide.speakerNotes && (
                  <p className="text-xs text-zinc-500 italic px-2">📝 {activeSlide.speakerNotes}</p>
                )}

                {/* Navigation */}
                <div className="flex items-center justify-between">
                  <Button variant="ghost" size="sm" className="text-zinc-400" onClick={() => setActiveSlideIndex(Math.max(0, activeSlideIndex - 1))} disabled={activeSlideIndex === 0}>
                    <ChevronLeft className="h-4 w-4 mr-1" /> Prev
                  </Button>
                  <div className="flex gap-1">
                    {slides.map((_: any, i: number) => (
                      <button
                        key={i}
                        onClick={() => setActiveSlideIndex(i)}
                        className={`w-2 h-2 rounded-full transition-colors ${i === activeSlideIndex ? "bg-emerald-400" : "bg-zinc-600 hover:bg-zinc-500"}`}
                      />
                    ))}
                  </div>
                  <Button variant="ghost" size="sm" className="text-zinc-400" onClick={() => setActiveSlideIndex(Math.min(slides.length - 1, activeSlideIndex + 1))} disabled={activeSlideIndex === slides.length - 1}>
                    Next <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </>
            )}

            {/* Slide thumbnails */}
            <div className="flex gap-2 overflow-x-auto pb-2">
              {slides.map((slide: any, i: number) => (
                <button
                  key={i}
                  onClick={() => setActiveSlideIndex(i)}
                  className={`shrink-0 w-32 p-2 rounded-lg border text-left transition-all ${
                    i === activeSlideIndex
                      ? "border-emerald-500/50 bg-emerald-500/5"
                      : "border-zinc-700/30 bg-zinc-800/20 hover:border-zinc-600"
                  }`}
                >
                  <p className="text-[10px] font-semibold text-white/70 truncate">{slide.title}</p>
                  <p className="text-[9px] text-zinc-600 mt-0.5">Slide {i + 1}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Comments panel — 1/3 */}
          <div className="space-y-4">
            {canComment ? (
              <Card className="border-zinc-700/50">
                <CardContent className="py-4">
                  <SlideComments deckId={deck.id} activeSlideIndex={activeSlideIndex} />
                </CardContent>
              </Card>
            ) : (
              <Card className="border-zinc-700/50">
                <CardContent className="py-8 text-center">
                  <MessageSquare className="w-8 h-8 text-zinc-600 mx-auto mb-3" />
                  <p className="text-xs text-zinc-500">
                    You have view-only access. Comments are disabled.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-zinc-800 mt-12">
        <div className="max-w-5xl mx-auto px-6 py-4 text-center">
          <p className="text-[10px] text-zinc-600">
            Powered by Russell Capital Solutions™ · AI-Generated Presentation
          </p>
        </div>
      </div>
    </div>
  );
}
