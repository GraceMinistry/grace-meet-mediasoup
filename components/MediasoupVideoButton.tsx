"use client";

import { Video, VideoOff } from "lucide-react";
import { useMediasoupContext } from "@/contexts/MediasoupContext";

const MediasoupVideoButton = () => {
  const { toggleVideo, isVideoEnabled } = useMediasoupContext();

  return (
    <button
      onClick={toggleVideo}
      className="cursor-pointer rounded-2xl bg-[#19232d] px-4 py-2 hover:bg-[#4c535b] transition disabled:opacity-50 disabled:cursor-not-allowed"
      aria-label={isVideoEnabled ? "Turn off camera" : "Turn on camera"}
    >
      {isVideoEnabled ? (
        <Video size={20} className="text-white" />
      ) : (
        <VideoOff size={20} className="text-white" />
      )}
    </button>
  );
};

export default MediasoupVideoButton;
