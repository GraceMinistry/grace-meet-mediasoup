"use client";

import { ReactNode, useEffect, useState } from "react";
import { StreamVideoClient, StreamVideo } from "@stream-io/video-react-sdk";
import { StreamChat } from "stream-chat";
import { Chat } from "stream-chat-react";
import "stream-chat-react/dist/css/v2/index.css";

import { useUser } from "@clerk/nextjs";
import { tokenProvider, chatTokenProvider } from "@/actions/stream.actions";
import Loader from "@/components/Loader";

const API_KEY = process.env.NEXT_PUBLIC_STREAM_API_KEY;

const StreamProvider = ({ children }: { children: ReactNode }) => {
  const [videoClient, setVideoClient] = useState<StreamVideoClient>();
  const [chatClient, setChatClient] = useState<StreamChat>();
  const { user, isLoaded } = useUser();

  useEffect(() => {
    if (!isLoaded || !user) return;
    if (!API_KEY) throw new Error("Stream API key is missing");

    const initClients = async () => {
      // VIDEO CLIENT
      const vc = new StreamVideoClient({
        apiKey: API_KEY,
        user: {
          id: user.id,
          name: user.username || user.id,
          image: user.imageUrl,
        },
        tokenProvider,
      });

      // CHAT CLIENT
      const cc = new StreamChat(API_KEY);
      await cc.connectUser(
        {
          id: user.id,
          name: user.username || user.id,
          image: user.imageUrl,
        },
        chatTokenProvider
      );

      setVideoClient(vc);
      setChatClient(cc);
    };

    initClients();

    return () => {
      videoClient?.disconnectUser();
      chatClient?.disconnectUser();
    };
  }, [user, isLoaded]);

  if (!videoClient || !chatClient) return <Loader />;

  return (
    <StreamVideo client={videoClient}>
      <Chat client={chatClient}>{children}</Chat>
    </StreamVideo>
  );
};

export default StreamProvider;
