"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar as CalendarIcon, Plus, Clock, Users, ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";

const appointments = [
  {
    id: 1,
    title: "Business Consultation",
    client: "John Smith",
    time: "09:00 AM",
    duration: "60 min",
    status: "Confirmed",
    type: "Consulting"
  },
  {
    id: 2,
    title: "Marketing Strategy",
    client: "Sarah Johnson",
    time: "11:00 AM",
    duration: "90 min", 
    status: "Confirmed",
    type: "Marketing"
  },
  {
    id: 3,
    title: "Financial Planning",
    client: "Michael Brown",
    time: "02:30 PM",
    duration: "45 min",
    status: "Pending",
    type: "Finance"
  },
  {
    id: 4,
    title: "Team Workshop",
    client: "ABC Corp",
    time: "04:00 PM",
    duration: "120 min",
    status: "Confirmed",
    type: "Training"
  }
];

const statusColors: { [key: string]: string } = {
  "Confirmed": "bg-green-100 text-green-800",
  "Pending": "bg-yellow-100 text-yellow-800",
  "Cancelled": "bg-red-100 text-red-800"
};

export default function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<"day" | "week" | "month">("day");

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric", 
      month: "long",
      day: "numeric"
    });
  };

  return (
    <div className="flex flex-col w-full h-full">
      <div className="border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Calendar</h1>
            <p className="text-muted-foreground">Manage your appointments and schedule</p>
          </div>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Appointment
          </Button>
        </div>
      </div>

      <div className="p-6 flex-1">
        {/* Calendar Controls */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <h2 className="text-lg font-semibold min-w-[200px] text-center">
                {formatDate(currentDate)}
              </h2>
              <Button variant="outline" size="sm">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <Button variant="outline" size="sm">
              Today
            </Button>
          </div>
          <div className="flex gap-2">
            <Button 
              variant={view === "day" ? "default" : "outline"} 
              size="sm"
              onClick={() => setView("day")}
            >
              Day
            </Button>
            <Button 
              variant={view === "week" ? "default" : "outline"} 
              size="sm"
              onClick={() => setView("week")}
            >
              Week
            </Button>
            <Button 
              variant={view === "month" ? "default" : "outline"} 
              size="sm"
              onClick={() => setView("month")}
            >
              Month
            </Button>
          </div>
        </div>

        {/* Today's Schedule */}
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarIcon className="h-5 w-5" />
                  Today's Schedule
                </CardTitle>
                <CardDescription>
                  {appointments.length} appointments scheduled
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {appointments.map((appointment) => (
                  <div
                    key={appointment.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="text-center">
                        <div className="text-lg font-semibold">{appointment.time}</div>
                        <div className="text-xs text-muted-foreground flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          {appointment.duration}
                        </div>
                      </div>
                      <div>
                        <h4 className="font-semibold">{appointment.title}</h4>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Users className="h-4 w-4" />
                          <span>{appointment.client}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="secondary"
                        className={statusColors[appointment.status] || "bg-gray-100 text-gray-800"}
                      >
                        {appointment.status}
                      </Badge>
                      <Badge variant="outline">
                        {appointment.type}
                      </Badge>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Quick Stats */}
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Today's Overview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Total Appointments</span>
                  <span className="font-semibold">4</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Confirmed</span>
                  <span className="font-semibold text-green-600">3</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Pending</span>
                  <span className="font-semibold text-yellow-600">1</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Total Duration</span>
                  <span className="font-semibold">5h 15m</span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t">
                  <span className="text-sm text-muted-foreground">Expected Revenue</span>
                  <span className="font-semibold text-green-600">$770</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <Plus className="mr-2 h-4 w-4" />
                  Schedule Appointment
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <Users className="mr-2 h-4 w-4" />
                  View All Clients
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  Calendar Settings
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}