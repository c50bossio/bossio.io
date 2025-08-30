'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { format, addDays, startOfDay, isSameDay, isToday, isTomorrow } from 'date-fns';

interface TimeSlot {
  time: Date;
  available: boolean;
}

interface TimeSlotPickerProps {
  shopId: string;
  barberId: string | null;
  serviceId: string;
  serviceDuration: number;
  onSelect: (dateTime: Date) => void;
}

export default function TimeSlotPicker({
  shopId,
  barberId,
  serviceId,
  serviceDuration,
  onSelect
}: TimeSlotPickerProps) {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(false);

  // Generate next 7 days for date selection
  const dates = Array.from({ length: 7 }, (_, i) => addDays(new Date(), i));

  useEffect(() => {
    loadTimeSlots();
  }, [selectedDate, barberId]);

  const loadTimeSlots = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/public/availability?shopId=${shopId}&barberId=${barberId}&date=${format(selectedDate, 'yyyy-MM-dd')}&duration=${serviceDuration}`
      );
      const data = await response.json();
      setTimeSlots(data.slots || generateDefaultSlots());
    } catch (error) {
      console.error('Error loading time slots:', error);
      setTimeSlots(generateDefaultSlots());
    } finally {
      setLoading(false);
    }
  };

  const generateDefaultSlots = (): TimeSlot[] => {
    const slots: TimeSlot[] = [];
    const startHour = 9; // 9 AM
    const endHour = 18; // 6 PM
    const slotInterval = 30; // 30 minutes

    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute = 0; minute < 60; minute += slotInterval) {
        const slotTime = new Date(selectedDate);
        slotTime.setHours(hour, minute, 0, 0);
        
        // Mock availability (in production, this would come from the API)
        const available = Math.random() > 0.3; // 70% availability
        
        // Don't show past time slots for today
        if (isToday(selectedDate) && slotTime < new Date()) {
          continue;
        }

        slots.push({
          time: slotTime,
          available
        });
      }
    }

    return slots;
  };

  const getDateLabel = (date: Date) => {
    if (isToday(date)) return 'Today';
    if (isTomorrow(date)) return 'Tomorrow';
    return format(date, 'EEE');
  };

  const handleTimeSelect = (slot: TimeSlot) => {
    if (!slot.available) return;
    onSelect(slot.time);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Select Your Time</h2>
        <p className="text-muted-foreground">Choose your preferred date and time</p>
      </div>

      {/* Date Selection */}
      <div>
        <h3 className="text-lg font-semibold mb-3">Select Date</h3>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {dates.map((date) => (
            <Button
              key={date.toISOString()}
              variant={isSameDay(date, selectedDate) ? 'default' : 'outline'}
              className="flex-shrink-0 flex-col h-auto py-2 px-4"
              onClick={() => setSelectedDate(date)}
            >
              <span className="text-xs font-normal">{getDateLabel(date)}</span>
              <span className="text-lg font-semibold">{format(date, 'd')}</span>
              <span className="text-xs font-normal">{format(date, 'MMM')}</span>
            </Button>
          ))}
        </div>
      </div>

      {/* Time Slots */}
      <div>
        <h3 className="text-lg font-semibold mb-3">Available Times</h3>
        
        {loading ? (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="h-10 bg-muted animate-pulse rounded" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
            {timeSlots.map((slot, index) => (
              <Button
                key={index}
                variant={slot.available ? 'outline' : 'ghost'}
                size="sm"
                className={`${!slot.available && 'opacity-50 cursor-not-allowed'}`}
                disabled={!slot.available}
                onClick={() => handleTimeSelect(slot)}
              >
                {format(slot.time, 'h:mm a')}
              </Button>
            ))}
          </div>
        )}

        {!loading && timeSlots.length === 0 && (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-muted-foreground">
                No available time slots for this date. Please try another date.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}