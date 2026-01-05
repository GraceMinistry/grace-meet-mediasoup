"use client";

import { Mic, MicOff } from "lucide-react";
import { useMediasoupContext } from "@/contexts/MediasoupContext";

const MediasoupAudioButton = () => {
  const { toggleAudio, isAudioMuted } = useMediasoupContext();

  return (
    <button
      onClick={toggleAudio}
      className="cursor-pointer rounded-2xl bg-[#19232d] px-4 py-2 hover:bg-[#4c535b] transition disabled:opacity-50 disabled:cursor-not-allowed"
      aria-label={isAudioMuted ? "Unmute microphone" : "Mute microphone"}
    >
      {isAudioMuted ? (
        <MicOff size={20} className="text-white" />
      ) : (
        <Mic size={20} className="text-white" />
      )}
    </button>
  );
};

export default MediasoupAudioButton;
