"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Phone, Mail, Calendar } from "lucide-react";

const clients = [
  {
    id: 1,
    name: "John Smith",
    email: "john.smith@example.com",
    phone: "+1 (555) 123-4567",
    lastService: "2024-08-15",
    totalSpent: "$1,250",
    status: "Active",
    nextAppointment: "2024-09-05"
  },
  {
    id: 2,
    name: "Sarah Johnson",
    email: "sarah.j@example.com",
    phone: "+1 (555) 987-6543",
    lastService: "2024-08-20",
    totalSpent: "$890",
    status: "Active",
    nextAppointment: "2024-09-10"
  },
  {
    id: 3,
    name: "Michael Brown",
    email: "m.brown@example.com",
    phone: "+1 (555) 456-7890",
    lastService: "2024-07-30",
    totalSpent: "$2,100",
    status: "Inactive",
    nextAppointment: null
  },
];

export default function Clients() {
  return (
    <div className="flex flex-col w-full h-full">
      <div className="border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Client Management</h1>
            <p className="text-muted-foreground">Manage your client relationships and service history</p>
          </div>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add New Client
          </Button>
        </div>
      </div>

      <div className="p-6 flex-1">
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search clients..."
              className="pl-10"
            />
          </div>
        </div>

        <div className="grid gap-4">
          {clients.map((client) => (
            <Card key={client.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                      <span className="text-lg font-semibold text-primary">
                        {client.name.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">{client.name}</h3>
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground mt-1">
                        <div className="flex items-center">
                          <Mail className="h-4 w-4 mr-1" />
                          {client.email}
                        </div>
                        <div className="flex items-center">
                          <Phone className="h-4 w-4 mr-1" />
                          {client.phone}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className="text-sm font-medium">{client.totalSpent}</p>
                      <p className="text-xs text-muted-foreground">Total Spent</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{client.lastService}</p>
                      <p className="text-xs text-muted-foreground">Last Service</p>
                    </div>
                    {client.nextAppointment && (
                      <div className="text-right">
                        <div className="flex items-center text-sm font-medium text-green-600">
                          <Calendar className="h-4 w-4 mr-1" />
                          {client.nextAppointment}
                        </div>
                        <p className="text-xs text-muted-foreground">Next Visit</p>
                      </div>
                    )}
                    <Badge variant={client.status === "Active" ? "default" : "secondary"}>
                      {client.status}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}