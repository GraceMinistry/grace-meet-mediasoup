// contexts/VideoElementContext.tsx
import { createContext, useContext, useState, useCallback } from "react";

interface VideoElementContextType {
  registerVideo: (sessionId: string, videoElement: HTMLVideoElement) => void;
  unregisterVideo: (sessionId: string) => void;
  getVideo: (sessionId: string) => HTMLVideoElement | null;
}

const VideoElementContext = createContext<VideoElementContextType | null>(null);

export const VideoElementProvider = ({ children }: { children: React.ReactNode }) => {
  const [videoElements] = useState(new Map<string, HTMLVideoElement>());

  const registerVideo = useCallback((sessionId: string, videoElement: HTMLVideoElement) => {
    videoElements.set(sessionId, videoElement);
  }, [videoElements]);

  const unregisterVideo = useCallback((sessionId: string) => {
    videoElements.delete(sessionId);
  }, [videoElements]);

  const getVideo = useCallback((sessionId: string) => {
    return videoElements.get(sessionId) || null;
  }, [videoElements]);

  return (
    <VideoElementContext.Provider value={{ registerVideo, unregisterVideo, getVideo }}>
      {children}
    </VideoElementContext.Provider>
  );
};

export const useVideoElements = () => {
  const context = useContext(VideoElementContext);
  if (!context) throw new Error("useVideoElements must be used within VideoElementProvider");
  return context;
};