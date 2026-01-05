"use client";

import { createContext, useContext, useRef, useState } from "react";
import type { Socket } from "socket.io-client";

type MediasoupContextType = {
  muteAudio: () => void;
  unmuteAudio: () => void;
  toggleAudio: () => void;
  isAudioMuted: boolean;
  registerMediasoupControls: (controls: {
    muteAudio: () => void;
    unmuteAudio: () => void;
    isAudioMuted: () => boolean;
  }) => void;
};

const MediasoupContext = createContext<MediasoupContextType | null>(null);

export const MediasoupProvider = ({ children }: { children: React.ReactNode }) => {
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const controlsRef = useRef<{
    muteAudio: () => void;
    unmuteAudio: () => void;
    isAudioMuted: () => boolean;
  } | null>(null);

  const registerMediasoupControls = (controls: {
    muteAudio: () => void;
    unmuteAudio: () => void;
    isAudioMuted: () => boolean;
  }) => {
    controlsRef.current = controls;
    setIsAudioMuted(controls.isAudioMuted());
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

  return (
    <MediasoupContext.Provider
      value={{
        muteAudio,
        unmuteAudio,
        toggleAudio,
        isAudioMuted,
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
