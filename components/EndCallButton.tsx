import { useState } from 'react';
import { useCall, useCallStateHooks } from '@stream-io/video-react-sdk';
import { Button } from './ui/button';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

const EndCallButton = () => {
  const call = useCall();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  if (!call) throw new Error('useStreamCall must be used within a StreamCall component.');

  const { useLocalParticipant } = useCallStateHooks();
  const localParticipant = useLocalParticipant();

  const isMeetingOwner =
    localParticipant &&
    call.state.createdBy &&
    localParticipant.userId === call.state.createdBy.id;

  if (!isMeetingOwner) return null;

  const endCall = async () => {
    await call.endCall();
    router.push('/');
  };

  return (
    <>
      <Button onClick={() => setOpen(true)} className="bg-red-500">
        End call for everyone
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">End call?</DialogTitle>
          </DialogHeader>

          <p className="text-base text-gray-600">Are you sure you want to end the call for everyone?</p>

          <DialogFooter className="flex gap-3 mt-6">
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button className="bg-red-500" onClick={endCall}>
              Yes, end call
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default EndCallButton;
