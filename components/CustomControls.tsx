"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  Mic, MicOff, 
  Video, VideoOff, 
  PhoneOff, 
  MonitorUp, 
  CircleDot 
} from "lucide-react";
import { cn } from "@/lib/utils";

const CustomCallControls = () => {
  const router = useRouter();

  // Media States
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  // ✅ Admin Check (In Phase 6, we'll get this from your Socket logic)
  const isAdmin = true; 

  // Handlers (We will plug Mediasoup logic into these in Phase 6)
  const toggleAudio = () => setIsMuted(!isMuted);
  const toggleVideo = () => setIsVideoOff(!isVideoOff);
  const toggleScreenShare = () => setIsScreenSharing(!isScreenSharing);
  const toggleRecording = () => setIsRecording(!isRecording);

  const handleLeave = () => {
    // Phase 6: Insert socket.disconnect() here
    router.push("/");
  };

  return (
    <div className="flex items-center gap-2 md:gap-4 bg-dark-2/50 p-2 rounded-2xl backdrop-blur-md border border-white/10">
      
      {/* AUDIO BUTTON */}
      <button
        onClick={toggleAudio}
        className={cn(
          "p-3 rounded-xl transition-all duration-200",
          isMuted ? "bg-red-500 text-white" : "bg-dark-3 text-gray-300 hover:bg-dark-4"
        )}
      >
        {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
      </button>

      {/* VIDEO BUTTON */}
      <button
        onClick={toggleVideo}
        className={cn(
          "p-3 rounded-xl transition-all duration-200",
          isVideoOff ? "bg-red-500 text-white" : "bg-dark-3 text-gray-300 hover:bg-dark-4"
        )}
      >
        {isVideoOff ? <VideoOff size={20} /> : <Video size={20} />}
      </button>

      {/* SCREEN SHARE */}
      <button
        onClick={toggleScreenShare}
        className={cn(
          "p-3 rounded-xl transition-all duration-200",
          isScreenSharing ? "bg-blue-500 text-white" : "bg-dark-3 text-gray-300 hover:bg-dark-4"
        )}
      >
        <MonitorUp size={20} />
      </button>

      {/* RECORDING (Admin Only) */}
      {isAdmin && (
        <button
          onClick={toggleRecording}
          className={cn(
            "p-3 rounded-xl transition-all duration-200",
            isRecording ? "bg-red-500 animate-pulse text-white" : "bg-dark-3 text-gray-300 hover:bg-dark-4"
          )}
        >
          <CircleDot size={20} />
        </button>
      )}

      <div className="w-[1px] h-8 bg-white/10 mx-1" />

      {/* HANG UP */}
      <button
        onClick={handleLeave}
        className="p-3 rounded-xl bg-red-600 hover:bg-red-700 text-white transition-all shadow-lg shadow-red-900/20"
      >
        <PhoneOff size={20} />
      </button>
    </div>
  );
};

export default CustomCallControls;