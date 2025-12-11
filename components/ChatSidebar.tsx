"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import {
  useChatContext,
  Channel,
  Window,
  MessageList,
  MessageInput,
} from "stream-chat-react";
import { useCall } from "@stream-io/video-react-sdk";

/**
 * Robust ChatSidebar:
 * - Creates / watches a channel for the call ID
 * - Ensures local user is a member
 * - Adds other call participants when they appear
 * - Handles permission errors without crashing
 */

interface ChatSidebarProps {
  open: boolean;
  onClose: () => void;
}

const ChatSidebar = ({ open, onClose }: ChatSidebarProps) => {
  const call = useCall();
  const { client: chatClient } = useChatContext();
  const [channel, setChannel] = useState<any | null>(null);

  // Helper: return an array of userIds from call participants (deduplicated)
  const getParticipantIds = () => {
    try {
      const participants = call?.state?.participants || [];
      return Array.from(
        new Set(
          participants
            .map((p: any) => p.userId)
            .filter(Boolean)
            .map((id: string) => String(id))
        )
      );
    } catch {
      return [];
    }
  };

  // Create/watch channel (safe)
  useEffect(() => {
    if (!call || !chatClient) return;
    const callId = call.id;
    if (!callId) return;

    let mounted = true;
    let ch: any = null;

    const ensureChannel = async () => {
      try {
        // Prepare initial members: include local user if available
        const localId = chatClient?.user?.id;
        const initialMembers = localId ? [localId] : [];

        // Create the channel object (doesn't call network yet)
        ch = chatClient.channel("messaging", callId, {
          name: `Call Chat – ${callId}`,
          members: initialMembers,
        } as any);

        // Attempt to watch the channel (create if missing / join if allowed)
        await ch.watch();

        if (!mounted) return;
        setChannel(ch);
      } catch (err: any) {
        // Log and fail gracefully — don't crash the whole UI
        // Common reasons: permission denied, token not ready, race condition
        console.error("ChatSidebar: failed to watch channel", err);

        // If permission errors occur, setChannel(null) and allow UI to remain open
        // Optionally, you could show a toast to the user here.
        setChannel(null);
      }
    };

    ensureChannel();

    return () => {
      mounted = false;
      try {
        ch?.stopWatching?.();
      } catch {
        /* ignore */
      }
    };
  }, [call?.id, chatClient, call]);

  // When call participants change — add members to channel
  useEffect(() => {
    if (!channel || !chatClient) return;

    // compute desired member set (local user + call participants)
    const localId = chatClient?.user?.id;
    const participantIds = getParticipantIds();
    const desired = new Set(participantIds);
    if (localId) desired.add(localId);

    // current members on channel (may be undefined until channel state loads)
    const existingMembers =
      (channel?.state?.members && Object.keys(channel.state.members)) || [];

    const toAdd = Array.from(desired).filter(
      (id) => !existingMembers.includes(id)
    );

    if (toAdd.length === 0) return;

    // add missing members safely
    const addMembers = async () => {
      try {
        // stream-js: addMembers accepts array of ids
        await channel.addMembers(toAdd);
        // optionally re-watch or refresh state if needed
        // await channel.watch();
      } catch (err) {
        console.error("ChatSidebar: addMembers failed", err);
      }
    };

    addMembers();
  }, [channel, call?.state?.participants, chatClient]);

  if (!channel) {
    // Return the UI shell so sidebar header & close button exist even if channel setup pending/error
    return (
      <aside
        className={cn(
          `fixed right-0 top-0 h-full w-[300px]
           bg-[#0d1117] border-l border-gray-700 shadow-xl
           transition-transform duration-300 z-50 overflow-y-auto`,
          open ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="p-4 border-b border-gray-700 flex justify-between items-center">
          <h2 className="text-white font-semibold">Chat</h2>
          <button
            className="text-gray-400 hover:text-white transition"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        <div className="p-4 text-sm text-gray-300">
          Connecting chat...
          <div className="mt-3 text-xs text-gray-400">
            If other participants can't see messages, check your Stream Chat
            token and dashboard permissions (ReadChannel).
          </div>
        </div>
      </aside>
    );
  }

  return (
    <aside
      className={cn(
        `fixed right-0 top-0 h-full w-[300px]
         bg-[#0d1117] border-l border-gray-700 shadow-xl
         transition-transform duration-300 z-50 overflow-y-auto`,
        open ? "translate-x-0" : "translate-x-full"
      )}
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-700 flex justify-between items-center">
        <h2 className="text-white font-semibold">Chat</h2>
        <button
          className="text-gray-400 hover:text-white transition"
          onClick={onClose}
        >
          ✕
        </button>
      </div>

      {/* Chat */}
      <div className="h-[calc(100%-60px)] flex flex-col">
        <Channel channel={channel}>
          <Window>
            <MessageList />
            <MessageInput focus />
          </Window>
        </Channel>
      </div>
    </aside>
  );
};

export default ChatSidebar;
