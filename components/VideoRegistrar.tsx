// components/VideoRegistrar.tsx
import { useEffect } from "react";
import { useParticipantViewContext } from "@stream-io/video-react-sdk";
import { useVideoElements } from "../contexts/VideoElementContext";

const VideoRegistrar = () => {
  const { videoElement, participant } = useParticipantViewContext();
  const { registerVideo, unregisterVideo } = useVideoElements();

  useEffect(() => {
    if (!videoElement || !participant.sessionId) return;

    registerVideo(participant.sessionId, videoElement);

    return () => {
      unregisterVideo(participant.sessionId);
    };
  }, [videoElement, participant.sessionId, registerVideo, unregisterVideo]);

  return null; // This component only registers, doesn't render anything
};

export default VideoRegistrar;