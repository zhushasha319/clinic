"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { format } from "date-fns";
import type { DateRange } from "react-day-picker";
import { CalendarDays } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface DateRangePickerProps {
  initialStart: string;
  initialEnd: string;
  className?: string;
}

const parseDateOnly = (value?: string) => {
  if (!value) return undefined;
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return undefined;
  return new Date(year, month - 1, day);
};

export default function DateRangePicker({
  initialStart,
  initialEnd,
  className,
}: DateRangePickerProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const urlStart = searchParams?.get("start") ?? initialStart;
  const urlEnd = searchParams?.get("end") ?? initialEnd;

  const resolvedRange = React.useMemo<DateRange | undefined>(() => {
    const from = parseDateOnly(urlStart);
    const to = parseDateOnly(urlEnd ?? urlStart);
    if (!from && !to) return undefined;
    return { from, to };
  }, [urlStart, urlEnd]);

  const [range, setRange] = React.useState<DateRange | undefined>(
    resolvedRange,
  );

  React.useEffect(() => {
    setRange(resolvedRange);
  }, [resolvedRange]);

  const label = React.useMemo(() => {
    if (range?.from && range?.to) {
      return `${format(range.from, "yyyy.MM.dd")} - ${format(
        range.to,
        "yyyy.MM.dd",
      )}`;
    }
    if (range?.from) {
      return format(range.from, "yyyy.MM.dd");
    }
    return "选择日期范围";
  }, [range]);

  const handleSelect = (nextRange: DateRange | undefined) => {
    setRange(nextRange);

    const params = new URLSearchParams(searchParams?.toString());

    if (nextRange?.from) {
      params.set("start", format(nextRange.from, "yyyy-MM-dd"));
    } else {
      params.delete("start");
    }

    if (nextRange?.to) {
      params.set("end", format(nextRange.to, "yyyy-MM-dd"));
    } else if (nextRange?.from) {
      params.set("end", format(nextRange.from, "yyyy-MM-dd"));
    } else {
      params.delete("end");
    }

    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, {
      scroll: false,
    });
    router.refresh();
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "h-9 w-full justify-start gap-2 text-left text-sm font-normal md:w-auto",
            className,
          )}
        >
          <CalendarDays className="h-4 w-4 text-muted-foreground" />
          <span>{label}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="center" className="p-0" sideOffset={8}>
        <Calendar
          mode="range"
          numberOfMonths={2}
          selected={range}
          onSelect={handleSelect}
          defaultMonth={range?.from}
          className="rounded-md"
        />
      </PopoverContent>
    </Popover>
  );
}

