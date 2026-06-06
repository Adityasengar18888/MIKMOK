"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { useFeedStore } from "@/stores/feedStore";
import { videosApi } from "@/lib/api";
import { Volume2, VolumeX, Play, Pause } from "lucide-react";

interface VideoPlayerProps {
  videoUrl: string;
  videoId: string;
  isActive: boolean;
}

export default function VideoPlayer({ videoUrl, videoId, isActive }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showPlayIcon, setShowPlayIcon] = useState(false);
  const [progress, setProgress] = useState(0);
  const { isMuted, toggleMute } = useFeedStore();
  const viewCounted = useRef(false);

  // Auto-play when video becomes active
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isActive) {
      video.play().then(() => setIsPlaying(true)).catch(() => {});
    } else {
      video.pause();
      video.currentTime = 0;
      setIsPlaying(false);
    }
  }, [isActive]);

  // Sync mute state
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isMuted;
    }
  }, [isMuted]);

  // Count view after 3 seconds of watching
  useEffect(() => {
    if (!isActive || viewCounted.current) return;

    const timer = setTimeout(() => {
      videosApi.incrementView(videoId).catch(() => {});
      viewCounted.current = true;
    }, 3000);

    return () => clearTimeout(timer);
  }, [isActive, videoId]);

  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      video.play().then(() => setIsPlaying(true)).catch(() => {});
    } else {
      video.pause();
      setIsPlaying(false);
    }

    setShowPlayIcon(true);
    setTimeout(() => setShowPlayIcon(false), 600);
  }, []);

  const handleTimeUpdate = useCallback(() => {
    const video = videoRef.current;
    if (!video || !video.duration) return;
    setProgress((video.currentTime / video.duration) * 100);
  }, []);

  return (
    <div className="relative w-full h-full bg-white rounded-2xl overflow-hidden group">
      <video
        ref={videoRef}
        src={videoUrl}
        className="w-full h-full object-cover"
        loop
        playsInline
        muted={isMuted}
        onClick={togglePlay}
        onTimeUpdate={handleTimeUpdate}
      />

      {/* Play/Pause overlay icon */}
      {showPlayIcon && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-20 h-20 rounded-full bg-white/40 backdrop-blur-sm flex items-center justify-center animate-fade-in">
            {isPlaying ? (
              <Play className="w-10 h-10 text-black ml-1" fill="white" />
            ) : (
              <Pause className="w-10 h-10 text-black" fill="white" />
            )}
          </div>
        </div>
      )}

      {/* Mute button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          toggleMute();
        }}
        className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/40 backdrop-blur-sm flex items-center justify-center text-black opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white/60"
      >
        {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
      </button>

      {/* Progress bar */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10">
        <div
          className="h-full bg-gradient-to-r from-[#40E0D0] to-[#00CED1] transition-all duration-200"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
