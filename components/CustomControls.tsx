import {
  CancelCallButton,
  ScreenShareButton,
  SpeakingWhileMutedNotification,
  ToggleVideoPublishingButton,
  useCall,
  RecordCallButton,
} from "@stream-io/video-react-sdk";
import { useRouter } from "next/navigation";
import { useCallStateHooks } from "@stream-io/video-react-sdk";
import MediasoupAudioButton from "./MediasoupAudioButton";

const CustomCallControls = () => {
  const call = useCall();
  const router = useRouter();

  const { useLocalParticipant } = useCallStateHooks();
  const localParticipant = useLocalParticipant();

  // ✅ Check if user is admin
  const isAdmin = localParticipant?.roles?.includes("admin");

  return (
    <div className="str-video__call-controls">
      <SpeakingWhileMutedNotification>
        <MediasoupAudioButton />
      </SpeakingWhileMutedNotification>

      <ToggleVideoPublishingButton />

      <CancelCallButton onLeave={() => router.push("/")} />

      <div className="screen-share-btn">
        <ScreenShareButton />
      </div>

      {/* ✅ Show ONLY if user is admin */}
      {isAdmin && <RecordCallButton />}
    </div>
  );
};

export default CustomCallControls;
