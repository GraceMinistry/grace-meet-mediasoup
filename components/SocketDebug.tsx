"use client";

import { useEffect, useState } from "react";
import { getSocket } from "@/lib/socket";
import { useMediasoupContext } from "@/contexts/MediasoupContext";

export const SocketDebug = () => {
  const [socketInfo, setSocketInfo] = useState({
    id: "",
    connected: false,
    url: "",
    transport: "",
    error: "",
  });
  const {
    socket: mediasoupSocket,
    participants,
    remoteStreams,
  } = useMediasoupContext();

  useEffect(() => {
    const socket = getSocket();

    const updateInfo = () => {
      setSocketInfo({
        id: socket.id || "Not connected",
        connected: socket.connected,
        url: process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:8080",
        transport: (socket as any)?.io?.engine?.transport?.name || "N/A",
        error: "",
      });
    };

    const handleError = (error: any) => {
      setSocketInfo((prev) => ({
        ...prev,
        error: error.message || "Connection failed",
      }));
    };

    updateInfo();
    socket.on("connect", updateInfo);
    socket.on("disconnect", updateInfo);
    socket.on("connect_error", handleError);

    const interval = setInterval(updateInfo, 2000);

    return () => {
      socket.off("connect", updateInfo);
      socket.off("disconnect", updateInfo);
      socket.off("connect_error", handleError);
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="fixed top-4 right-4 bg-black/90 text-white p-4 rounded-lg text-xs font-mono z-50 max-w-md">
      <div className="font-bold mb-2 text-green-400">🔌 Socket Debug</div>

      <div className="space-y-1">
        <div>
          <span className="text-gray-400">URL:</span>{" "}
          <span className="text-blue-400 break-all">{socketInfo.url}</span>
        </div>

        <div>
          <span className="text-gray-400">Status:</span>{" "}
          <span
            className={socketInfo.connected ? "text-green-400" : "text-red-400"}
          >
            {socketInfo.connected ? "✅ Connected" : "❌ Disconnected"}
          </span>
        </div>

        {socketInfo.error && (
          <div className="bg-red-900/30 p-2 rounded border border-red-500 my-2">
            <div className="text-red-400 font-bold">⚠️ Error:</div>
            <div className="text-red-300 text-[10px] mt-1">
              {socketInfo.error}
            </div>
            <div className="text-yellow-300 text-[10px] mt-2">
              Check console for troubleshooting steps
            </div>
          </div>
        )}

        <div>
          <span className="text-gray-400">Socket ID:</span>{" "}
          <span className="text-yellow-400">{socketInfo.id}</span>
        </div>

        {socketInfo.transport && socketInfo.transport !== "N/A" && (
          <div>
            <span className="text-gray-400">Transport:</span>{" "}
            <span className="text-cyan-400">{socketInfo.transport}</span>
          </div>
        )}

        <div className="mt-3 pt-2 border-t border-gray-700">
          <span className="text-gray-400">Context Socket:</span>{" "}
          <span className={mediasoupSocket ? "text-green-400" : "text-red-400"}>
            {mediasoupSocket ? "✅ Set" : "❌ Not set"}
          </span>
        </div>

        <div>
          <span className="text-gray-400">Participants:</span>{" "}
          <span className="text-purple-400">{participants.length}</span>
        </div>

        <div>
          <span className="text-gray-400">Remote Streams:</span>{" "}
          <span className="text-purple-400">{remoteStreams.size}</span>
        </div>
      </div>

      <div className="mt-3 pt-2 border-t border-gray-700 text-[10px]">
        <div className="text-gray-500">
          Check browser console for detailed logs
        </div>
        {!socketInfo.connected && (
          <div className="text-orange-400 mt-2 font-semibold">
            💡 Make sure your backend server is running!
          </div>
        )}
      </div>
    </div>
  );
};
