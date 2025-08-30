'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, DollarSign, Scissors, Sparkles } from 'lucide-react';

interface Service {
  id: string;
  name: string;
  description: string;
  price: string;
  duration: number;
  category: string;
}

interface ServiceSelectorProps {
  services: Service[];
  onSelect: (service: Service) => void;
  selectedService: Service | null;
}

const categoryIcons: Record<string, any> = {
  haircut: Scissors,
  shave: Sparkles,
  treatment: Sparkles,
  package: Sparkles,
};

const categoryLabels: Record<string, string> = {
  haircut: 'Haircuts',
  shave: 'Shaves & Beards',
  treatment: 'Treatments',
  package: 'Packages',
};

export default function ServiceSelector({ services, onSelect, selectedService }: ServiceSelectorProps) {
  // Group services by category
  const groupedServices = services.reduce((acc, service) => {
    const category = service.category || 'other';
    if (!acc[category]) acc[category] = [];
    acc[category].push(service);
    return acc;
  }, {} as Record<string, Service[]>);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Select a Service</h2>
        <p className="text-muted-foreground">Choose from our professional barbering services</p>
      </div>

      {Object.entries(groupedServices).map(([category, categoryServices]) => {
        const Icon = categoryIcons[category] || Scissors;
        const label = categoryLabels[category] || category;

        return (
          <div key={category}>
            <div className="flex items-center gap-2 mb-3">
              <Icon className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold">{label}</h3>
            </div>
            
            <div className="grid gap-3 sm:grid-cols-2">
              {categoryServices.map((service) => (
                <Card
                  key={service.id}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    selectedService?.id === service.id
                      ? 'ring-2 ring-primary'
                      : 'hover:ring-1 hover:ring-primary/50'
                  }`}
                  onClick={() => onSelect(service)}
                >
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium text-base">{service.name}</h4>
                      <Badge variant="secondary" className="ml-2">
                        ${service.price}
                      </Badge>
                    </div>
                    
                    {service.description && (
                      <p className="text-sm text-muted-foreground mb-3">
                        {service.description}
                      </p>
                    )}
                    
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{service.duration} min</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <DollarSign className="w-3 h-3" />
                        <span>${service.price}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        );
      })}

      {services.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">No services available at this time.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}