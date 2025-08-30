'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { User, Mail, Phone, MessageSquare, Shield } from 'lucide-react';

interface GuestBookingFormProps {
  onSubmit: (data: BookingData) => void;
  loading: boolean;
}

interface BookingData {
  name: string;
  email: string;
  phone: string;
  notes?: string;
  marketingConsent?: boolean;
}

export default function GuestBookingForm({ onSubmit, loading }: GuestBookingFormProps) {
  const [formData, setFormData] = useState<BookingData>({
    name: '',
    email: '',
    phone: '',
    notes: '',
    marketingConsent: false
  });

  const [errors, setErrors] = useState<Partial<BookingData>>({});

  const validateForm = () => {
    const newErrors: Partial<BookingData> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^\+?[\d\s\-()]+$/.test(formData.phone)) {
      newErrors.phone = 'Please enter a valid phone number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  const handleChange = (field: keyof BookingData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Complete Your Booking</CardTitle>
        <CardDescription>
          Enter your contact information to confirm your appointment
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name Field */}
          <div className="space-y-2">
            <Label htmlFor="name">
              <User className="w-4 h-4 inline mr-2" />
              Your Name *
            </Label>
            <Input
              id="name"
              placeholder="John Doe"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              className={errors.name ? 'border-red-500' : ''}
            />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name}</p>
            )}
          </div>

          {/* Email Field */}
          <div className="space-y-2">
            <Label htmlFor="email">
              <Mail className="w-4 h-4 inline mr-2" />
              Email Address *
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="john@example.com"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              className={errors.email ? 'border-red-500' : ''}
            />
            {errors.email && (
              <p className="text-sm text-red-500">{errors.email}</p>
            )}
            <p className="text-xs text-muted-foreground">
              We'll send your booking confirmation here
            </p>
          </div>

          {/* Phone Field */}
          <div className="space-y-2">
            <Label htmlFor="phone">
              <Phone className="w-4 h-4 inline mr-2" />
              Phone Number *
            </Label>
            <Input
              id="phone"
              type="tel"
              placeholder="(555) 123-4567"
              value={formData.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              className={errors.phone ? 'border-red-500' : ''}
            />
            {errors.phone && (
              <p className="text-sm text-red-500">{errors.phone}</p>
            )}
            <p className="text-xs text-muted-foreground">
              We'll text you appointment reminders
            </p>
          </div>

          {/* Notes Field (Optional) */}
          <div className="space-y-2">
            <Label htmlFor="notes">
              <MessageSquare className="w-4 h-4 inline mr-2" />
              Special Requests (Optional)
            </Label>
            <Textarea
              id="notes"
              placeholder="Any specific requests or preferences..."
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              rows={3}
            />
          </div>

          {/* Marketing Consent */}
          <div className="flex items-start space-x-2">
            <Checkbox
              id="marketing"
              checked={formData.marketingConsent}
              onCheckedChange={(checked) => handleChange('marketingConsent', checked)}
            />
            <Label htmlFor="marketing" className="text-sm font-normal cursor-pointer">
              Send me exclusive offers and appointment reminders via email and SMS
            </Label>
          </div>

          {/* Security Notice */}
          <div className="bg-muted/50 rounded-lg p-3 flex items-start gap-2">
            <Shield className="w-4 h-4 text-muted-foreground mt-0.5" />
            <div className="text-xs text-muted-foreground">
              <p className="font-medium mb-1">Your information is secure</p>
              <p>We use industry-standard encryption to protect your personal data. Your information will only be used to manage your appointment.</p>
            </div>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full"
            size="lg"
            disabled={loading}
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Confirming Booking...
              </>
            ) : (
              'Confirm Booking'
            )}
          </Button>

          {/* Terms Notice */}
          <p className="text-xs text-center text-muted-foreground">
            By booking, you agree to our cancellation policy and terms of service
          </p>
        </form>
      </CardContent>
    </Card>
  );
}