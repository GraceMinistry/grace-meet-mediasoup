"use client";

import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MicOff,
  VideoOff,
  Video,
  ScreenShareOff,
  ScreenShare,
  MoreVertical,
  Shield,
  Mic,
  Search,
  X,
} from "lucide-react";
import { toast } from "sonner";

// ✅ Replaced Stream's OwnCapability with a simple Enum/Type
type MediaPermission = "audio" | "video" | "screenshare";

interface CustomHostControlsProps {
  onClose?: () => void;
  // PHASE 6: We will pass these down from useMediasoup
  participants?: any[]; 
  isLocalAdmin?: boolean;
}

const CustomHostControls = ({ onClose, participants = [], isLocalAdmin = true }: CustomHostControlsProps) => {
  const [search, setSearch] = useState("");

  // In Mediasoup, "Admin" status is usually a flag on the participant object
  if (!isLocalAdmin) return null;

  const isHostOrCoHost = (p: any) => p.role === "admin" || p.role === "host";

  // ✅ ACTION: Mute/Disable for Everyone
  const updateAll = async (type: MediaPermission, grant: boolean) => {
    try {
      // PHASE 6: socket.emit('request-bulk-action', { type, grant })
      toast.success(`${grant ? "Enabled" : "Disabled"} ${type} for everyone`);
    } catch (error) {
      toast.error("Failed to update participants");
    }
  };

  // ✅ ACTION: Toggle Single Participant
  const togglePermission = async (userId: string, type: MediaPermission, currentState: boolean) => {
    try {
      // PHASE 6: socket.emit('request-mute-user', { userId, type })
      toast.success(`${currentState ? "Disabled" : "Enabled"} ${type} for participant`);
    } catch (error) {
      toast.error(`Failed to update ${userId}`);
    }
  };

  const filtered = participants.filter((p) =>
    (p.name || p.sessionId).toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-4 border-b bg-[#12141B] text-white h-full overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-sm font-semibold text-gray-300">
          Participants [{participants.length}]
        </h4>
        <button onClick={onClose} className="p-2 rounded hover:bg-[#2A2C36] transition">
          <X className="w-4 h-4 text-gray-300" />
        </button>
      </div>

      <div className="w-full mb-4">
        <DropdownMenu>
          <DropdownMenuTrigger className="w-full text-center px-4 py-2 bg-[#1F212A] rounded-md border border-white/5 hover:bg-[#2A2C36] transition">
            Global Host Controls
          </DropdownMenuTrigger>
          <DropdownMenuContent className="bg-[#1F212A] text-white border border-[#2C2E38] w-[240px]">
            <DropdownMenuItem onClick={() => updateAll("audio", false)} className="hover:bg-red-500/20 cursor-pointer">
              <MicOff className="w-4 h-4 mr-2" /> Disable All Mics
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => updateAll("video", false)} className="hover:bg-red-500/20 cursor-pointer">
              <VideoOff className="w-4 h-4 mr-2" /> Disable All Cameras
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search participants..."
          className="w-full bg-[#1F212A] border border-[#2C2E38] rounded-md py-2 pl-9 pr-3 text-sm focus:outline-none focus:border-blue-500"
        />
      </div>

      <div className="space-y-2">
        {filtered.map((p) => (
          <div key={p.sessionId} className="flex items-center justify-between px-3 py-2 bg-[#1B1D25] rounded-lg">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-xs">
                {p.name?.charAt(0) || "U"}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-sm truncate">{p.name || "User"}</span>
                <span className="text-[10px] text-gray-500">{isHostOrCoHost(p) ? "Host" : "Guest"}</span>
              </div>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger className="p-1 hover:bg-[#2A2C36] rounded">
                <MoreVertical className="w-4 h-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-[#1F212A] text-white border border-[#2C2E38]">
                <DropdownMenuItem onClick={() => togglePermission(p.sessionId, "audio", true)}>
                   <MicOff className="w-4 h-4 mr-2" /> Mute Participant
                </DropdownMenuItem>
                <DropdownMenuItem className="text-red-400">
                   <Shield className="w-4 h-4 mr-2" /> Remove from Call
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CustomHostControls;