/**
 * Music Player Mini-Bar — Always visible at the bottom of the sidebar
 * Shows current track, play/pause, skip, volume control
 */
import { useState, useRef, useEffect } from "react";
import { Play, Pause, SkipForward, SkipBack, Volume2, VolumeX, Music } from "lucide-react";
import { useEntrainment, MUSIC_TRACKS, type MusicTrack, type MusicMood } from "@/contexts/EntrainmentEngine";

const TRACK_LIST = Object.entries(MUSIC_TRACKS) as [MusicTrack, { url: string; mood: MusicMood; title: string }][];

export function MusicPlayerMiniBar() {
  const {
    currentTrack,
    playTrack,
    toggleMusic,
    musicVolume,
    setMusicVolume,
    musicEnabled,
    playMood,
  } = useEntrainment();

  const [showVolume, setShowVolume] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const volRef = useRef<HTMLDivElement>(null);
  const pickerRef = useRef<HTMLDivElement>(null);

  // Close popups on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (volRef.current && !volRef.current.contains(e.target as Node)) setShowVolume(false);
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) setShowPicker(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const currentIdx = currentTrack ? TRACK_LIST.findIndex(([k]) => k === currentTrack) : -1;
  const currentInfo = currentTrack ? MUSIC_TRACKS[currentTrack] : null;

  function skipNext() {
    const nextIdx = (currentIdx + 1) % TRACK_LIST.length;
    playTrack(TRACK_LIST[nextIdx][0]);
  }

  function skipPrev() {
    const prevIdx = currentIdx <= 0 ? TRACK_LIST.length - 1 : currentIdx - 1;
    playTrack(TRACK_LIST[prevIdx][0]);
  }

  const moodColor = currentInfo?.mood === "excitement" ? "text-amber-400" : "text-blue-400";
  const moodBg = currentInfo?.mood === "excitement" ? "bg-amber-500/10" : "bg-blue-500/10";

  return (
    <div className="border-t border-[#12233e] px-3 py-2.5">
      {/* Track info + picker toggle */}
      <div className="flex items-center gap-2 mb-2 relative" ref={pickerRef}>
        <button
          onClick={() => setShowPicker(!showPicker)}
          className={`w-7 h-7 rounded-md ${moodBg} flex items-center justify-center shrink-0 hover:brightness-125 transition-all`}
          title="Choose track"
        >
          <Music size={13} className={currentInfo ? moodColor : "text-[#4a6585]"} />
        </button>
        <div className="flex-1 min-w-0">
          <div className="text-[11px] font-semibold text-white truncate leading-tight">
            {currentInfo?.title ?? "No track playing"}
          </div>
          <div className={`text-[9px] ${moodColor} uppercase tracking-wider font-bold`}>
            {currentInfo?.mood ?? "Select a track"}
          </div>
        </div>

        {/* Track picker dropdown */}
        {showPicker && (
          <div className="absolute bottom-full left-0 mb-2 w-56 bg-[#0d1b2f] border border-[#1a3050] rounded-lg shadow-xl z-50 overflow-hidden">
            <div className="p-2 border-b border-[#1a3050]">
              <div className="text-[10px] text-[#4a6585] uppercase tracking-wider font-bold mb-1.5">Quick Mood</div>
              <div className="flex gap-1.5">
                <button
                  onClick={() => { playMood("relaxation"); setShowPicker(false); }}
                  className="flex-1 text-[10px] py-1 px-2 rounded bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors font-semibold"
                >
                  Relax
                </button>
                <button
                  onClick={() => { playMood("excitement"); setShowPicker(false); }}
                  className="flex-1 text-[10px] py-1 px-2 rounded bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 transition-colors font-semibold"
                >
                  Energize
                </button>
              </div>
            </div>
            <div className="max-h-40 overflow-y-auto">
              {TRACK_LIST.map(([key, info]) => (
                <button
                  key={key}
                  onClick={() => { playTrack(key); setShowPicker(false); }}
                  className={`w-full text-left px-3 py-1.5 text-[11px] hover:bg-[#1a3050] transition-colors flex items-center gap-2 ${
                    currentTrack === key ? "bg-[#1a3050] text-white" : "text-[#7a95b8]"
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                    info.mood === "relaxation" ? "bg-blue-400" : "bg-amber-400"
                  } ${currentTrack === key ? "animate-pulse" : ""}`} />
                  <span className="truncate">{info.title}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Controls row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <button
            onClick={skipPrev}
            className="w-6 h-6 rounded flex items-center justify-center text-[#4a6585] hover:text-white hover:bg-[#1a3050] transition-all"
            title="Previous track"
          >
            <SkipBack size={12} />
          </button>
          <button
            onClick={() => {
            if (!currentTrack && !musicEnabled) {
              playMood("relaxation");
            } else {
              toggleMusic();
            }
            }}
            className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
              musicEnabled
                ? "bg-[#22c55e] text-white shadow-[0_0_12px_rgba(34,197,94,0.4)]"
                : "bg-[#1a3050] text-[#7a95b8] hover:text-white hover:bg-[#22c55e]/30"
            }`}
            title={musicEnabled ? "Pause" : "Play"}
          >
            {musicEnabled ? <Pause size={12} /> : <Play size={12} className="ml-0.5" />}
          </button>
          <button
            onClick={skipNext}
            className="w-6 h-6 rounded flex items-center justify-center text-[#4a6585] hover:text-white hover:bg-[#1a3050] transition-all"
            title="Next track"
          >
            <SkipForward size={12} />
          </button>
        </div>

        {/* Volume control */}
        <div className="relative" ref={volRef}>
          <button
            onClick={() => setShowVolume(!showVolume)}
            className="w-6 h-6 rounded flex items-center justify-center text-[#4a6585] hover:text-white hover:bg-[#1a3050] transition-all"
            title={`Volume: ${Math.round(musicVolume * 100)}%`}
          >
            {musicVolume === 0 ? <VolumeX size={12} /> : <Volume2 size={12} />}
          </button>
          {showVolume && (
            <div className="absolute bottom-full right-0 mb-2 bg-[#0d1b2f] border border-[#1a3050] rounded-lg p-2.5 shadow-xl z-50 w-8">
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={musicVolume}
                onChange={(e) => setMusicVolume(parseFloat(e.target.value))}
                className="w-24 h-1 accent-[#22c55e] cursor-pointer"
                style={{
                  transform: "rotate(-90deg)",
                  transformOrigin: "center",
                  width: "80px",
                  marginTop: "36px",
                  marginBottom: "36px",
                }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
