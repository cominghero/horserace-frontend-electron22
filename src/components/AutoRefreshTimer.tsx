import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Timer, X } from "lucide-react";

interface AutoRefreshTimerProps {
  onRefresh: () => void;
  onTimerStateChange: (isActive: boolean) => void;
  disabled?: boolean;
}

const INTERVAL_OPTIONS = [
  { value: "5", label: "5 min" },
  { value: "15", label: "15 min" },
  { value: "30", label: "30 min" },
  { value: "60", label: "60 min" },
];

export const AutoRefreshTimer = ({ onRefresh, onTimerStateChange, disabled = false }: AutoRefreshTimerProps) => {
  const [selectedInterval, setSelectedInterval] = useState<string>("5");
  const [isActive, setIsActive] = useState<boolean>(false);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, []);

  // Start timer
  const startTimer = () => {
    const intervalMinutes = parseInt(selectedInterval);
    const intervalMs = intervalMinutes * 60 * 1000;

    // Trigger immediate refresh
    onRefresh();

    // Set initial countdown
    setTimeRemaining(intervalMinutes * 60);

    // Set up interval for auto-refresh
    timerRef.current = setInterval(() => {
      console.log(`🔄 Auto-refresh triggered (${intervalMinutes} min interval)`);
      onRefresh();
      setTimeRemaining(intervalMinutes * 60); // Reset countdown
    }, intervalMs);

    // Set up countdown timer (updates every second)
    countdownRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          return intervalMinutes * 60; // Reset when reaching 0
        }
        return prev - 1;
      });
    }, 1000);

    setIsActive(true);
    onTimerStateChange(true);
  };

  // Stop timer
  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
    setIsActive(false);
    setTimeRemaining(0);
    onTimerStateChange(false);
  };

  // Format time remaining as MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex items-center gap-2">
      {/* Interval Selector */}
      <Select
        value={selectedInterval}
        onValueChange={setSelectedInterval}
        disabled={isActive || disabled}
      >
        <SelectTrigger className="w-24 text-button">
          <SelectValue placeholder="Select interval" />
        </SelectTrigger>
        <SelectContent>
          {INTERVAL_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Start/Cancel Button */}
      {!isActive ? (
        <Button
          onClick={startTimer}
          variant="outline"
          size="sm"
          className="text-button flex items-center gap-2"
          disabled={disabled}
        >
          <Timer className="w-4 h-4" />
          Start
        </Button>
      ) : (
        <div className="flex items-center gap-2">
          <Button
            onClick={stopTimer}
            variant="destructive"
            size="sm"
            className="text-button flex items-center gap-2"
          >
            <X className="w-4 h-4" />
            Cancel
          </Button>
          <span className="text-sm text-muted-foreground font-mono min-w-[50px]">
            {formatTime(timeRemaining)}
          </span>
        </div>
      )}
    </div>
  );
};
