import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/database';
import { createAppointment } from '@/lib/appointment-service';
import { service, shop } from '@/lib/shop-schema';
import { eq } from 'drizzle-orm';
import { sendBookingConfirmation } from '@/lib/email-service';
import { sendBookingConfirmationSMS } from '@/lib/sms-service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      shopId,
      serviceId,
      barberId,
      startTime,
      duration,
      clientName,
      clientEmail,
      clientPhone,
      notes,
    } = body;

    // Validate required fields
    if (!shopId || !serviceId || !startTime || !duration || !clientName || !clientEmail || !clientPhone) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get service details to calculate price
    const serviceDetails = await db
      .select()
      .from(service)
      .where(eq(service.id, serviceId))
      .limit(1);

    if (!serviceDetails.length) {
      return NextResponse.json(
        { error: 'Service not found' },
        { status: 404 }
      );
    }

    const selectedService = serviceDetails[0];
    
    // Calculate end time
    const startDateTime = new Date(startTime);
    const endDateTime = new Date(startDateTime.getTime() + (duration * 60 * 1000));

    // Create appointment with guest information
    const appointmentData = {
      shopId,
      serviceId,
      barberId: barberId || null,
      startTime: startDateTime,
      endTime: endDateTime,
      duration,
      price: selectedService.price.toString(), // Get price from service
      status: 'scheduled',
      paymentStatus: 'pending',
      notes: notes || null,
      // Guest booking fields - no clientId for guests
      clientId: null,
      guestName: clientName,
      guestEmail: clientEmail,
      guestPhone: clientPhone,
    };

    const { appointment, hasConflicts } = await createAppointment(appointmentData, {
      checkConflicts: true,
      sendConfirmation: false, // We'll handle email sending here
    });

    // Get shop details for the email
    const shopDetails = await db
      .select()
      .from(shop)
      .where(eq(shop.id, shopId))
      .limit(1);

    const shopInfo = shopDetails[0];

    // Prepare booking data for both email and SMS
    const bookingData = {
      // Guest information
      guestName: clientName,
      guestEmail: clientEmail,
      guestPhone: clientPhone,
      
      // Appointment details
      serviceName: selectedService.name,
      servicePrice: selectedService.price.toString(),
      duration: duration,
      appointmentDate: startDateTime.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      appointmentTime: startDateTime.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      }),
      
      // Shop information
      shopName: shopInfo?.name || 'Barbershop',
      shopAddress: shopInfo?.address ? `${shopInfo.address}, ${shopInfo.city}, ${shopInfo.state} ${shopInfo.zipCode}` : undefined,
      shopPhone: shopInfo?.phone || undefined,
      
      // Booking reference
      appointmentId: appointment.id,
    };

    // Send confirmation email using AI-powered service
    let emailSent = false;
    let emailError = null;
    
    try {
      const emailResult = await sendBookingConfirmation(bookingData);

      emailSent = emailResult.success;
      if (!emailResult.success) {
        emailError = emailResult.error;
        console.error('Email sending failed:', emailResult.error);
      }
    } catch (error) {
      console.error('Email service error:', error);
      emailError = 'Email service unavailable';
    }

    // Send confirmation SMS if phone number is provided
    let smsSent = false;
    let smsError = null;

    if (clientPhone) {
      try {
        const smsResult = await sendBookingConfirmationSMS(bookingData);
        
        smsSent = smsResult.success;
        if (!smsResult.success) {
          smsError = smsResult.error;
          console.error('SMS sending failed:', smsResult.error);
        }
      } catch (error) {
        console.error('SMS service error:', error);
        smsError = 'SMS service unavailable';
      }
    }

    // Generate success message based on what was sent
    let message = 'Appointment booked successfully!';
    if (emailSent && smsSent) {
      message += ' Email and SMS confirmations sent.';
    } else if (emailSent) {
      message += ' Email confirmation sent.';
      if (smsError) message += ` (SMS failed: ${smsError})`;
    } else if (smsSent) {
      message += ' SMS confirmation sent.';
      if (emailError) message += ` (Email failed: ${emailError})`;
    } else {
      message += ' (Email and SMS confirmations failed)';
    }

    return NextResponse.json({
      success: true,
      appointment,
      hasConflicts,
      confirmations: {
        email: {
          sent: emailSent,
          error: emailError
        },
        sms: {
          sent: smsSent,
          error: smsError
        }
      },
      message
    });

  } catch (error) {
    console.error('Error creating appointment:', error);
    return NextResponse.json(
      { error: 'Failed to create appointment' },
      { status: 500 }
    );
  }
}