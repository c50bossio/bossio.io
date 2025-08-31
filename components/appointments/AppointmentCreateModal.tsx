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
import { CalendarIcon, Clock, User, Scissors, FileText, Loader2, Phone, Mail, AlertCircle, CheckCircle, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";

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

interface AppointmentCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  services: Service[];
  barbers: Barber[];
  onSave: (appointment: any) => void;
  isDemo?: boolean;
  defaultDate?: Date;
}

export default function AppointmentCreateModal({
  isOpen,
  onClose,
  services,
  barbers,
  onSave,
  isDemo = false,
  defaultDate = new Date(),
}: AppointmentCreateModalProps) {
  const [loading, setLoading] = useState(false);
  
  // Form state
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [selectedDate, setSelectedDate] = useState(() => {
    const date = new Date(defaultDate);
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  });
  const [selectedTime, setSelectedTime] = useState("09:00");
  const [selectedService, setSelectedService] = useState<string>("");
  const [selectedBarber, setSelectedBarber] = useState<string>("any");
  const [notes, setNotes] = useState<string>("");
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [availableSlots, setAvailableSlots] = useState<any[]>([]);
  const [selectedSlotAvailable, setSelectedSlotAvailable] = useState<boolean | null>(null);
  const [showOnlyAvailable, setShowOnlyAvailable] = useState(false);

  // Hard-coded shopId - in production this would come from context/props
  const shopId = '6ac05b41-85e2-4b3e-9985-e5c7ad813684';

  // Check availability when date, service, or barber changes
  useEffect(() => {
    console.log('🎯 useEffect triggered:', { selectedDate, selectedService, selectedBarber });
    if (selectedDate && selectedService) {
      checkAvailability();
    } else {
      console.log('⏸️ Skipping availability check - missing date or service');
    }
  }, [selectedDate, selectedService, selectedBarber]);

  // Check if selected time slot is available
  useEffect(() => {
    if (selectedTime && availableSlots.length > 0) {
      const slot = availableSlots.find(s => s.time === selectedTime);
      setSelectedSlotAvailable(slot ? slot.isAvailable : null);
    }
  }, [selectedTime, availableSlots]);

  const checkAvailability = async () => {
    console.log('🔍 Checking availability...', { selectedDate, selectedService, selectedBarber });
    setCheckingAvailability(true);
    try {
      const params = new URLSearchParams({
        date: selectedDate,
        shopId: shopId,
        barberId: selectedBarber,
        serviceId: selectedService,
      });

      console.log('📡 Fetching availability:', `/api/appointments/availability?${params}`);
      const response = await fetch(`/api/appointments/availability?${params}`);
      if (!response.ok) {
        throw new Error('Failed to check availability');
      }

      const data = await response.json();
      console.log('✅ Availability data received:', data.summary);
      console.log('📊 Sample slots:', data.timeSlots?.slice(0, 5).map((s: any) => ({ time: s.time, isAvailable: s.isAvailable })));
      setAvailableSlots(data.timeSlots || []);
    } catch (error) {
      console.error('❌ Error checking availability:', error);
      toast.error('Failed to check availability');
    } finally {
      setCheckingAvailability(false);
    }
  };

  const handleSave = async () => {
    // Validate required fields
    if (!clientName || !selectedService) {
      toast.error("Please fill in all required fields");
      return;
    }

    // Check if the selected time slot is available
    if (selectedSlotAvailable === false) {
      toast.error("This time slot is not available. Please select another time.");
      return;
    }

    if (isDemo) {
      toast.success("Demo Mode: Appointment would be created");
      onClose();
      return;
    }

    setLoading(true);
    
    try {
      // Combine date and time
      const startTime = new Date(`${selectedDate}T${selectedTime}:00`);
      
      // Get service duration
      const selectedServiceObj = services.find(s => s.id === selectedService);
      const duration = selectedServiceObj?.duration || 30;
      const endTime = new Date(startTime);
      endTime.setMinutes(endTime.getMinutes() + duration);

      const appointmentData = {
        guestName: clientName,
        guestEmail: clientEmail || null,
        guestPhone: clientPhone || null,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        serviceId: selectedService,
        barberId: selectedBarber === "any" ? null : selectedBarber,
        notes: notes || null,
        duration: duration,
        price: selectedServiceObj?.price || "0",
        status: "scheduled",
        paymentStatus: "pending",
      };

      // Call API to create appointment
      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(appointmentData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create appointment');
      }

      const result = await response.json();
      toast.success("Appointment created successfully");
      onSave(result.appointment);
      onClose();
      
      // Reset form
      setClientName("");
      setClientEmail("");
      setClientPhone("");
      setSelectedService("");
      setSelectedBarber("any");
      setNotes("");
      setSelectedTime("09:00");
    } catch (error) {
      console.error('Error creating appointment:', error);
      toast.error("Failed to create appointment");
    } finally {
      setLoading(false);
    }
  };

  // Get time slot display info
  const getTimeSlotDisplay = () => {
    if (availableSlots.length === 0) {
      // Fallback when no availability data - show slots but don't mark as available
      // This happens when no service is selected yet
      const slots = [];
      for (let hour = 8; hour <= 20; hour++) {
        for (let minute = 0; minute < 60; minute += 30) {
          const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
          const date = new Date(`2000-01-01T${time}:00`);
          const label = date.toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit',
            hour12: true 
          });
          // Don't mark as available when we haven't checked availability yet
          // This prevents showing misleading "26 of 26 available" message
          slots.push({ value: time, label, isAvailable: null });
        }
      }
      return slots;
    }

    // Use availability data
    return availableSlots.map(slot => {
      const date = new Date(`2000-01-01T${slot.time}:00`);
      const label = date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      });
      return {
        value: slot.time,
        label: label,
        isAvailable: slot.isAvailable,
      };
    });
  };

  const allTimeSlots = getTimeSlotDisplay();
  const timeSlots = showOnlyAvailable 
    ? allTimeSlots.filter(slot => slot.isAvailable)
    : allTimeSlots;
  
  // Debug logging
  console.log('🔍 Render Debug:', {
    availableSlotsLength: availableSlots.length,
    firstFewSlots: allTimeSlots.slice(0, 3).map(s => ({ value: s.value, isAvailable: s.isAvailable }))
  });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>New Appointment</DialogTitle>
          <DialogDescription>
            Schedule a new appointment for a client
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Client Information */}
          <div className="space-y-2">
            <Label htmlFor="clientName" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Client Name *
            </Label>
            <Input
              id="clientName"
              placeholder="Enter client name"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="clientEmail" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email
              </Label>
              <Input
                id="clientEmail"
                type="email"
                placeholder="client@example.com"
                value={clientEmail}
                onChange={(e) => setClientEmail(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="clientPhone" className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Phone
              </Label>
              <Input
                id="clientPhone"
                type="tel"
                placeholder="(555) 123-4567"
                value={clientPhone}
                onChange={(e) => setClientPhone(e.target.value)}
              />
            </div>
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date" className="flex items-center gap-2">
                <CalendarIcon className="h-4 w-4" />
                Date *
              </Label>
              <Input
                id="date"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                required
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="time" className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Time *
                  {checkingAvailability && (
                    <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                  )}
                </Label>
                <div className="flex items-center gap-2 text-sm">
                  <Label htmlFor="show-available" className="text-xs text-muted-foreground cursor-pointer">
                    {showOnlyAvailable ? (
                      <span className="flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        Available only
                      </span>
                    ) : (
                      <span className="flex items-center gap-1">
                        <EyeOff className="h-3 w-3" />
                        Show all
                      </span>
                    )}
                  </Label>
                  <Switch
                    id="show-available"
                    checked={showOnlyAvailable}
                    onCheckedChange={setShowOnlyAvailable}
                    className="scale-75"
                  />
                </div>
              </div>
              <Select value={selectedTime} onValueChange={setSelectedTime}>
                <SelectTrigger className={cn(
                  selectedSlotAvailable === false && "border-red-500",
                  selectedSlotAvailable === true && "border-green-500"
                )}>
                  <SelectValue placeholder="Select time" />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  {timeSlots.length === 0 ? (
                    <div className="p-2 text-center text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin mx-auto mb-2" />
                      Checking availability...
                    </div>
                  ) : (
                    timeSlots.map((slot) => (
                      <SelectItem 
                        key={slot.value} 
                        value={slot.value}
                        disabled={!slot.isAvailable}
                      >
                        <div className="flex items-center justify-between w-full gap-3">
                          <span className={cn(
                            !slot.isAvailable && "text-muted-foreground line-through"
                          )}>
                            {slot.label.replace(' (Booked)', '')}
                          </span>
                          <div className="flex items-center gap-1">
                            {slot.isAvailable ? (
                              <span className="text-xs text-green-600 font-medium">Available</span>
                            ) : (
                              <span className="text-xs text-muted-foreground">Booked</span>
                            )}
                          </div>
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {selectedSlotAvailable === false && (
                <p className="text-sm text-red-500 flex items-center gap-1 mt-1">
                  <AlertCircle className="h-3 w-3" />
                  This time slot is already booked
                </p>
              )}
              {selectedSlotAvailable === true && (
                <p className="text-sm text-green-500 flex items-center gap-1 mt-1">
                  <CheckCircle className="h-3 w-3" />
                  This time slot is available
                </p>
              )}
              {allTimeSlots.length > 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  {!selectedService ? (
                    "Select a service to check availability"
                  ) : checkingAvailability ? (
                    "Checking availability..."
                  ) : (
                    `${allTimeSlots.filter(s => s.isAvailable).length} of ${allTimeSlots.length} slots available`
                  )}
                </p>
              )}
            </div>
          </div>

          {/* Service Selection */}
          <div className="space-y-2">
            <Label htmlFor="service" className="flex items-center gap-2">
              <Scissors className="h-4 w-4" />
              Service *
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
            <Select value={selectedBarber} onValueChange={setSelectedBarber}>
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
          <Button onClick={handleSave} disabled={loading || !clientName || !selectedService}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Appointment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}