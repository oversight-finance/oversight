"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";

type TimeRange = "3M" | "6M" | "1Y" | "2Y" | "ALL";

interface DatePeriodPickerProps {
  selectedRange: TimeRange;
  setSelectedRange: (range: TimeRange) => void;
  handleSlide: (direction: "left" | "right") => void;
  canSlideLeft: boolean;
  canSlideRight: boolean;
}

const DatePeriodPicker: React.FC<DatePeriodPickerProps> = ({
  selectedRange,
  setSelectedRange,
  handleSlide,
  canSlideLeft,
  canSlideRight,
}) => {
  return (
    <div className="flex items-center justify-between pt-2 border-t">
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleSlide("left")}
          disabled={!canSlideLeft}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleSlide("right")}
          disabled={!canSlideRight}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex items-center rounded-md border">
        {(["3M", "6M", "1Y", "2Y", "ALL"] as TimeRange[]).map((range) => (
          <Button
            key={range}
            variant="ghost"
            size="sm"
            onClick={() => {
              setSelectedRange(range);
              // Assuming you want to reset the slide index when range changes
            }}
            className={cn(
              "h-8 rounded-none px-3 first:rounded-l-md last:rounded-r-md",
              selectedRange === range && "bg-muted font-medium"
            )}
          >
            {range}
          </Button>
        ))}
      </div>
    </div>
  );
};

export default DatePeriodPicker; 