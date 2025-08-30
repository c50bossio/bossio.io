"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Users, 
  Calendar,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';

const revenueData = [
  { name: 'Jan', revenue: 8400 },
  { name: 'Feb', revenue: 9800 },
  { name: 'Mar', revenue: 12100 },
  { name: 'Apr', revenue: 11200 },
  { name: 'May', revenue: 13500 },
  { name: 'Jun', revenue: 14200 },
  { name: 'Jul', revenue: 15800 },
  { name: 'Aug', revenue: 16500 },
];

const serviceData = [
  { name: 'Business Consultation', value: 35, revenue: 5250, color: '#8884d8' },
  { name: 'Marketing Strategy', value: 28, revenue: 5600, color: '#82ca9d' },
  { name: 'Financial Planning', value: 22, revenue: 2640, color: '#ffc658' },
  { name: 'Team Workshop', value: 15, revenue: 4500, color: '#ff7300' },
];

const clientGrowthData = [
  { name: 'Jan', clients: 45 },
  { name: 'Feb', clients: 52 },
  { name: 'Mar', clients: 61 },
  { name: 'Apr', clients: 68 },
  { name: 'May', clients: 76 },
  { name: 'Jun', clients: 85 },
  { name: 'Jul', clients: 94 },
  { name: 'Aug', clients: 103 },
];

export default function Analytics() {
  return (
    <div className="flex flex-col w-full h-full">
      <div className="border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Business Analytics</h1>
            <p className="text-muted-foreground">Track your business performance and growth metrics</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">Export Report</Button>
            <Button>Generate Insights</Button>
          </div>
        </div>
      </div>

      <div className="p-6 flex-1 overflow-y-auto">
        {/* Key Metrics */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">$16,500</div>
              <div className="flex items-center text-xs text-green-600">
                <ArrowUpRight className="h-4 w-4 mr-1" />
                +12.5% from last month
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Clients</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">103</div>
              <div className="flex items-center text-xs text-green-600">
                <ArrowUpRight className="h-4 w-4 mr-1" />
                +9.6% from last month
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Appointments</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">124</div>
              <div className="flex items-center text-xs text-red-600">
                <ArrowDownRight className="h-4 w-4 mr-1" />
                -3.2% from last month
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg. Revenue per Client</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">$160</div>
              <div className="flex items-center text-xs text-green-600">
                <ArrowUpRight className="h-4 w-4 mr-1" />
                +8.1% from last month
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row 1 */}
        <div className="grid gap-6 lg:grid-cols-2 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Revenue Trend</CardTitle>
              <CardDescription>Monthly revenue over the past 8 months</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`$${value}`, 'Revenue']} />
                  <Bar dataKey="revenue" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Client Growth</CardTitle>
              <CardDescription>Client acquisition over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={clientGrowthData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`${value}`, 'Clients']} />
                  <Line type="monotone" dataKey="clients" stroke="#82ca9d" strokeWidth={3} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row 2 */}
        <div className="grid gap-6 lg:grid-cols-3 mb-8">
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Service Distribution</CardTitle>
              <CardDescription>Revenue by service type</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={serviceData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {serviceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value}%`, 'Share']} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Service Performance</CardTitle>
              <CardDescription>Breakdown of services by revenue and bookings</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {serviceData.map((service, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: service.color }}
                      />
                      <div>
                        <p className="font-medium">{service.name}</p>
                        <p className="text-sm text-muted-foreground">{service.value}% of total</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">${service.revenue.toLocaleString()}</p>
                      <p className="text-sm text-muted-foreground">Revenue</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* AI Insights */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              AI Business Insights
            </CardTitle>
            <CardDescription>Automated analysis and recommendations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    Opportunity
                  </Badge>
                </div>
                <h4 className="font-semibold mb-1">Revenue Growth Potential</h4>
                <p className="text-sm text-muted-foreground">
                  Marketing Strategy sessions show 28% higher per-client revenue. Consider promoting this service.
                </p>
              </div>
              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                    Insight
                  </Badge>
                </div>
                <h4 className="font-semibold mb-1">Client Retention</h4>
                <p className="text-sm text-muted-foreground">
                  Clients booking multiple services have 65% higher lifetime value. Suggest complementary services.
                </p>
              </div>
              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                    Action
                  </Badge>
                </div>
                <h4 className="font-semibold mb-1">Optimize Scheduling</h4>
                <p className="text-sm text-muted-foreground">
                  Tuesday and Thursday show 15% lower booking rates. Consider promotional pricing for these days.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}