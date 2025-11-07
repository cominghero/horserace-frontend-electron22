import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Loader2, Calendar, ChevronDown } from "lucide-react";
import { API_BASE_URL } from "@/config/api";

interface ScheduleButtonProps {
  onDataFetched: (data: any, title: string) => void;
  isGlobalLoading: boolean;
  setIsGlobalLoading: (loading: boolean) => void;
  disabled?: boolean;
}

export const ScheduleButton = ({ onDataFetched, isGlobalLoading, setIsGlobalLoading, disabled = false }: ScheduleButtonProps) => {
  const [selectedOption, setSelectedOption] = useState<string>("");
  const [isThisButtonLoading, setIsThisButtonLoading] = useState(false);

  // Helper function to format date as YYYY-MM-DD
  const formatDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Calculate dates
  const getScheduleDates = () => {
    const today = new Date();

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const twoDaysLater = new Date(today);
    twoDaysLater.setDate(twoDaysLater.getDate() + 2);

    const threeDaysLater = new Date(today);
    threeDaysLater.setDate(threeDaysLater.getDate() + 3);

    return {
      today: {
        label: `Today (${formatDate(today)})`,
        value: 'today' // Use 'today' string
      },
      tomorrow: {
        label: `Tomorrow (${formatDate(tomorrow)})`,
        value: 'tomorrow' // Use 'tomorrow' string instead of date
      },
      twoDays: {
        label: `${formatDate(twoDaysLater)}`,
        value: formatDate(twoDaysLater)
      },
      threeDays: {
        label: `${formatDate(threeDaysLater)}`,
        value: formatDate(threeDaysLater)
      }
    };
  };

  const handleScrape = async (dateValue: string, label: string) => {
    setIsGlobalLoading(true);
    setIsThisButtonLoading(true);
    setSelectedOption(label);

    try {
      const response = await fetch(`${API_BASE_URL}/api/scrape/upcoming/${dateValue}`, {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }

      const result = await response.json();
      console.log("🎯 Raw API response (upcoming):", result);

      if (result.data && Array.isArray(result.data)) {
        console.log("✅ Upcoming scraped data received:", result.data);
        const title = `Schedule of ${dateValue}`;
        onDataFetched(result.data, title);
      } else {
        console.error("❌ Invalid response format. Expected result.data as array:", result);
      }
    } catch (error) {
      console.error("Scraping upcoming races failed:", error);
      alert("Failed to scrape upcoming races. Check console for details.");
    } finally {
      setIsGlobalLoading(false);
      setIsThisButtonLoading(false);
    }
  };

  const dates = getScheduleDates();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          disabled={isGlobalLoading || disabled}
          className="font-semibold tracking-wide"
          size="default"
        >
          {isThisButtonLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Loading...
            </>
          ) : (
            <>
              <Calendar className="w-4 h-4 mr-2" />
              Schedule
              <ChevronDown className="w-4 h-4 ml-2" />
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuItem
          onClick={() => !isGlobalLoading && handleScrape(dates.today.value, dates.today.label)}
          disabled={isGlobalLoading}
          className="cursor-pointer"
        >
          {dates.today.label}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => !isGlobalLoading && handleScrape(dates.tomorrow.value, dates.tomorrow.label)}
          disabled={isGlobalLoading}
          className="cursor-pointer"
        >
          {dates.tomorrow.label}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => !isGlobalLoading && handleScrape(dates.twoDays.value, dates.twoDays.label)}
          disabled={isGlobalLoading}
          className="cursor-pointer"
        >
          {dates.twoDays.label}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => !isGlobalLoading && handleScrape(dates.threeDays.value, dates.threeDays.label)}
          disabled={isGlobalLoading}
          className="cursor-pointer"
        >
          {dates.threeDays.label}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
