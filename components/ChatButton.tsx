"use client";

import { Button } from "./ui/button";
import { MessageSquare } from "lucide-react";

type ChatButtonProps = {
  onClick: () => void;
};

const ChatButton = ({ onClick }: ChatButtonProps) => {
  return (
    <Button
      onClick={onClick}
      variant="secondary"
      className="
        bg-[#1c2732] hover:bg-[#2c3641]
        border border-white/10 
        rounded-xl h-10 px-4
        flex items-center gap-2
      "
    >
      <MessageSquare size={18} className="text-white" />
    </Button>
  );
};

export default ChatButton;
