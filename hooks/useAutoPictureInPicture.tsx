// hooks/useAutoPictureInPicture.tsx
import { useEffect, useState, useCallback, useMemo } from "react";
import {
    useCallStateHooks,
    hasScreenShare,
} from "@stream-io/video-react-sdk";

/* ------------------------------------------------------
   FIXED AVATAR COLORS (rotates consistently per user)
------------------------------------------------------- */
const AVATAR_COLORS = [
    "#FF6B6B", // red
    "#4ECDC4", // teal
    "#556270", // dark blue gray
    "#C44DFF", // purple
    "#45B7D1", // sky blue
    "#FFA931", // orange
    "#6BCB77", // green
    "#F7B801", // gold
];

const getColorForUser = (userId: string) => {
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
        hash = userId.charCodeAt(i) + ((hash << 5) - hash);
    }
    return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
};

/* ------------------------------------------------------
   CREATE FAKE VIDEO STREAM FOR AVATAR (iOS SAFE)
------------------------------------------------------- */
const createAvatarVideoForParticipant = (participant: any) => {
    const id = `avatar-video-${participant.sessionId}`;
    const existing = document.getElementById(id) as HTMLVideoElement | null;
    if (existing) return existing;

    // Canvas for fake video stream
    const canvas = document.createElement("canvas");
    canvas.width = 640;
    canvas.height = 360;
    const ctx = canvas.getContext("2d")!;

    // Background
    ctx.fillStyle = "#1f1f1f";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Colored circle avatar (no initials)
    const circleX = canvas.width / 2;
    const circleY = canvas.height / 2 - 40;
    const radius = 80;
    ctx.beginPath();
    ctx.arc(circleX, circleY, radius, 0, Math.PI * 2);
    ctx.closePath();
    ctx.fillStyle = getColorForUser(participant.userId);
    ctx.fill();

    // Name text
    ctx.fillStyle = "white";
    ctx.font = "32px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(
        participant.name || participant.userId,
        canvas.width / 2,
        circleY + radius + 40
    );

    // Create fake stream
    const stream = canvas.captureStream(15);

    // Create hidden HTMLVideoElement
    const video = document.createElement("video");
    video.id = id;
    video.srcObject = stream;
    video.muted = true;
    video.playsInline = true;
    video.style.display = "none";

    document.body.appendChild(video);
    video.play();

    return video;
};

/* ------------------------------------------------------
   MAIN HOOK
------------------------------------------------------- */
export const useAutoPictureInPicture = () => {
    const { useDominantSpeaker, useHasOngoingScreenShare, useParticipants } =
        useCallStateHooks();

    const participants = useParticipants();
    const dominantSpeaker = useDominantSpeaker();
    const hasOngoingScreenShare = useHasOngoingScreenShare();

    const [isPiPActive, setIsPiPActive] = useState(false);
    const [pipWindow, setPipWindow] = useState<Window | null>(null);

    const screenSharer = useMemo(
        () => participants.find((p) => hasScreenShare(p)),
        [participants]
    );

    /* -------------------------------------------
       Determine target participant for PiP
    --------------------------------------------- */
    const getTargetParticipant = useCallback(() => {
        if (hasOngoingScreenShare && screenSharer) return screenSharer;
        if (dominantSpeaker) return dominantSpeaker;
        return participants[0] || null;
    }, [dominantSpeaker, hasOngoingScreenShare, screenSharer, participants]);

    const currentTargetParticipant = useMemo(
        () => getTargetParticipant(),
        [getTargetParticipant]
    );

    /* -------------------------------------------
       DOCUMENT PIP FOR DESKTOP
    --------------------------------------------- */
    const toggleDocumentPiP = useCallback(async () => {
        if (!("documentPictureInPicture" in window)) return;

        if (pipWindow) {
            pipWindow.close();
            setPipWindow(null);
            setIsPiPActive(false);
            return;
        }

        try {
            const pw = await (window as any).documentPictureInPicture.requestWindow({
                width: 400,
                height: 300,
            });

            // Copy styles
            document.head
                .querySelectorAll("link[rel='stylesheet'], style")
                .forEach((node) =>
                    pw.document.head.appendChild(node.cloneNode(true))
                );

            pw.addEventListener("pagehide", () => {
                setPipWindow(null);
                setIsPiPActive(false);
            });

            setPipWindow(pw);
            setIsPiPActive(true);
        } catch (err) {
            console.error("Document PiP failed:", err);
        }
    }, [pipWindow]);

    /* -------------------------------------------
       VIDEO PIP FALLBACK (iOS/Android)
    --------------------------------------------- */
    const toggleVideoPiP = useCallback(async () => {
        try {
            if (document.pictureInPictureElement) {
                await document.exitPictureInPicture();
                setIsPiPActive(false);
                return;
            }

            if (!currentTargetParticipant) return;

            const videoEls = Array.from(
                document.querySelectorAll("video")
            ) as HTMLVideoElement[];

            let targetVideo: HTMLVideoElement | null = null;

            // Try to find REAL video first
            targetVideo = videoEls.find(
                (v) => v.srcObject && v.readyState >= 2
            ) || null;

            // If no real video: create avatar video
            if (!targetVideo) {
                targetVideo = createAvatarVideoForParticipant(currentTargetParticipant);
            }

            if (!targetVideo) return;

            if ("requestPictureInPicture" in targetVideo) {
                await targetVideo.requestPictureInPicture();
                setIsPiPActive(true);
            }
        } catch (err) {
            console.error("Video PiP failed:", err);
        }
    }, [currentTargetParticipant]);

    /* -------------------------------------------
       UNIFIED TOGGLE
    --------------------------------------------- */
    const togglePiP = useCallback(async () => {
        if ("documentPictureInPicture" in window) {
            await toggleDocumentPiP();
        } else {
            await toggleVideoPiP();
        }
    }, [toggleDocumentPiP, toggleVideoPiP]);

    /* -------------------------------------------
       Listen for PiP events
    --------------------------------------------- */
    useEffect(() => {
        const enter = () => setIsPiPActive(true);
        const leave = () => setIsPiPActive(false);

        document.addEventListener("enterpictureinpicture", enter);
        document.addEventListener("leavepictureinpicture", leave);

        return () => {
            document.removeEventListener("enterpictureinpicture", enter);
            document.removeEventListener("leavepictureinpicture", leave);
        };
    }, []);

    /* -------------------------------------------
       SUPPORT CHECKS
    --------------------------------------------- */
    const isPiPSupported =
        "documentPictureInPicture" in window ||
        (document.pictureInPictureEnabled === true);

    const isDocumentPiP = !!pipWindow && isPiPActive;

    return {
        togglePiP,
        isPiPActive,
        isPiPSupported,
        pipWindow,
        currentTargetParticipant,
        isDocumentPiP,
    };
};
