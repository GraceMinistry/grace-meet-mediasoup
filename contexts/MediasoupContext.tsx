"use client";

import { createContext, useContext, useRef, useState } from "react";
import type { Socket } from "socket.io-client";

type MediasoupContextType = {
  muteAudio: () => void;
  unmuteAudio: () => void;
  toggleAudio: () => void;
  isAudioMuted: boolean;
  enableVideo: () => void;
  disableVideo: () => void;
  toggleVideo: () => void;
  isVideoEnabled: boolean;
  registerMediasoupControls: (controls: {
    muteAudio: () => void;
    unmuteAudio: () => void;
    isAudioMuted: () => boolean;
    enableVideo: () => Promise<void>;
    disableVideo: () => void;
    toggleVideo: () => Promise<void>;
    isVideoEnabled: () => boolean;
  }) => void;
};

const MediasoupContext = createContext<MediasoupContextType | null>(null);

export const MediasoupProvider = ({ children }: { children: React.ReactNode }) => {
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(false);
  const controlsRef = useRef<{
    muteAudio: () => void;
    unmuteAudio: () => void;
    isAudioMuted: () => boolean;
    enableVideo: () => Promise<void>;
    disableVideo: () => void;
    toggleVideo: () => Promise<void>;
    isVideoEnabled: () => boolean;
  } | null>(null);

  const registerMediasoupControls = (controls: {
    muteAudio: () => void;
    unmuteAudio: () => void;
    isAudioMuted: () => boolean;
    enableVideo: () => Promise<void>;
    disableVideo: () => void;
    toggleVideo: () => Promise<void>;
    isVideoEnabled: () => boolean;
  }) => {
    controlsRef.current = controls;
    setIsAudioMuted(controls.isAudioMuted());
    setIsVideoEnabled(controls.isVideoEnabled());
  };

  const muteAudio = () => {
    if (controlsRef.current) {
      controlsRef.current.muteAudio();
      setIsAudioMuted(true);
    }
  };

  const unmuteAudio = () => {
    if (controlsRef.current) {
      controlsRef.current.unmuteAudio();
      setIsAudioMuted(false);
    }
  };

  const toggleAudio = () => {
    if (isAudioMuted) {
      unmuteAudio();
    } else {
      muteAudio();
    }
  };

  const enableVideo = async () => {
    if (controlsRef.current) {
      await controlsRef.current.enableVideo();
      setIsVideoEnabled(true);
    }
  };

  const disableVideo = () => {
    if (controlsRef.current) {
      controlsRef.current.disableVideo();
      setIsVideoEnabled(false);
    }
  };

  const toggleVideo = async () => {
    if (isVideoEnabled) {
      disableVideo();
    } else {
      await enableVideo();
    }
  };

  return (
    <MediasoupContext.Provider
      value={{
        muteAudio,
        unmuteAudio,
        toggleAudio,
        isAudioMuted,
        enableVideo,
        disableVideo,
        toggleVideo,
        isVideoEnabled,
        registerMediasoupControls,
      }}
    >
      {children}
    </MediasoupContext.Provider>
  );
};

export const useMediasoupContext = () => {
  const context = useContext(MediasoupContext);
  if (!context) {
    throw new Error("useMediasoupContext must be used within MediasoupProvider");
  }
  return context;
};
