'use server';

import { currentUser } from '@clerk/nextjs/server';
import { StreamClient } from '@stream-io/node-sdk';   // VIDEO
import { StreamChat } from 'stream-chat';             // CHAT

const STREAM_API_KEY = process.env.NEXT_PUBLIC_STREAM_API_KEY;
const STREAM_API_SECRET = process.env.STREAM_SECRET_KEY;

// --------------------
// VIDEO TOKEN PROVIDER
// --------------------
export const tokenProvider = async () => {
  const user = await currentUser();

  if (!user) throw new Error('User is not authenticated');
  if (!STREAM_API_KEY) throw new Error('Stream API key is missing');
  if (!STREAM_API_SECRET) throw new Error('Stream API secret is missing');

  const streamClient = new StreamClient(STREAM_API_KEY, STREAM_API_SECRET);

  const expiration = Math.floor(Date.now() / 1000) + 3600;
  const issued = Math.floor(Date.now() / 1000) - 60;

  const token = streamClient.createToken(user.id, expiration, issued);
  return token;
};

// --------------------
// CHAT TOKEN PROVIDER
// --------------------
export const chatTokenProvider = async () => {
  const user = await currentUser();

  if (!user) throw new Error('User is not authenticated');
  if (!STREAM_API_KEY) throw new Error('Stream API key is missing');
  if (!STREAM_API_SECRET) throw new Error('Stream API secret is missing');

  const chatServer = new StreamChat(STREAM_API_KEY, STREAM_API_SECRET);


  const token = chatServer.createToken(user.id);
  return token;
};

// ----------------------
// ENSURE CHAT CHANNEL
// ----------------------
export const ensureCallChatChannel = async (callId: string, memberIds: string[]) => {
  const user = await currentUser();

  if (!user) throw new Error("User is not authenticated");
  if (!STREAM_API_KEY) throw new Error("Stream API key is missing");
  if (!STREAM_API_SECRET) throw new Error("Stream API secret is missing");

  const chatServer = new StreamChat(STREAM_API_KEY, STREAM_API_SECRET);

  const allMembers = Array.from(new Set([user.id, ...memberIds]));

  const channel = chatServer.channel(
    "messaging",
    callId,
    {
      created_by_id: user.id,
      members: allMembers,
    }
  );

  try {
    await channel.create();
  } catch (error: any) {
    if (error.code === 4) {
      await channel.addMembers(allMembers);
    } else {
      throw error;
    }
  }

  return true;
};





export const addMemberToChatChannel = async (callId: string, userId: string) => {
  if (!STREAM_API_KEY) throw new Error("Stream API key is missing");
  if (!STREAM_API_SECRET) throw new Error("Stream API secret is missing");

  const chatServer = new StreamChat(STREAM_API_KEY, STREAM_API_SECRET);
  const channel = chatServer.channel("messaging", callId);
  
  await channel.addMembers([userId]);
  
  return true;
};



