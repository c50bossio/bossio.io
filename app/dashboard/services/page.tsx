"use client";

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Clock, DollarSign, Users, TrendingUp, Scissors, Edit, Trash2, Check } from "lucide-react";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const BARBER_SERVICES = [
  { name: 'Standard Haircut', category: 'Haircut', price: 35, duration: 30 },
  { name: 'Fade Cut', category: 'Haircut', price: 40, duration: 45 },
  { name: 'Beard Trim', category: 'Beard', price: 20, duration: 15 },
  { name: 'Haircut & Beard', category: 'Combo', price: 50, duration: 45 },
  { name: 'Kids Cut', category: 'Kids', price: 25, duration: 30 },
  { name: 'Hot Towel Shave', category: 'Shave', price: 35, duration: 30 },
];

const categoryColors: { [key: string]: string } = {
  "Haircut": "bg-blue-100 text-blue-800",
  "Beard": "bg-green-100 text-green-800",
  "Combo": "bg-purple-100 text-purple-800",
  "Kids": "bg-orange-100 text-orange-800",
  "Shave": "bg-red-100 text-red-800"
};

export default function Services() {
  const [services, setServices] = useState<any[]>([]);
  const [shopId, setShopId] = useState<string | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [serviceToDelete, setServiceToDelete] = useState<any>(null);
  const [editingService, setEditingService] = useState<any>(null);
  const [selectedQuickServices, setSelectedQuickServices] = useState<Set<number>>(new Set());
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    price: '',
    duration: '30',
    description: '',
  });

  useEffect(() => {
    fetch('/api/shops')
      .then(res => res.json())
      .then(data => {
        if (data && data.length > 0) {
          const shop = data[0].shop;
          setShopId(shop.id);
          fetchServices(shop.id);
        }
      })
      .catch(err => console.error('Error fetching shop:', err));
  }, []);

  const fetchServices = async (shopId: string) => {
    try {
      const response = await fetch(`/api/shops/${shopId}/services`);
      if (response.ok) {
        const data = await response.json();
        setServices(data);
      }
    } catch (error) {
      console.error('Error fetching services:', error);
    }
  };

  const handleAddService = async () => {
    if (!shopId) return;

    try {
      const response = await fetch(`/api/shops/${shopId}/services`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          price: parseFloat(formData.price),
          duration: parseInt(formData.duration),
          description: `Professional ${formData.name.toLowerCase()} service`,
        }),
      });

      if (response.ok) {
        const newService = await response.json();
        setServices([...services, newService]);
        setIsAddDialogOpen(false);
        setFormData({ name: '', category: '', price: '', duration: '30' });
      }
    } catch (error) {
      console.error('Error adding service:', error);
    }
  };

  const handleQuickAdd = async (service: typeof BARBER_SERVICES[0]) => {
    if (!shopId) return;

    try {
      const response = await fetch(`/api/shops/${shopId}/services`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...service,
          description: `Professional ${service.name.toLowerCase()} service`,
        }),
      });

      if (response.ok) {
        const newService = await response.json();
        setServices([...services, newService]);
      }
    } catch (error) {
      console.error('Error adding service:', error);
    }
  };

  const handleEditService = async () => {
    if (!shopId || !editingService) return;

    try {
      const response = await fetch(`/api/shops/${shopId}/services/${editingService.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          price: parseFloat(formData.price),
          duration: parseInt(formData.duration),
        }),
      });

      if (response.ok) {
        const updatedService = await response.json();
        setServices(services.map(s => s.id === updatedService.id ? updatedService : s));
        setIsEditDialogOpen(false);
        setEditingService(null);
        setFormData({ name: '', category: '', price: '', duration: '30', description: '' });
      }
    } catch (error) {
      console.error('Error updating service:', error);
    }
  };

  const handleDeleteService = async () => {
    if (!shopId || !serviceToDelete) return;

    try {
      const response = await fetch(`/api/shops/${shopId}/services/${serviceToDelete.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setServices(services.filter(s => s.id !== serviceToDelete.id));
        setDeleteDialogOpen(false);
        setServiceToDelete(null);
      }
    } catch (error) {
      console.error('Error deleting service:', error);
    }
  };

  const handleMultiQuickAdd = async () => {
    if (!shopId || selectedQuickServices.size === 0) return;

    const selectedServices = Array.from(selectedQuickServices).map(index => BARBER_SERVICES[index]);
    
    try {
      const promises = selectedServices.map(service =>
        fetch(`/api/shops/${shopId}/services`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...service,
            description: `Professional ${service.name.toLowerCase()} service`,
          }),
        })
      );

      const responses = await Promise.all(promises);
      const newServices = await Promise.all(responses.map(r => r.json()));
      setServices([...services, ...newServices]);
      setSelectedQuickServices(new Set());
    } catch (error) {
      console.error('Error adding multiple services:', error);
    }
  };

  const openEditDialog = (service: any) => {
    setEditingService(service);
    setFormData({
      name: service.name,
      category: service.category,
      price: service.price.toString(),
      duration: service.duration.toString(),
      description: service.description || '',
    });
    setIsEditDialogOpen(true);
  };

  const toggleQuickServiceSelection = (index: number) => {
    const newSelection = new Set(selectedQuickServices);
    if (newSelection.has(index)) {
      newSelection.delete(index);
    } else {
      newSelection.add(index);
    }
    setSelectedQuickServices(newSelection);
  };
  return (
    <div className="flex flex-col w-full h-full">
      <div className="border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Barbershop Services</h1>
            <p className="text-muted-foreground">Manage your service offerings and pricing</p>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add New Service
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Service</DialogTitle>
                <DialogDescription>
                  Create a new service for your barbershop
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Service Name</Label>
                  <Input
                    id="name"
                    placeholder="e.g., Premium Fade Cut"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Haircut">Haircut</SelectItem>
                      <SelectItem value="Beard">Beard</SelectItem>
                      <SelectItem value="Combo">Combo</SelectItem>
                      <SelectItem value="Kids">Kids</SelectItem>
                      <SelectItem value="Shave">Shave</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="price">Price ($)</Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      placeholder="35.00"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="duration">Duration (min)</Label>
                    <Input
                      id="duration"
                      type="number"
                      placeholder="30"
                      value={formData.duration}
                      onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                    />
                  </div>
                </div>
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddService}>Add Service</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="p-6 flex-1">
        {services.length === 0 ? (
          <div>
            <Card className="mb-6">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Quick Add Popular Services</CardTitle>
                    <CardDescription>
                      Select multiple services to add them all at once
                    </CardDescription>
                  </div>
                  {selectedQuickServices.size > 0 && (
                    <Button onClick={handleMultiQuickAdd}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add {selectedQuickServices.size} Selected
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {BARBER_SERVICES.map((service, index) => (
                    <Card 
                      key={index} 
                      className={`cursor-pointer transition-all ${
                        selectedQuickServices.has(index) 
                          ? 'ring-2 ring-primary bg-primary/5' 
                          : 'hover:bg-accent'
                      }`}
                      onClick={() => toggleQuickServiceSelection(index)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <h3 className="font-semibold">{service.name}</h3>
                            <Badge variant="secondary" className="mt-1">
                              {service.category}
                            </Badge>
                          </div>
                          <Checkbox 
                            checked={selectedQuickServices.has(index)}
                            onCheckedChange={() => toggleQuickServiceSelection(index)}
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <DollarSign className="w-3 h-3" />
                            ${service.price}
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {service.duration} min
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 mb-8">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Services</CardTitle>
                  <Scissors className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{services.length}</div>
                  <p className="text-xs text-muted-foreground">Active services</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Avg. Price</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    ${services.length > 0 ? Math.round(services.reduce((acc, s) => acc + s.price, 0) / services.length) : 0}
                  </div>
                  <p className="text-xs text-muted-foreground">Per service</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Avg. Duration</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {services.length > 0 ? Math.round(services.reduce((acc, s) => acc + s.duration, 0) / services.length) : 0} min
                  </div>
                  <p className="text-xs text-muted-foreground">Per service</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Est. Daily Revenue</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    ${services.length > 0 ? services.reduce((acc, s) => acc + s.price, 0) * 8 : 0}
                  </div>
                  <p className="text-xs text-muted-foreground">8 appointments/day</p>
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
                          <Badge variant={service.isActive ? "default" : "secondary"}>
                            {service.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                        <p className="text-muted-foreground mb-3">{service.description}</p>
                        <div className="flex items-center gap-6 text-sm">
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 mr-1 text-muted-foreground" />
                            <span>{service.duration} min</span>
                          </div>
                          <div className="flex items-center">
                            <DollarSign className="h-4 w-4 mr-1 text-muted-foreground" />
                            <span className="font-medium">${service.price}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => openEditDialog(service)}
                        >
                          <Edit className="w-4 h-4 mr-1" />
                          Edit
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            setServiceToDelete(service);
                            setDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Edit Service Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Service</DialogTitle>
            <DialogDescription>
              Update the details for this service
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Service Name</Label>
              <Input
                id="edit-name"
                placeholder="e.g., Premium Fade Cut"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-category">Category</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Haircut">Haircut</SelectItem>
                  <SelectItem value="Beard">Beard</SelectItem>
                  <SelectItem value="Combo">Combo</SelectItem>
                  <SelectItem value="Kids">Kids</SelectItem>
                  <SelectItem value="Shave">Shave</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Input
                id="edit-description"
                placeholder="Service description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-price">Price ($)</Label>
                <Input
                  id="edit-price"
                  type="number"
                  step="0.01"
                  placeholder="35.00"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-duration">Duration (min)</Label>
                <Input
                  id="edit-duration"
                  type="number"
                  placeholder="30"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                />
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditService}>Update Service</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{serviceToDelete?.name}" from your services. 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteService}>
              Delete Service
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}