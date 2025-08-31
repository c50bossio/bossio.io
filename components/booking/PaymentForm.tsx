'use client';

import { useState } from 'react';
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';
import { stripePromise } from '@/lib/stripe-client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CreditCard, Shield, Info } from 'lucide-react';

interface PaymentFormProps {
  amount: number;
  appointmentDetails: {
    shopId: string;
    serviceId: string;
    barberId: string | null;
    startTime: string;
    clientName: string;
    clientEmail: string;
    clientPhone: string;
  };
  onSuccess: (paymentIntentId: string) => void;
  onBack: () => void;
}

function CheckoutForm({ amount, appointmentDetails, onSuccess, onBack }: PaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      // Confirm the payment
      const result = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/booking-success`,
          receipt_email: appointmentDetails.clientEmail,
        },
        redirect: 'if_required',
      });

      if (result.error) {
        setError(result.error.message || 'Payment failed. Please try again.');
      } else {
        // Payment succeeded
        onSuccess(result.paymentIntent.id);
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      console.error('Payment error:', err);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Payment Details
          </CardTitle>
          <CardDescription>
            Enter your payment information to confirm your booking
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Payment Amount Display */}
          <div className="bg-muted/50 rounded-lg p-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Total Amount</span>
              <span className="text-2xl font-bold">${(amount / 100).toFixed(2)}</span>
            </div>
          </div>

          {/* Payment Element */}
          <div className="border rounded-lg p-4">
            <PaymentElement 
              options={{
                layout: 'tabs',
                defaultValues: {
                  billingDetails: {
                    email: appointmentDetails.clientEmail,
                    name: appointmentDetails.clientName,
                    phone: appointmentDetails.clientPhone,
                  }
                }
              }}
            />
          </div>

          {/* Security Badge */}
          <Alert className="border-green-200 bg-green-50">
            <Shield className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-700">
              Your payment information is secure and encrypted
            </AlertDescription>
          </Alert>

          {/* Error Display */}
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onBack}
              disabled={processing}
              className="flex-1"
            >
              Back
            </Button>
            <Button
              type="submit"
              disabled={!stripe || processing}
              className="flex-1"
            >
              {processing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>Pay ${(amount / 100).toFixed(2)}</>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Info Note */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          You will receive a confirmation email after successful payment. 
          Your appointment will be automatically confirmed once payment is processed.
        </AlertDescription>
      </Alert>
    </form>
  );
}

export default function PaymentForm(props: PaymentFormProps) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Create payment intent on mount
  useState(() => {
    const createIntent = async () => {
      try {
        const response = await fetch('/api/payments/create-intent', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            amount: props.amount,
            metadata: {
              shopId: props.appointmentDetails.shopId,
              serviceId: props.appointmentDetails.serviceId,
              barberId: props.appointmentDetails.barberId,
              startTime: props.appointmentDetails.startTime,
              clientName: props.appointmentDetails.clientName,
              clientEmail: props.appointmentDetails.clientEmail,
              clientPhone: props.appointmentDetails.clientPhone,
            },
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to initialize payment');
        }

        const data = await response.json();
        setClientSecret(data.clientSecret);
      } catch (err) {
        console.error('Error creating payment intent:', err);
        setError('Failed to initialize payment. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    createIntent();
  });

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="flex flex-col items-center justify-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Initializing payment...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !clientSecret) {
    return (
      <Card>
        <CardContent className="p-8">
          <Alert variant="destructive">
            <AlertDescription>
              {error || 'Failed to initialize payment. Please try again.'}
            </AlertDescription>
          </Alert>
          <Button onClick={props.onBack} className="mt-4">
            Go Back
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Elements
      stripe={stripePromise}
      options={{
        clientSecret,
        appearance: {
          theme: 'stripe',
          variables: {
            colorPrimary: '#0070f3',
          },
        },
      }}
    >
      <CheckoutForm {...props} />
    </Elements>
  );
}