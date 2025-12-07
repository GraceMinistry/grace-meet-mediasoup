// hooks/useAutoPictureInPicture.tsx
import { useEffect, useState, useCallback, useMemo } from "react";
import { 
    useCallStateHooks,
    hasScreenShare
} from "@stream-io/video-react-sdk";
import { useVideoElements } from "@/contexts/VideoElementContext";

export const useAutoPictureInPicture = () => {
    const { 
        useDominantSpeaker, 
        useHasOngoingScreenShare,
        useParticipants 
    } = useCallStateHooks();

    const participants = useParticipants();
    const dominantSpeaker = useDominantSpeaker();
    const hasOngoingScreenShare = useHasOngoingScreenShare();
    const { getVideo } = useVideoElements();

    const [isPiPActive, setIsPiPActive] = useState(false);
    const [pipWindow, setPipWindow] = useState<Window | null>(null);

    const screenSharer = useMemo(
        () => participants.find((p) => hasScreenShare(p)),
        [participants]
    );

    // Priority logic for selecting participant
    const getTargetParticipant = useCallback(() => {
        // Priority 1: Screen sharer
        if (hasOngoingScreenShare && screenSharer) {
            return screenSharer;
        }
        // Priority 2: Dominant speaker
        if (dominantSpeaker) {
            return dominantSpeaker;
        }
        // Priority 3: First remote participant
        return participants.find(p => !p.isLocalParticipant) || null;
    }, [dominantSpeaker, hasOngoingScreenShare, screenSharer, participants]);

    const currentTargetParticipant = useMemo(() => getTargetParticipant(), [getTargetParticipant]);

    // Document PiP toggle
    const toggleDocumentPiP = useCallback(async () => {
        if (!("documentPictureInPicture" in window)) {
            console.warn("Document PiP not supported");
            return;
        }

        if (pipWindow) {
            pipWindow.close();
            setPipWindow(null);
        } else {
            try {
                const pw = await (window as any).documentPictureInPicture.requestWindow({
                    width: 400,
                    height: 300
                });

                // Copy stylesheets to PiP window
                window.document.head
                    .querySelectorAll('link[rel="stylesheet"], style')
                    .forEach((node) => {
                        pw.document.head.appendChild(node.cloneNode(true));
                    });

                // Handle window close
                pw.addEventListener("pagehide", () => {
                    setPipWindow(null);
                    setIsPiPActive(false);
                });

                setPipWindow(pw);
                setIsPiPActive(true);
            } catch (error) {
                console.error("Document PiP failed:", error);
            }
        }
    }, [pipWindow]);

    // Video PiP toggle (fallback)
    const toggleVideoPiP = useCallback(async () => {
        if (document.pictureInPictureElement) {
            await document.exitPictureInPicture().catch(console.error);
        } else {
            const targetVideo = currentTargetParticipant ? getVideo(currentTargetParticipant.sessionId) : null;
            if (targetVideo && document.pictureInPictureEnabled) {
                await targetVideo.requestPictureInPicture().catch(console.error);
            }
        }
    }, [currentTargetParticipant, getVideo]);

    // Unified toggle - prefer Document PiP
    const togglePiP = useCallback(async () => {
        if ("documentPictureInPicture" in window) {
            await toggleDocumentPiP();
        } else {
            await toggleVideoPiP();
        }
    }, [toggleDocumentPiP, toggleVideoPiP]);

    // Track Video PiP state
    useEffect(() => {
        const handlePiPEvent = () => {
            setIsPiPActive(!!document.pictureInPictureElement);
        };

        document.addEventListener("enterpictureinpicture", handlePiPEvent);
        document.addEventListener("leavepictureinpicture", handlePiPEvent);

        return () => {
            document.removeEventListener("enterpictureinpicture", handlePiPEvent);
            document.removeEventListener("leavepictureinpicture", handlePiPEvent);
        };
    }, []);

    const isPiPSupported = "documentPictureInPicture" in window || document.pictureInPictureEnabled;

    return { 
        togglePiP, 
        isPiPActive, 
        isPiPSupported,
        pipWindow,
        currentTargetParticipant,
        isDocumentPiP: !!pipWindow
    };
};