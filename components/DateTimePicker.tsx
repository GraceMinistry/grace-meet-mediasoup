"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export default function DateTimePicker({ value, onChange }: {
  value: Date;
  onChange: (date: Date) => void;
}) {

  const [open, setOpen] = useState(false);
  const [tempDate, setTempDate] = useState<Date>(value);

  // Generate time wheels
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const minutes = Array.from({ length: 60 }, (_, i) => i);

  const confirmSelection = () => {
    const finalDate = new Date(
      tempDate.getFullYear(),
      tempDate.getMonth(),
      tempDate.getDate(),
      tempDate.getHours(),
      tempDate.getMinutes()
    );
    onChange(finalDate);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="w-full justify-start bg-dark-3 text-white border border-dark-4"
        >
          {format(value, "MMMM d, yyyy - h:mm aa")}
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-[320px] sm:w-[360px] p-4 bg-dark-2 border border-dark-4">
        
        {/* Calendar */}
        <Label className="text-white text-sm mb-2">Select Date</Label>
        <Calendar
          mode="single"
          selected={tempDate}
          onSelect={(d) => d && setTempDate(new Date(
            d.getFullYear(),
            d.getMonth(),
            d.getDate(),
            tempDate.getHours(),
            tempDate.getMinutes()
          ))}
          className="rounded-md border border-dark-4"
        />

        {/* Time Wheel */}
        <div className="mt-4">
          <Label className="text-white text-sm">Select Time</Label>
          <div className="flex items-center justify-between mt-2 gap-4">

            {/* Hours Wheel */}
            <div className="flex-1 h-32 overflow-y-scroll text-center scrollbar-none bg-dark-3 rounded">
              {hours.map((h) => (
                <div
                  key={h}
                  className={`py-2 cursor-pointer ${
                    h === tempDate.getHours() ? "bg-blue-600 text-white" : "text-gray-300"
                  }`}
                  onClick={() =>
                    setTempDate(new Date(
                      tempDate.setHours(h)
                    ))
                  }
                >
                  {h.toString().padStart(2, "0")}
                </div>
              ))}
            </div>

            {/* Minutes Wheel */}
            <div className="flex-1 h-32 overflow-y-scroll text-center scrollbar-none bg-dark-3 rounded">
              {minutes.map((m) => (
                <div
                  key={m}
                  className={`py-2 cursor-pointer ${
                    m === tempDate.getMinutes() ? "bg-blue-600 text-white" : "text-gray-300"
                  }`}
                  onClick={() =>
                    setTempDate(new Date(
                      tempDate.setMinutes(m)
                    ))
                  }
                >
                  {m.toString().padStart(2, "0")}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Confirm */}
        <Button className="w-full mt-4 bg-red-2" onClick={confirmSelection}>
          Confirm
        </Button>
      </PopoverContent>
    </Popover>
  );
}
