"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar as CalendarIcon, Plus, Clock, Users, ChevronLeft, ChevronRight, Phone, Mail, CheckCircle, XCircle, AlertCircle, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import AppointmentEditModal from "@/components/appointments/AppointmentEditModal";

interface Appointment {
  id: string;
  title: string;
  client: string;
  clientEmail?: string;
  clientPhone?: string;
  time: string;
  startTime: string;
  endTime: string;
  duration: number;
  status: string;
  paymentStatus: string;
  price: string;
  type: string;
  barber: string;
  barberId?: string;
  serviceId?: string;
  notes?: string;
  isToday: boolean;
  isPast: boolean;
}

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

interface AppointmentStats {
  total: number;
  confirmed: number;
  scheduled: number;
  completed: number;
  cancelled: number;
  noShow: number;
  totalRevenue: number;
  totalDuration: number;
}

const statusColors: { [key: string]: string } = {
  "confirmed": "bg-green-100 text-green-800",
  "scheduled": "bg-blue-100 text-blue-800",
  "completed": "bg-gray-100 text-gray-800",
  "cancelled": "bg-red-100 text-red-800",
  "no_show": "bg-orange-100 text-orange-800",
  "pending": "bg-yellow-100 text-yellow-800"
};

const statusIcons: { [key: string]: any } = {
  "confirmed": CheckCircle,
  "scheduled": CalendarIcon,
  "completed": CheckCircle,
  "cancelled": XCircle,
  "no_show": AlertCircle,
  "pending": Clock
};

