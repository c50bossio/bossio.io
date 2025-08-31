"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CalendarIcon, Clock, User, Scissors, FileText, Loader2, AlertCircle, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Service {
  id: string;
  name: string;
  duration: number;
  price: string;
}

interface Barber {
  id: string;
  name: string;
}

interface AppointmentEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: {
    id: string;
    title: string;
    client: string;
    clientEmail?: string;
    clientPhone?: string;
    startTime: string;
    endTime: string;
    duration: number;
    serviceId?: string;
    barberId?: string;
    notes?: string;
    status: string;
    price: string;
  };
  services: Service[];
  barbers: Barber[];
  onSave: (updatedAppointment: any) => void;
  isDemo?: boolean;
}

export default function AppointmentEditModal({
  isOpen,
  onClose,
  appointment,
  services,
  barbers,
  onSave,
  isDemo = false,
}: AppointmentEditModalProps) {
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [selectedService, setSelectedService] = useState<string>(appointment.serviceId || "");
  const [selectedBarber, setSelectedBarber] = useState<string>(appointment.barberId || "any");
  const [notes, setNotes] = useState<string>(appointment.notes || "");
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [isTimeAvailable, setIsTimeAvailable] = useState<boolean | null>(null);

  // Hard-coded shopId - in production this would come from context/props
  const shopId = '6ac05b41-85e2-4b3e-9985-e5c7ad813684';

  // Check availability when date/time changes
  useEffect(() => {
    if (selectedDate && selectedTime && selectedService) {
      checkTimeAvailability();
    }
  }, [selectedDate, selectedTime, selectedService, selectedBarber]);

  const checkTimeAvailability = async () => {
    setCheckingAvailability(true);
    try {
      // Calculate start and end times
      const startTime = new Date(`${selectedDate}T${selectedTime}:00`);
      const selectedServiceObj = services.find(s => s.id === selectedService);
      const duration = selectedServiceObj?.duration || appointment.duration;
      const endTime = new Date(startTime);
      endTime.setMinutes(endTime.getMinutes() + duration);

      const response = await fetch('/api/appointments/availability', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          shopId,
          barberId: selectedBarber === "any" ? null : selectedBarber,
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
          excludeAppointmentId: appointment.id, // Exclude current appointment
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to check availability');
      }

      const data = await response.json();
      setIsTimeAvailable(data.isAvailable);
    } catch (error) {
      console.error('Error checking availability:', error);
      setIsTimeAvailable(null);
    } finally {
      setCheckingAvailability(false);
    }
  };

  useEffect(() => {
    // Extract date and time from startTime
    const date = new Date(appointment.startTime);
    
    // Format date as YYYY-MM-DD for input[type="date"]
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    setSelectedDate(`${year}-${month}-${day}`);
    
    // Format time as HH:MM for input[type="time"]
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    setSelectedTime(`${hours}:${minutes}`);
    
    // Update service, barber, and notes
    setSelectedService(appointment.serviceId || "");
    setSelectedBarber(appointment.barberId || "any");
    setNotes(appointment.notes || "");
  }, [appointment]);

  const handleSave = async () => {
    // Check if the selected time is available
    if (isTimeAvailable === false) {
      toast.error("This time slot is not available. Please select another time.");
      return;
    }

    if (isDemo) {
      toast.success("Demo Mode: Changes would be saved");
      onClose();
      return;
    }

    setLoading(true);
    
    try {
      // Combine date and time - selectedDate is already in YYYY-MM-DD format
      const newStartTime = new Date(`${selectedDate}T${selectedTime}:00`);
      
      // Calculate end time based on service duration
      const selectedServiceObj = services.find(s => s.id === selectedService);
      const duration = selectedServiceObj?.duration || appointment.duration;
      const newEndTime = new Date(newStartTime);
      newEndTime.setMinutes(newEndTime.getMinutes() + duration);

      const updates = {
        startTime: newStartTime.toISOString(),
        endTime: newEndTime.toISOString(),
        serviceId: selectedService,
        barberId: selectedBarber === "any" ? null : selectedBarber,
        notes: notes,
        duration: duration,
      };

      // Call API to update appointment
      const response = await fetch(`/api/appointments/${appointment.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error('Failed to update appointment');
      }

      toast.success("Appointment updated successfully");
      onSave({ ...appointment, ...updates });
      onClose();
    } catch (error) {
      console.error('Error updating appointment:', error);
      toast.error("Failed to update appointment");
    } finally {
      setLoading(false);
    }
  };

  // Generate time slots
  const timeSlots = [];
  for (let hour = 8; hour <= 20; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      // Format as 12-hour time with AM/PM
      const date = new Date(`2000-01-01T${time}:00`);
      const label = date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      });
      timeSlots.push({ value: time, label });
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Appointment</DialogTitle>
          <DialogDescription>
            Modify appointment details for {appointment.client}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Client Information (Read-only) */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Client Information</Label>
            <div className="p-3 bg-muted rounded-lg space-y-1">
              <p className="text-sm font-medium">{appointment.client}</p>
              {appointment.clientPhone && (
                <p className="text-sm text-muted-foreground">{appointment.clientPhone}</p>
              )}
              {appointment.clientEmail && (
                <p className="text-sm text-muted-foreground">{appointment.clientEmail}</p>
              )}
            </div>
          </div>

          {/* Date Selection */}
          <div className="space-y-2">
            <Label htmlFor="date" className="flex items-center gap-2">
              <CalendarIcon className="h-4 w-4" />
              Date
            </Label>
            <Input
              id="date"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="w-full"
            />
          </div>

          {/* Time Selection */}
          <div className="space-y-2">
            <Label htmlFor="time" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Time
              {checkingAvailability && (
                <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
              )}
            </Label>
            <Select value={selectedTime} onValueChange={setSelectedTime}>
              <SelectTrigger className={cn(
                isTimeAvailable === false && "border-red-500",
                isTimeAvailable === true && "border-green-500"
              )}>
                <SelectValue placeholder="Select time" />
              </SelectTrigger>
              <SelectContent>
                {timeSlots.map((slot) => (
                  <SelectItem key={slot.value} value={slot.value}>
                    {slot.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {isTimeAvailable === false && (
              <p className="text-sm text-red-500 flex items-center gap-1 mt-1">
                <AlertCircle className="h-3 w-3" />
                This time slot conflicts with another appointment
              </p>
            )}
            {isTimeAvailable === true && (
              <p className="text-sm text-green-500 flex items-center gap-1 mt-1">
                <CheckCircle className="h-3 w-3" />
                This time slot is available
              </p>
            )}
          </div>

          {/* Service Selection */}
          <div className="space-y-2">
            <Label htmlFor="service" className="flex items-center gap-2">
              <Scissors className="h-4 w-4" />
              Service
            </Label>
            <Select value={selectedService} onValueChange={setSelectedService}>
              <SelectTrigger>
                <SelectValue placeholder="Select service" />
              </SelectTrigger>
              <SelectContent>
                {services.map((service) => (
                  <SelectItem key={service.id} value={service.id}>
                    {service.name} ({service.duration} min) - ${service.price}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Barber Selection */}
          <div className="space-y-2">
            <Label htmlFor="barber" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Barber
            </Label>
            <Select value={selectedBarber || "any"} onValueChange={setSelectedBarber}>
              <SelectTrigger>
                <SelectValue placeholder="Select barber" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Any Available Barber</SelectItem>
                {barbers.map((barber) => (
                  <SelectItem key={barber.id} value={barber.id}>
                    {barber.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Notes
            </Label>
            <Textarea
              id="notes"
              placeholder="Add any special notes or instructions..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}