'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Scissors, Clock, DollarSign, MapPin, Phone, ArrowLeft, ArrowRight, Calendar, User } from 'lucide-react';
import BarberSelector from '@/components/booking/BarberSelector';
import ServiceSelector from '@/components/booking/ServiceSelector';
import TimeSlotPicker from '@/components/booking/TimeSlotPicker';
import GuestBookingForm from '@/components/booking/GuestBookingForm';

interface Shop {
  id: string;
  name: string;
  description: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  phone: string;
  email: string;
  businessHours: any;
}

interface Service {
  id: string;
  name: string;
  description: string;
  price: string;
  duration: number;
  category: string;
}

interface Barber {
  id: string;
  name: string;
  image?: string;
  bio?: string;
}

// Safe date formatting helpers
const formatDate = (date: Date | null | undefined) => {
  if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
    return 'Date not selected';
  }
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });
};

const formatTime = (date: Date | null | undefined) => {
  if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
    return '';
  }
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
};

export default function PublicBookingPage() {
  const params = useParams();
  const shopSlug = params.shopSlug as string;
  
  const [loading, setLoading] = useState(true);
  const [shop, setShop] = useState<Shop | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [barbers, setBarbers] = useState<Barber[]>([]);
  
  // Booking flow state (reordered: barber -> service -> time -> confirm)
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedBarber, setSelectedBarber] = useState<Barber | null>(null);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDateTime, setSelectedDateTime] = useState<Date | null>(null);
  const [bookingData, setBookingData] = useState({
    name: '',
    email: '',
    phone: ''
  });

  useEffect(() => {
    loadShopData();
  }, [shopSlug]);

  const loadShopData = async () => {
    try {
      // Load shop info
      const shopRes = await fetch(`/api/public/shops/${shopSlug}`);
      if (!shopRes.ok) throw new Error('Shop not found');
      const shopData = await shopRes.json();
      setShop(shopData);

      // Load services
      const servicesRes = await fetch(`/api/public/shops/${shopSlug}/services`);
      const servicesData = await servicesRes.json();
      setServices(servicesData);

      // Load barbers
      const barbersRes = await fetch(`/api/public/shops/${shopSlug}/barbers`);
      const barbersData = await barbersRes.json();
      setBarbers(barbersData);

      setLoading(false);
    } catch (error) {
      console.error('Error loading shop data:', error);
      setLoading(false);
    }
  };

  const handleBarberSelect = (barber: Barber | null) => {
    setSelectedBarber(barber);
    setSelectedService(null); // Reset service when barber changes
    setSelectedDateTime(null); // Reset time when barber changes
    setCurrentStep(2);
  };

  const handleServiceSelect = (service: Service) => {
    setSelectedService(service);
    setSelectedDateTime(null); // Reset time when service changes
    setCurrentStep(3);
  };

  const handleDateTimeSelect = (dateTime: Date | string) => {
    // Ensure dateTime is always a Date object
    const date = dateTime instanceof Date ? dateTime : new Date(dateTime);
    setSelectedDateTime(date);
    setCurrentStep(4);
  };

  const handleBookingSubmit = async (guestData: typeof bookingData) => {
    setBookingData(guestData);
    
    try {
      const response = await fetch('/api/public/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shopId: shop?.id,
          serviceId: selectedService?.id,
          barberId: selectedBarber?.id,
          startTime: selectedDateTime,
          duration: selectedService?.duration,
          clientName: guestData.name,
          clientEmail: guestData.email,
          clientPhone: guestData.phone,
          notes: ''
        })
      });

      if (!response.ok) throw new Error('Booking failed');
      
      const result = await response.json();
      
      // Show success state
      setCurrentStep(5);
    } catch (error) {
      console.error('Booking error:', error);
      alert('Failed to create booking. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-48 mb-4"></div>
          <div className="h-4 bg-muted rounded w-32"></div>
        </div>
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card>
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold mb-2">Shop Not Found</h2>
            <p className="text-muted-foreground">The barbershop you're looking for doesn't exist.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b">
        <div className="container max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
              <Scissors className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">{shop.name}</h1>
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <MapPin className="w-3 h-3" />
                {shop.address}, {shop.city}, {shop.state} {shop.zipCode}
                {shop.phone && (
                  <>
                    <span className="mx-2">•</span>
                    <Phone className="w-3 h-3" />
                    {shop.phone}
                  </>
                )}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Bar - 4 Steps */}
      <div className="bg-muted/30 border-b">
        <div className="container max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className={`flex items-center gap-2 ${currentStep >= 1 ? 'text-primary' : 'text-muted-foreground'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= 1 ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                1
              </div>
              <span className="hidden sm:inline">Barber</span>
            </div>
            <div className={`flex-1 h-0.5 mx-2 ${currentStep >= 2 ? 'bg-primary' : 'bg-muted'}`} />
            <div className={`flex items-center gap-2 ${currentStep >= 2 ? 'text-primary' : 'text-muted-foreground'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= 2 ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                2
              </div>
              <span className="hidden sm:inline">Service</span>
            </div>
            <div className={`flex-1 h-0.5 mx-2 ${currentStep >= 3 ? 'bg-primary' : 'bg-muted'}`} />
            <div className={`flex items-center gap-2 ${currentStep >= 3 ? 'text-primary' : 'text-muted-foreground'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= 3 ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                3
              </div>
              <span className="hidden sm:inline">Time</span>
            </div>
            <div className={`flex-1 h-0.5 mx-2 ${currentStep >= 4 ? 'bg-primary' : 'bg-muted'}`} />
            <div className={`flex items-center gap-2 ${currentStep >= 4 ? 'text-primary' : 'text-muted-foreground'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= 4 ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                4
              </div>
              <span className="hidden sm:inline">Confirm</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container max-w-4xl mx-auto px-4 py-8">
        {/* Step 1: Barber Selection */}
        {currentStep === 1 && (
          <BarberSelector
            barbers={barbers}
            onSelect={handleBarberSelect}
            selectedBarber={selectedBarber}
          />
        )}

        {/* Step 2: Service Selection */}
        {currentStep === 2 && selectedBarber !== undefined && (
          <div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentStep(1)}
              className="mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Barbers
            </Button>
            
            <Card className="mb-4">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium">
                    {selectedBarber ? selectedBarber.name : 'Any Available Barber'}
                  </span>
                </div>
              </CardContent>
            </Card>

            <ServiceSelector
              services={services}
              onSelect={handleServiceSelect}
              selectedService={selectedService}
            />
          </div>
        )}

        {/* Step 3: Time Slot Selection */}
        {currentStep === 3 && selectedService && selectedBarber !== undefined && (
          <div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentStep(2)}
              className="mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Services
            </Button>
            
            <Card className="mb-4">
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium">
                    {selectedBarber ? selectedBarber.name : 'Any Available Barber'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{selectedService.name}</p>
                    <p className="text-sm text-muted-foreground">
                      <Clock className="w-3 h-3 inline mr-1" />
                      {selectedService.duration} minutes
                    </p>
                  </div>
                  <Badge variant="secondary">${selectedService.price}</Badge>
                </div>
              </CardContent>
            </Card>

            <TimeSlotPicker
              shopId={shop.id}
              barberId={selectedBarber?.id || null}
              serviceId={selectedService.id}
              serviceDuration={selectedService.duration}
              onSelect={handleDateTimeSelect}
            />
          </div>
        )}

        {/* Step 4: Guest Information & Confirm */}
        {currentStep === 4 && selectedService && selectedDateTime && selectedBarber !== undefined && (
          <div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentStep(3)}
              className="mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Time Selection
            </Button>

            <Card className="mb-4">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{selectedService.name}</p>
                    <p className="text-sm text-muted-foreground">
                      with {selectedBarber ? selectedBarber.name : 'Any Available Barber'}
                    </p>
                  </div>
                  <Badge variant="secondary">${selectedService.price}</Badge>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  {formatDate(selectedDateTime)}
                  <span className="mx-1">at</span>
                  {formatTime(selectedDateTime)}
                </div>
              </CardContent>
            </Card>

            <GuestBookingForm
              onSubmit={handleBookingSubmit}
              loading={false}
            />
          </div>
        )}

        {/* Step 5: Success (only shown after successful booking) */}
        {currentStep === 5 && (
          <Card>
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold mb-2">Booking Confirmed!</h2>
              <p className="text-muted-foreground mb-6">
                We've sent a confirmation email to {bookingData.email}
              </p>
              <div className="bg-muted/50 rounded-lg p-4 text-left max-w-md mx-auto">
                <p className="font-medium mb-2">Appointment Details:</p>
                <div className="space-y-1 text-sm">
                  <p>{selectedService?.name} with {selectedBarber ? selectedBarber.name : 'Any Available Barber'}</p>
                  <p>{formatDate(selectedDateTime)}</p>
                  <p>{formatTime(selectedDateTime)}</p>
                  <p className="pt-2">{shop.name}</p>
                  <p className="text-muted-foreground">
                    {shop.address}, {shop.city}, {shop.state} {shop.zipCode}
                  </p>
                </div>
              </div>
              <Button
                className="mt-6"
                onClick={() => {
                  setCurrentStep(1);
                  setSelectedService(null);
                  setSelectedDateTime(null);
                  setSelectedBarber(null);
                  setBookingData({ name: '', email: '', phone: '' });
                }}
              >
                Book Another Appointment
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}