"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Clock, DollarSign, Users, TrendingUp } from "lucide-react";

const services = [
  {
    id: 1,
    name: "Business Consultation",
    description: "Strategic business planning and analysis",
    duration: "60 minutes",
    price: "$150",
    category: "Consulting",
    bookings: 24,
    revenue: "$3,600",
    status: "Active"
  },
  {
    id: 2,
    name: "Marketing Strategy Session",
    description: "Digital marketing and brand positioning",
    duration: "90 minutes",
    price: "$200",
    category: "Marketing",
    bookings: 18,
    revenue: "$3,600",
    status: "Active"
  },
  {
    id: 3,
    name: "Financial Planning",
    description: "Budget optimization and financial forecasting",
    duration: "45 minutes",
    price: "$120",
    category: "Finance",
    bookings: 15,
    revenue: "$1,800",
    status: "Active"
  },
  {
    id: 4,
    name: "Team Workshop",
    description: "Leadership and team building sessions",
    duration: "120 minutes",
    price: "$300",
    category: "Training",
    bookings: 8,
    revenue: "$2,400",
    status: "Active"
  }
];

const categoryColors: { [key: string]: string } = {
  "Consulting": "bg-blue-100 text-blue-800",
  "Marketing": "bg-green-100 text-green-800",
  "Finance": "bg-purple-100 text-purple-800",
  "Training": "bg-orange-100 text-orange-800"
};

export default function Services() {
  return (
    <div className="flex flex-col w-full h-full">
      <div className="border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Service Management</h1>
            <p className="text-muted-foreground">Manage your service offerings and pricing</p>
          </div>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add New Service
          </Button>
        </div>
      </div>

      <div className="p-6 flex-1">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Services</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">4</div>
              <p className="text-xs text-muted-foreground">Active services</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">65</div>
              <p className="text-xs text-muted-foreground">This month</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Service Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">$11,400</div>
              <p className="text-xs text-muted-foreground">This month</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg. Price</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">$175</div>
              <p className="text-xs text-muted-foreground">Per service</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4">
          {services.map((service) => (
            <Card key={service.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold">{service.name}</h3>
                      <Badge 
                        variant="secondary" 
                        className={categoryColors[service.category] || "bg-gray-100 text-gray-800"}
                      >
                        {service.category}
                      </Badge>
                      <Badge variant={service.status === "Active" ? "default" : "secondary"}>
                        {service.status}
                      </Badge>
                    </div>
                    <p className="text-muted-foreground mb-3">{service.description}</p>
                    <div className="flex items-center gap-6 text-sm">
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-1 text-muted-foreground" />
                        <span>{service.duration}</span>
                      </div>
                      <div className="flex items-center">
                        <DollarSign className="h-4 w-4 mr-1 text-muted-foreground" />
                        <span className="font-medium">{service.price}</span>
                      </div>
                      <div className="flex items-center">
                        <Users className="h-4 w-4 mr-1 text-muted-foreground" />
                        <span>{service.bookings} bookings</span>
                      </div>
                      <div className="flex items-center">
                        <TrendingUp className="h-4 w-4 mr-1 text-muted-foreground" />
                        <span className="font-medium text-green-600">{service.revenue}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      Edit
                    </Button>
                    <Button variant="outline" size="sm">
                      View Stats
                    </Button>
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