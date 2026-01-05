"use client";

import { useRef, useEffect } from "react";
import * as mediasoupClient from "mediasoup-client";
import type { Socket } from "socket.io-client";
import { getMicTrack } from "@/lib/useMicrophone";

async function getCameraTrack() {
  const stream = await navigator.mediaDevices.getUserMedia({
    video: {
      width: { ideal: 1280 },
      height: { ideal: 720 },
      frameRate: { ideal: 30 },
    },
  });
  return stream.getVideoTracks()[0];
}

export function useMediasoup(socket: Socket | null) {
  const deviceRef = useRef<mediasoupClient.Device | null>(null);
  const sendTransportRef = useRef<any>(null);
  const recvTransportRef = useRef<any>(null);
  const startedRef = useRef(false);
  const audioElementsRef = useRef<HTMLAudioElement[]>([]);
  const videoElementsRef = useRef<Map<string, HTMLVideoElement>>(new Map());
  const micTrackRef = useRef<MediaStreamTrack | null>(null);
  const camTrackRef = useRef<MediaStreamTrack | null>(null);
  const newProducerHandlerRef = useRef<any>(null);
  const unloadBoundRef = useRef(false);
  const audioProducerRef = useRef<any>(null);
  const videoProducerRef = useRef<any>(null);

  const initMediasoup = async (roomId: string) => {
    if (!socket) return;
    if (startedRef.current) return;
    startedRef.current = true;

    /* =========================
        RTP CAPABILITIES
    ========================= */
    const { rtpCapabilities } = await new Promise<any>((resolve) => {
      socket.emit("get-rtp-capabilities", { roomId }, resolve);
    });

    const device = new mediasoupClient.Device();
    await device.load({ routerRtpCapabilities: rtpCapabilities });
    deviceRef.current = device;

    // ✅ CHANGE 1: Capture existingProducers from the response
    const { existingProducers } = await new Promise<any>((resolve) => {
      socket.emit(
        "join-mediasoup-room",
        { roomId, rtpCapabilities: device.rtpCapabilities },
        resolve
      );
    });

    /* =========================
        SEND TRANSPORT (MIC)
    ========================= */
    // ✅ CHANGE 2: Add { direction: "send" }
    const { params: sendParams } = await new Promise<any>((resolve) => {
      socket.emit(
        "create-webrtc-transport",
        { roomId, direction: "send" },
        resolve
      );
    });

    const sendTransport = device.createSendTransport(sendParams);

    sendTransport.on("connect", ({ dtlsParameters }, cb, eb) => {
      socket.emit(
        "connect-transport",
        { roomId, transportId: sendTransport.id, dtlsParameters },
        (res: any) => (res?.error ? eb(res.error) : cb())
      );
    });

    sendTransport.on("produce", ({ kind, rtpParameters }, cb, eb) => {
      socket.emit(
        "produce",
        {
          roomId,
          transportId: sendTransport.id,
          kind,
          rtpParameters,
        },
        ({ id, error }: any) => (error ? eb(error) : cb({ id }))
      );
    });

    const track = await getMicTrack();
    micTrackRef.current = track;

    const producer = await sendTransport.produce({
      track,
      codecOptions: {
        opusStereo: false,
        opusDtx: true,
      },
    });

    audioProducerRef.current = producer;
    sendTransportRef.current = sendTransport;
    console.log("🎤 Audio producer created");

    /* =========================
        RECV TRANSPORT (HEAR OTHERS)
    ========================= */
    // ✅ CHANGE 3: Add { direction: "recv" }
    const { params: recvParams } = await new Promise<any>((resolve) => {
      socket.emit(
        "create-webrtc-transport",
        { roomId, direction: "recv" },
        resolve
      );
    });

    const recvTransport = device.createRecvTransport(recvParams);

    recvTransport.on("connect", ({ dtlsParameters }, cb, eb) => {
      socket.emit(
        "connect-transport",
        { roomId, transportId: recvTransport.id, dtlsParameters },
        (res: any) => (res?.error ? eb(res.error) : cb())
      );
    });

    recvTransportRef.current = recvTransport;

    /* =========================
        CONSUME AUDIO/VIDEO LOGIC
    ========================= */

    // We create a function so we can use it for BOTH new and existing producers
    const consumeProducer = async (producerId: string) => {
      const data = await new Promise<any>((resolve) => {
        socket.emit(
          "consume",
          {
            roomId,
            producerId,
            rtpCapabilities: device.rtpCapabilities,
          },
          resolve
        );
      });

      if (!data || data.error) return;

      const consumer = await recvTransport.consume({
        id: data.id,
        producerId: data.producerId,
        kind: data.kind,
        rtpParameters: data.rtpParameters,
      });

      const stream = new MediaStream([consumer.track]);

      if (consumer.kind === "audio") {
        const audio = document.createElement("audio");
        audio.srcObject = stream;
        audio.autoplay = true;
        (audio as any).playsInline = true;
        document.body.appendChild(audio);
        audioElementsRef.current.push(audio);
      } else if (consumer.kind === "video") {
        // Video will be handled by VideoRegistrar component
        // Store consumer info for later retrieval
        const event = new CustomEvent("mediasoup-video-consumer", {
          detail: { consumerId: consumer.id, producerId: data.producerId, stream },
        });
        window.dispatchEvent(event);
      }

      socket.emit("resume-consumer", {
        roomId,
        consumerId: consumer.id,
      });
    };

    // ✅ CHANGE 4: Consume everyone who is already talking
    if (existingProducers) {
      existingProducers.forEach((id: string) => consumeProducer(id));
    }

    // Listen for people who join later
    const handler = async ({ producerId }: { producerId: string }) => {
      await consumeProducer(producerId);
    };

    newProducerHandlerRef.current = handler;
    socket.on("new-producer", handler);

    console.log("✅ Mediasoup audio fully connected");

    if (!unloadBoundRef.current) {
      window.addEventListener("beforeunload", cleanup);
      window.addEventListener("pagehide", cleanup);
      unloadBoundRef.current = true;
    }
  };

  const cleanup = () => {
    console.log("🧹 Cleaning up mediasoup");

    // 🔥 Stop mic
    micTrackRef.current?.stop();
    micTrackRef.current = null;

    // 🔥 Stop camera
    camTrackRef.current?.stop();
    camTrackRef.current = null;

    // 🔥 Close producers
    audioProducerRef.current?.close();
    audioProducerRef.current = null;
    videoProducerRef.current?.close();
    videoProducerRef.current = null;

    // 🔥 Close transports
    sendTransportRef.current?.close();
    recvTransportRef.current?.close();

    sendTransportRef.current = null;
    recvTransportRef.current = null;

    // 🔥 Remove audio elements
    audioElementsRef.current.forEach((audio) => {
      audio.pause();
      audio.srcObject = null;
      audio.remove();
    });
    audioElementsRef.current = [];

    // 🔥 Remove video elements
    videoElementsRef.current.clear();

    if (newProducerHandlerRef.current && socket) {
      socket.off("new-producer", newProducerHandlerRef.current);
      newProducerHandlerRef.current = null;
    }

    startedRef.current = false;
  };

  const muteAudio = () => {
    if (audioProducerRef.current && !audioProducerRef.current.paused) {
      audioProducerRef.current.pause();
      console.log("🔇 Audio muted");
    }
  };

  const unmuteAudio = () => {
    if (audioProducerRef.current && audioProducerRef.current.paused) {
      audioProducerRef.current.resume();
      console.log("🔊 Audio unmuted");
    }
  };

  const isAudioMuted = () => {
    return audioProducerRef.current ? audioProducerRef.current.paused : true;
  };

  const enableVideo = async () => {
    if (!sendTransportRef.current || videoProducerRef.current) return;

    try {
      const track = await getCameraTrack();
      camTrackRef.current = track;

      const producer = await sendTransportRef.current.produce({ track });
      videoProducerRef.current = producer;
      
      // Dispatch event for local video
      const event = new CustomEvent("mediasoup-local-video", {
        detail: { stream: new MediaStream([track]) },
      });
      window.dispatchEvent(event);

      console.log("📹 Video producer created");
    } catch (error) {
      console.error("Failed to enable video:", error);
    }
  };

  const disableVideo = () => {
    if (camTrackRef.current) {
      camTrackRef.current.stop();
      camTrackRef.current = null;
    }
    if (videoProducerRef.current) {
      videoProducerRef.current.close();
      videoProducerRef.current = null;
      
      // Dispatch event to clear local video
      const event = new CustomEvent("mediasoup-local-video", {
        detail: { stream: null },
      });
      window.dispatchEvent(event);
      
      console.log("📹 Video disabled");
    }
  };

  const toggleVideo = async () => {
    if (videoProducerRef.current) {
      disableVideo();
    } else {
      await enableVideo();
    }
  };

  const isVideoEnabled = () => {
    return !!videoProducerRef.current;
  };

  useEffect(() => {
    return () => {
      cleanup(); 
    };
  }, []);

  return { 
    initMediasoup, 
    cleanup, 
    muteAudio, 
    unmuteAudio, 
    isAudioMuted,
    enableVideo,
    disableVideo,
    toggleVideo,
    isVideoEnabled,
  };

}
