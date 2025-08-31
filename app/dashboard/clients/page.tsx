"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Phone, Mail, Calendar, Loader2, AlertCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { clientService, type ClientWithStats, type CreateClientData } from "@/lib/services/client-service";

export default function Clients() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [clients, setClients] = useState<ClientWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [newClient, setNewClient] = useState<CreateClientData>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    notes: "",
  });

  // Load clients on component mount and when search changes
  useEffect(() => {
    loadClients();
  }, [searchQuery]);

  const loadClients = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await clientService.getClients({
        search: searchQuery || undefined,
        limit: 50,
      });
      setClients(response.clients);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load clients');
    } finally {
      setLoading(false);
    }
  };

  const handleAddClient = async () => {
    if (!newClient.firstName || !newClient.lastName) {
      toast.error("Please fill in at least first and last name");
      return;
    }

    try {
      setCreating(true);
      const response = await clientService.createClient(newClient);
      toast.success(`Client "${clientService.getFullName(response.client)}" added successfully`);
      setIsAddModalOpen(false);
      setNewClient({ firstName: "", lastName: "", email: "", phone: "", notes: "" });
      // Reload clients to show the new one
      loadClients();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create client');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="flex flex-col w-full h-full">
      <div className="border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Client Management</h1>
            <p className="text-muted-foreground">Manage your client relationships and service history</p>
          </div>
          <Button onClick={() => setIsAddModalOpen(true)}>
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
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="grid gap-4">
          {loading ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                <p className="text-muted-foreground">Loading clients...</p>
              </CardContent>
            </Card>
          ) : error ? (
            <Card>
              <CardContent className="p-8 text-center">
                <AlertCircle className="h-8 w-8 mx-auto mb-4 text-destructive" />
                <p className="text-destructive mb-4">{error}</p>
                <Button onClick={loadClients} variant="outline">
                  Try Again
                </Button>
              </CardContent>
            </Card>
          ) : clients.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-muted-foreground">No clients found matching your search.</p>
              </CardContent>
            </Card>
          ) : (
            clients.map((client) => (
            <Card key={client.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                      <span className="text-lg font-semibold text-primary">
                        {clientService.getInitials(client)}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">{clientService.getFullName(client)}</h3>
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground mt-1">
                        {client.email && (
                          <div className="flex items-center">
                            <Mail className="h-4 w-4 mr-1" />
                            {client.email}
                          </div>
                        )}
                        {client.phone && (
                          <div className="flex items-center">
                            <Phone className="h-4 w-4 mr-1" />
                            {clientService.formatPhone(client.phone)}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className="text-sm font-medium">{clientService.formatCurrency(client.totalSpent)}</p>
                      <p className="text-xs text-muted-foreground">Total Spent</p>
                    </div>
                    {client.lastVisit && (
                      <div className="text-right">
                        <p className="text-sm font-medium">{clientService.formatDate(client.lastVisit)}</p>
                        <p className="text-xs text-muted-foreground">Last Service</p>
                      </div>
                    )}
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
          )))}
        </div>
      </div>

      {/* Add New Client Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add New Client</DialogTitle>
            <DialogDescription>
              Enter the client's information to add them to your database.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name *</Label>
                <Input
                  id="firstName"
                  placeholder="John"
                  value={newClient.firstName}
                  onChange={(e) => setNewClient(prev => ({ ...prev, firstName: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name *</Label>
                <Input
                  id="lastName"
                  placeholder="Doe"
                  value={newClient.lastName}
                  onChange={(e) => setNewClient(prev => ({ ...prev, lastName: e.target.value }))}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="john@example.com"
                value={newClient.email || ""}
                onChange={(e) => setNewClient(prev => ({ ...prev, email: e.target.value || undefined }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="(555) 123-4567"
                value={newClient.phone || ""}
                onChange={(e) => setNewClient(prev => ({ ...prev, phone: e.target.value || undefined }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Input
                id="notes"
                placeholder="Any special preferences or notes..."
                value={newClient.notes || ""}
                onChange={(e) => setNewClient(prev => ({ ...prev, notes: e.target.value || undefined }))}
              />
            </div>
          </div>
          
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => {
              setIsAddModalOpen(false);
              setNewClient({ firstName: "", lastName: "", email: "", phone: "", notes: "" });
            }}>
              Cancel
            </Button>
            <Button onClick={handleAddClient} disabled={creating}>
              {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add Client
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}