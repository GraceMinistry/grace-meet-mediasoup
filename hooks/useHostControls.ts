import { useCallback } from "react";
import { useUser } from "@clerk/nextjs";
import { toast } from "sonner";

export function useHostControls(socket: any, roomId: string) {
  const { user } = useUser();

  const toggleRemoteAudio = useCallback(
    (targetUserId: string, currentlyMuted: boolean) => {
      if (!socket || !user) return;

      socket.emit("toggle-remote-audio", {
        roomId,
        userId: user.id,
        targetUserId,
        force: currentlyMuted ? "unmute" : "mute",
      });

      toast.success(
        `${currentlyMuted ? "Unmuted" : "Muted"} participant's microphone`
      );
    },
    [socket, user, roomId]
  );

  const toggleRemoteVideo = useCallback(
    (targetUserId: string, currentlyPaused: boolean) => {
      if (!socket || !user) return;

      socket.emit("toggle-remote-video", {
        roomId,
        userId: user.id,
        targetUserId,
        force: currentlyPaused ? "unpause" : "pause",
      });

      toast.success(
        `${currentlyPaused ? "Enabled" : "Disabled"} participant's camera`
      );
    },
    [socket, user, roomId]
  );

  const removeParticipant = useCallback(
    (targetUserId: string, targetName: string) => {
      if (!socket || !user) return;

      const confirmed = confirm(
        `Are you sure you want to remove ${targetName} from this meeting?`
      );
      if (!confirmed) return;

      socket.emit("remove-participant", {
        roomId,
        userId: user.id,
        targetUserId,
      });

      toast.success(`Removed ${targetName} from the meeting`);
    },
    [socket, user, roomId]
  );

  // Global controls for all participants
  const muteAllParticipants = useCallback(() => {
    if (!socket || !user) {
      console.error("❌ Cannot mute all: socket or user not available");
      return;
    }

    console.log("🔇 Emitting mute-all-participants", {
      roomId,
      userId: user.id,
    });
    socket.emit("mute-all-participants", {
      roomId,
      userId: user.id,
    });

    toast.success("Muted all participant microphones");
  }, [socket, user, roomId]);

  const unmuteAllParticipants = useCallback(() => {
    if (!socket || !user) {
      console.error("❌ Cannot unmute all: socket or user not available");
      return;
    }

    console.log("🔊 Emitting unmute-all-participants", {
      roomId,
      userId: user.id,
    });
    socket.emit("unmute-all-participants", {
      roomId,
      userId: user.id,
    });

    toast.success("Unmuted all participant microphones");
  }, [socket, user, roomId]);

  const disableAllCameras = useCallback(() => {
    if (!socket || !user) {
      console.error("❌ Cannot disable cameras: socket or user not available");
      return;
    }

    console.log("📹 Emitting disable-all-cameras", { roomId, userId: user.id });
    socket.emit("disable-all-cameras", {
      roomId,
      userId: user.id,
    });

    toast.success("Disabled all participant cameras");
  }, [socket, user, roomId]);

  const enableAllCameras = useCallback(() => {
    if (!socket || !user) {
      console.error("❌ Cannot enable cameras: socket or user not available");
      return;
    }

    console.log("📹 Emitting enable-all-cameras", { roomId, userId: user.id });
    socket.emit("enable-all-cameras", {
      roomId,
      userId: user.id,
    });

    toast.success("Enabled all participant cameras");
  }, [socket, user, roomId]);

  const disableAllScreenSharing = useCallback(() => {
    if (!socket || !user) {
      console.error(
        "❌ Cannot disable screen sharing: socket or user not available"
      );
      return;
    }

    console.log("🖥️ Emitting disable-all-screen-sharing", {
      roomId,
      userId: user.id,
    });
    socket.emit("disable-all-screen-sharing", {
      roomId,
      userId: user.id,
    });

    toast.success("Disabled all screen sharing");
  }, [socket, user, roomId]);

  const enableAllScreenSharing = useCallback(() => {
    if (!socket || !user) {
      console.error(
        "❌ Cannot enable screen sharing: socket or user not available"
      );
      return;
    }

    console.log("🖥️ Emitting enable-all-screen-sharing", {
      roomId,
      userId: user.id,
    });
    socket.emit("enable-all-screen-sharing", {
      roomId,
      userId: user.id,
    });

    toast.success("Enabled screen sharing for all");
  }, [socket, user, roomId]);

  return {
    toggleRemoteAudio,
    toggleRemoteVideo,
    removeParticipant,
    muteAllParticipants,
    unmuteAllParticipants,
    disableAllCameras,
    enableAllCameras,
    disableAllScreenSharing,
    enableAllScreenSharing,
  };
}