export default function DashboardDemo() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<"day" | "week" | "month">("day");
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [stats, setStats] = useState<AppointmentStats>({
    total: 0,
    confirmed: 0,
    scheduled: 0,
    completed: 0,
    cancelled: 0,
    noShow: 0,
    totalRevenue: 0,
    totalDuration: 0,
  });
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [services, setServices] = useState<Service[]>([]);
  const [barbers, setBarbers] = useState<Barber[]>([]);

  // Fetch services and barbers on mount
  useEffect(() => {
    const shopId = '6ac05b41-85e2-4b3e-9985-e5c7ad813684'; // Tomb45 Channelside
    
    // Fetch services
    fetch(`/api/services?shopId=${shopId}`)
      .then(res => res.json())
      .then(data => setServices(data.services || []))
      .catch(err => console.error('Error fetching services:', err));
    
    // Fetch barbers
    fetch(`/api/barbers?shopId=${shopId}`)
      .then(res => res.json())
      .then(data => setBarbers(data.barbers || []))
      .catch(err => console.error('Error fetching barbers:', err));
  }, []);

  // Fetch appointments for the current date - PUBLIC MODE for demo
  const fetchAppointments = async () => {
    try {
      setLoading(true);
      
      // Calculate date range based on view
      let startDate = new Date(currentDate);
      let endDate = new Date(currentDate);
      
      if (view === "day") {
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
      } else if (view === "week") {
        const day = startDate.getDay();
        const diff = startDate.getDate() - day;
        startDate = new Date(startDate.setDate(diff));
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 6);
        endDate.setHours(23, 59, 59, 999);
      } else {
        startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
        endDate.setHours(23, 59, 59, 999);
      }

      const params = new URLSearchParams({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        public: 'true', // Use public mode for demo
        shopId: '6ac05b41-85e2-4b3e-9985-e5c7ad813684' // Tomb45 Channelside
      });

      const response = await fetch(`/api/appointments?${params}`);
      
      if (!response.ok) {
        throw new Error("Failed to fetch appointments");
      }

      const data = await response.json();
      setAppointments(data.appointments || []);
      setStats(data.stats || {
        total: 0,
        confirmed: 0,
        scheduled: 0,
        completed: 0,
        cancelled: 0,
        noShow: 0,
        totalRevenue: 0,
        totalDuration: 0,
      });
    } catch (error) {
      console.error("Error fetching appointments:", error);
      toast.error("Failed to load appointments");
    } finally {
      setLoading(false);
    }
  };

  // Update appointment status (disabled in demo)
  const updateAppointmentStatus = async (appointmentId: string, newStatus: string) => {
    // Show demo message
    toast.info(`Demo Mode: Would update appointment to ${newStatus}`);
    
    // Simulate the update locally for demo
    setAppointments(prev => prev.map(apt => 
      apt.id === appointmentId ? { ...apt, status: newStatus } : apt
    ));
    
    // Update stats
    const newStats = { ...stats };
    const appointment = appointments.find(a => a.id === appointmentId);
    if (appointment) {
      // Decrease old status count
      const oldStatus = appointment.status === 'no_show' ? 'noShow' : appointment.status;
      if (oldStatus in newStats) {
        (newStats as any)[oldStatus]--;
      }
      // Increase new status count
      const newStatusKey = newStatus === 'no_show' ? 'noShow' : newStatus;
      if (newStatusKey in newStats) {
        (newStats as any)[newStatusKey]++;
      }
      // Update revenue if needed
      if (newStatus === 'cancelled' || newStatus === 'no_show') {
        newStats.totalRevenue -= parseFloat(appointment.price);
      } else if (appointment.status === 'cancelled' || appointment.status === 'no_show') {
        newStats.totalRevenue += parseFloat(appointment.price);
      }
    }
    setStats(newStats);
  };

  useEffect(() => {
    fetchAppointments();
  }, [currentDate, view]);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric", 
      month: "long",
      day: "numeric"
    });
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins > 0 ? `${mins}m` : ''}`;
    }
    return `${mins}m`;
  };

  return (
    <div className="flex flex-col w-full h-full min-h-screen bg-background">
      {/* Demo Notice */}
      <div className="bg-yellow-100 text-yellow-800 px-4 py-2 text-center text-sm">
        <strong>Demo Mode:</strong> This is a read-only demonstration of the barber dashboard. Login to access full functionality.
      </div>
      
      <div className="border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Calendar Dashboard</h1>
            <p className="text-muted-foreground">Manage your appointments and schedule</p>
          </div>
          <Button onClick={() => toast.info("Demo Mode: Would open new appointment form")}>
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
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  const newDate = new Date(currentDate);
                  newDate.setDate(newDate.getDate() - 1);
                  setCurrentDate(newDate);
                }}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <h2 className="text-lg font-semibold min-w-[200px] text-center">
                {formatDate(currentDate)}
              </h2>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  const newDate = new Date(currentDate);
                  newDate.setDate(newDate.getDate() + 1);
                  setCurrentDate(newDate);
                }}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setCurrentDate(new Date())}
            >
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
                  {view === "day" ? "Today's" : view === "week" ? "This Week's" : "This Month's"} Schedule
                </CardTitle>
                <CardDescription>
                  {appointments.length} appointments scheduled
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                ) : appointments.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No appointments scheduled for {formatDate(currentDate)}
                  </div>
                ) : (
                  appointments.map((appointment) => {
                    const StatusIcon = statusIcons[appointment.status] || Clock;
                    const isUpdating = updatingId === appointment.id;
                    
                    return (
                      <div
                        key={appointment.id}
                        className="flex flex-col gap-3 p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                        onClick={(e) => {
                          // Don't open edit modal if clicking on action buttons
                          if ((e.target as HTMLElement).closest('button')) return;
                          setEditingAppointment(appointment);
                          setIsEditModalOpen(true);
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="text-center">
                              <div className="text-lg font-semibold">{appointment.time}</div>
                              <div className="text-xs text-muted-foreground flex items-center">
                                <Clock className="h-3 w-3 mr-1" />
                                {formatDuration(appointment.duration)}
                              </div>
                            </div>
                            <div>
                              <h4 className="font-semibold">{appointment.title}</h4>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Users className="h-4 w-4" />
                                <span>{appointment.client}</span>
                              </div>
                              {appointment.clientPhone && (
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <Phone className="h-3 w-3" />
                                  <a href={`tel:${appointment.clientPhone}`} className="hover:underline">
                                    {appointment.clientPhone}
                                  </a>
                                </div>
                              )}
                              {appointment.clientEmail && (
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <Mail className="h-3 w-3" />
                                  <a href={`mailto:${appointment.clientEmail}`} className="hover:underline">
                                    {appointment.clientEmail}
                                  </a>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <div className="flex items-center gap-2">
                              <Badge
                                variant="secondary"
                                className={statusColors[appointment.status] || "bg-gray-100 text-gray-800"}
                              >
                                <StatusIcon className="h-3 w-3 mr-1" />
                                {appointment.status}
                              </Badge>
                              <Badge variant="outline">
                                {appointment.type}
                              </Badge>
                            </div>
                            <div className="text-lg font-semibold text-green-600">
                              ${appointment.price}
                            </div>
                          </div>
                        </div>
                        
                        {/* Status Update Actions - Show for all non-completed/cancelled appointments */}
                        {appointment.status !== 'completed' && appointment.status !== 'cancelled' && (
                          <div className="flex gap-2 pt-2 border-t">
                            {appointment.status !== 'completed' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  updateAppointmentStatus(appointment.id, 'completed');
                                }}
                                disabled={isUpdating}
                              >
                                {isUpdating ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <CheckCircle className="h-3 w-3 mr-1" />}
                                Complete
                              </Button>
                            )}
                            {appointment.status !== 'no_show' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  updateAppointmentStatus(appointment.id, 'no_show');
                                }}
                                disabled={isUpdating}
                              >
                                {isUpdating ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <AlertCircle className="h-3 w-3 mr-1" />}
                                No Show
                              </Button>
                            )}
                            {appointment.status !== 'cancelled' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  updateAppointmentStatus(appointment.id, 'cancelled');
                                }}
                                disabled={isUpdating}
                              >
                                {isUpdating ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <XCircle className="h-3 w-3 mr-1" />}
                                Cancel
                              </Button>
                            )}
                          </div>
                        )}
                        
                        {appointment.notes && (
                          <div className="text-sm text-muted-foreground italic pt-2 border-t">
                            Note: {appointment.notes}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>
          </div>

          {/* Quick Stats */}
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Overview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Total Appointments</span>
                  <span className="font-semibold">{stats.total}</span>
                </div>
                {stats.confirmed > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Confirmed</span>
                    <span className="font-semibold text-green-600">{stats.confirmed}</span>
                  </div>
                )}
                {stats.scheduled > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Scheduled</span>
                    <span className="font-semibold text-blue-600">{stats.scheduled}</span>
                  </div>
                )}
                {stats.completed > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Completed</span>
                    <span className="font-semibold text-gray-600">{stats.completed}</span>
                  </div>
                )}
                {stats.cancelled > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Cancelled</span>
                    <span className="font-semibold text-red-600">{stats.cancelled}</span>
                  </div>
                )}
                {stats.noShow > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">No Show</span>
                    <span className="font-semibold text-orange-600">{stats.noShow}</span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Total Duration</span>
                  <span className="font-semibold">{formatDuration(stats.totalDuration)}</span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t">
                  <span className="text-sm text-muted-foreground">Expected Revenue</span>
                  <span className="font-semibold text-green-600">${stats.totalRevenue.toFixed(2)}</span>
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
      
      {/* Edit Appointment Modal */}
      {editingAppointment && (
        <AppointmentEditModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setEditingAppointment(null);
          }}
          appointment={editingAppointment}
          services={services}
          barbers={barbers}
          onSave={(updatedAppointment) => {
            // Update the appointment in the list
            setAppointments(prev => prev.map(apt => 
              apt.id === updatedAppointment.id ? { ...apt, ...updatedAppointment } : apt
            ));
            toast.success("Appointment updated successfully");
          }}
          isDemo={true}
        />
      )}
    </div>
  );
}