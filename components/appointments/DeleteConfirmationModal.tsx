"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Loader2 } from "lucide-react";
import { useState } from "react";

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  appointment: {
    id: string;
    client: string;
    startTime: string;
    title: string;
  } | null;
}

export default function DeleteConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  appointment,
}: DeleteConfirmationModalProps) {
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm();
      onClose();
    } catch (error) {
      console.error('Error deleting appointment:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!appointment) return null;

  const appointmentDate = new Date(appointment.startTime);
  const formattedDate = appointmentDate.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const formattedTime = appointmentDate.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            Delete Appointment
          </DialogTitle>
          <DialogDescription>
            This action cannot be undone. The appointment will be permanently removed.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Appointment Details:</h4>
            <div className="space-y-1 text-sm text-gray-600">
              <p><strong>Client:</strong> {appointment.client}</p>
              <p><strong>Service:</strong> {appointment.title}</p>
              <p><strong>Date:</strong> {formattedDate}</p>
              <p><strong>Time:</strong> {formattedTime}</p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={loading}
            className="bg-red-600 hover:bg-red-700"
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Delete Appointment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}