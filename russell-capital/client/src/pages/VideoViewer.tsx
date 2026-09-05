// @ts-nocheck
import { useState, useEffect, useRef, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Play, Pause, Volume2, VolumeX, Maximize, SkipForward, SkipBack,
  Clock, Video, CheckCircle2, Loader2, AlertCircle, ChevronRight
} from "lucide-react";

export default function VideoViewer() {
  const [, params] = useRoute("/video/:token");
  const token = params?.token || "";

  const proposalQuery = trpc.videoProposal.getByShareToken.useQuery(
    { token },
    { enabled: !!token, retry: 1 }
  );
  const trackMutation = trpc.videoProposal.trackEngagement.useMutation();

  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [activeChapterIdx, setActiveChapterIdx] = useState(0);
  const [watchStartTime, setWatchStartTime] = useState<number | null>(null);
  const [totalWatchTime, setTotalWatchTime] = useState(0);
  const watchIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const proposal = proposalQuery.data;
  const chapters = proposal?.chapters || [];

  // Track play/pause events
  const handlePlay = useCallback(() => {
    setIsPlaying(true);
    setWatchStartTime(Date.now());
    if (proposal) {
      trackMutation.mutate({
        proposalId: proposal.id,
        eventType: "play",
        videoTimestamp: videoRef.current?.currentTime || 0,
      });
    }
  }, [proposal]);

  const handlePause = useCallback(() => {
    setIsPlaying(false);
    if (watchStartTime) {
      const sessionDuration = (Date.now() - watchStartTime) / 1000;
      setTotalWatchTime(prev => prev + sessionDuration);
      setWatchStartTime(null);
    }
    if (proposal) {
      trackMutation.mutate({
        proposalId: proposal.id,
        eventType: "pause",
        videoTimestamp: videoRef.current?.currentTime || 0,
        totalWatchTime,
        percentWatched: duration > 0 ? Math.round((currentTime / duration) * 100) : 0,
      });
    }
  }, [proposal, watchStartTime, totalWatchTime, duration, currentTime]);

  const handleEnded = useCallback(() => {
    setIsPlaying(false);
    if (proposal) {
      trackMutation.mutate({
        proposalId: proposal.id,
        eventType: "complete",
        totalWatchTime,
        percentWatched: 100,
      });
    }
  }, [proposal, totalWatchTime]);

  const handleTimeUpdate = useCallback(() => {
    if (!videoRef.current) return;
    const time = videoRef.current.currentTime;
    setCurrentTime(time);

    // Determine active chapter based on cumulative durations
    if (chapters.length > 0) {
      let cumulative = 0;
      for (let i = 0; i < chapters.length; i++) {
        cumulative += chapters[i].durationEstimate || 30;
        if (time < cumulative) {
          if (i !== activeChapterIdx) {
            setActiveChapterIdx(i);
            if (proposal) {
              trackMutation.mutate({
                proposalId: proposal.id,
                eventType: "chapter_enter",
                chapterIndex: i,
                videoTimestamp: time,
              });
            }
          }
          break;
        }
      }
    }
  }, [chapters, activeChapterIdx, proposal]);

  const seekToChapter = (chapterIdx: number) => {
    if (!videoRef.current || chapters.length === 0) return;
    let cumulative = 0;
    for (let i = 0; i < chapterIdx; i++) {
      cumulative += chapters[i].durationEstimate || 30;
    }
    videoRef.current.currentTime = cumulative;
    setActiveChapterIdx(chapterIdx);
    if (proposal) {
      trackMutation.mutate({
        proposalId: proposal.id,
        eventType: "seek",
        chapterIndex: chapterIdx,
        videoTimestamp: cumulative,
      });
    }
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) videoRef.current.pause();
    else videoRef.current.play();
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const toggleFullscreen = () => {
    if (!videoRef.current) return;
    if (document.fullscreenElement) document.exitFullscreen();
    else videoRef.current.requestFullscreen();
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  if (proposalQuery.isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a1a] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-violet-400 mx-auto mb-4" />
          <p className="text-white/60">Loading your personalized video...</p>
        </div>
      </div>
    );
  }

  if (proposalQuery.isError || !proposal) {
    return (
      <div className="min-h-screen bg-[#0a0a1a] flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Video Not Found</h2>
          <p className="text-white/60">This video link may be invalid or the video is still being generated.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a1a] text-white">
      {/* Header */}
      <div className="border-b border-white/10 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center">
              <Video className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="font-semibold text-lg">{proposal.title}</h1>
              <p className="text-xs text-white/50">Russell Capital Solutions™</p>
            </div>
          </div>
          {proposal.totalDuration && (
            <Badge variant="outline" className="border-white/20 text-white/60">
              <Clock className="w-3 h-3 mr-1" /> {Math.round(proposal.totalDuration / 60)}m {proposal.totalDuration % 60}s
            </Badge>
          )}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-[1fr_320px] gap-6">
          {/* Video Player */}
          <div className="space-y-4">
            <div className="relative aspect-video bg-black rounded-xl overflow-hidden group">
              <video
                ref={videoRef}
                src={proposal.videoUrl || ""}
                className="w-full h-full object-contain"
                poster={proposal.thumbnailUrl || undefined}
                onPlay={handlePlay}
                onPause={handlePause}
                onEnded={handleEnded}
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={() => setDuration(videoRef.current?.duration || 0)}
              />

              {/* Custom Controls Overlay */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                {/* Progress Bar */}
                <div className="relative h-1 bg-white/20 rounded-full mb-3 cursor-pointer" onClick={(e) => {
                  if (!videoRef.current) return;
                  const rect = e.currentTarget.getBoundingClientRect();
                  const pct = (e.clientX - rect.left) / rect.width;
                  videoRef.current.currentTime = pct * duration;
                }}>
                  <div className="absolute h-full bg-violet-500 rounded-full" style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }} />
                  {/* Chapter markers */}
                  {chapters.length > 0 && (() => {
                    const totalEst = chapters.reduce((s, c) => s + (c.durationEstimate || 30), 0);
                    let cum = 0;
                    return chapters.slice(0, -1).map((ch, i) => {
                      cum += ch.durationEstimate || 30;
                      return <div key={i} className="absolute top-0 w-0.5 h-full bg-white/40" style={{ left: `${(cum / totalEst) * 100}%` }} />;
                    });
                  })()}
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button onClick={togglePlay} className="hover:text-violet-400 transition-colors">
                      {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                    </button>
                    <button onClick={() => seekToChapter(Math.max(0, activeChapterIdx - 1))} className="hover:text-violet-400 transition-colors">
                      <SkipBack className="w-4 h-4" />
                    </button>
                    <button onClick={() => seekToChapter(Math.min(chapters.length - 1, activeChapterIdx + 1))} className="hover:text-violet-400 transition-colors">
                      <SkipForward className="w-4 h-4" />
                    </button>
                    <button onClick={toggleMute} className="hover:text-violet-400 transition-colors">
                      {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                    </button>
                    <span className="text-xs text-white/60">{formatTime(currentTime)} / {formatTime(duration)}</span>
                  </div>
                  <button onClick={toggleFullscreen} className="hover:text-violet-400 transition-colors">
                    <Maximize className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Play button overlay when paused */}
              {!isPlaying && (
                <div className="absolute inset-0 flex items-center justify-center cursor-pointer" onClick={togglePlay}>
                  <div className="w-16 h-16 rounded-full bg-violet-500/80 flex items-center justify-center backdrop-blur-sm hover:bg-violet-500 transition-colors">
                    <Play className="w-8 h-8 text-white ml-1" />
                  </div>
                </div>
              )}
            </div>

            {/* Active Chapter Info */}
            {chapters.length > 0 && chapters[activeChapterIdx] && (
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="outline" className="border-violet-500/30 text-violet-400 text-[10px]">
                    Chapter {activeChapterIdx + 1} of {chapters.length}
                  </Badge>
                </div>
                <h3 className="font-semibold text-lg">{chapters[activeChapterIdx].title}</h3>
              </div>
            )}
          </div>

          {/* Chapter Navigation Sidebar */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm text-white/60 uppercase tracking-wider">Chapters</h3>
            {chapters.map((ch, idx) => {
              const isActive = idx === activeChapterIdx;
              const isPast = idx < activeChapterIdx;
              return (
                <div
                  key={idx}
                  className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all ${
                    isActive ? "bg-violet-500/20 border border-violet-500/30" : "bg-white/5 border border-transparent hover:bg-white/10"
                  }`}
                  onClick={() => seekToChapter(idx)}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    isActive ? "bg-violet-500 text-white" : isPast ? "bg-emerald-500/20 text-emerald-400" : "bg-white/10 text-white/40"
                  }`}>
                    {isPast ? <CheckCircle2 className="w-4 h-4" /> : <span className="text-xs font-bold">{idx + 1}</span>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${isActive ? "text-white" : "text-white/70"}`}>{ch.title}</p>
                    <p className="text-[10px] text-white/40">~{ch.durationEstimate || 30}s</p>
                  </div>
                  {isActive && <ChevronRight className="w-4 h-4 text-violet-400 shrink-0" />}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-white/10 px-6 py-4 mt-8">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-xs text-white/30">
            This personalized video was prepared exclusively for you by Russell Capital Solutions™.
            The information presented is for educational purposes only and does not constitute financial advice.
          </p>
        </div>
      </div>
    </div>
  );
}
