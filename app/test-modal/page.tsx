"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import AppointmentCreateModal from "@/components/appointments/AppointmentCreateModal";

// Mock data for testing
const mockServices = [
  { id: "cf7564f7-7a86-431f-89e1-15a7fcd3d15f", name: "Basic Haircut", duration: 30, price: "35" },
  { id: "b8a3f621-9d45-4e7b-8c5a-2e9f7d1b3a4c", name: "Premium Cut & Style", duration: 45, price: "50" },
  { id: "d2e5a789-3b67-4c89-9f01-7a8c9d5e2f3b", name: "Beard Trim", duration: 20, price: "25" },
  { id: "e3f6b8a9-4c78-5d90-a012-8b9d0e6f4c5e", name: "Haircut and Beard", duration: 45, price: "55" },
];

const mockBarbers = [
  { id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890", name: "John Smith" },
  { id: "f9e8d7c6-b5a4-3210-fedc-ba0987654321", name: "Mike Johnson" },
];

export default function TestModal() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-4">Test Appointment Modal</h1>
        <p className="text-gray-600 mb-8">
          Click the button below to test the appointment creation modal with availability checking.
        </p>
        <Button 
          onClick={() => setIsModalOpen(true)}
          size="lg"
        >
          Open Appointment Modal
        </Button>
      </div>

      <AppointmentCreateModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        services={mockServices}
        barbers={mockBarbers}
        onSave={(appointment) => {
          console.log("New appointment:", appointment);
          alert("Test mode: Appointment would be created");
        }}
        isDemo={true}
        defaultDate={new Date()}
      />
    </div>
  );
}