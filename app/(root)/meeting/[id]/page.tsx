'use client';

import { useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { useParams } from 'next/navigation';
import { Loader } from 'lucide-react';

import MeetingSetup from '@/components/MeetingSetup';
import MeetingRoom from '@/components/MeetingRoom';
import MeetingRoomWrapper from '@/components/MeetingRoomWrapper';
import { useMediasoupContext } from '@/providers/MediasoupProvider';

const MeetingPage = () => {
  const { id: rawId } = useParams();
  const roomId = typeof rawId === "string" ? rawId : "";  
  const { isLoaded, user } = useUser();
  
  // ✅ Get initialization status from context
  const { isInitialized } = useMediasoupContext();
  const [isSetupComplete, setIsSetupComplete] = useState(false);

  // While Clerk is loading OR Mediasoup is connecting, show loader
  if (!isLoaded || !isInitialized) return (
    <div className="flex flex-col items-center justify-center h-screen w-full bg-dark-2 gap-4">
      <Loader className="animate-spin text-white w-10 h-10" />
      <p className="text-white/70 text-sm">Initializing media session...</p>
    </div>
  );

  return (
    <main className="h-screen w-full bg-dark-2">
      <MeetingRoomWrapper roomId={roomId}>
        {!isSetupComplete ? (
          <MeetingSetup setIsSetupComplete={setIsSetupComplete} />
        ) : (
          <MeetingRoom />
        )}
      </MeetingRoomWrapper>
    </main>
  );
};

export default MeetingPage;