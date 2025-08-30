'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User, Scissors, Star } from 'lucide-react';

interface Barber {
  id: string;
  name: string;
  image?: string;
  bio?: string;
}

interface BarberSelectorProps {
  barbers: Barber[];
  onSelect: (barber: Barber | null) => void;
  selectedBarber: Barber | null;
}

export default function BarberSelector({ barbers, onSelect, selectedBarber }: BarberSelectorProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Select Your Barber</h2>
        <p className="text-muted-foreground">Choose your preferred barber or select any available</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {/* Any Available Option */}
        <Card
          className={`cursor-pointer transition-all ${
            selectedBarber === null ? 'ring-2 ring-primary bg-primary/5' : 'hover:ring-1 hover:ring-primary/50'
          }`}
          onClick={() => onSelect(null)}
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center">
                <User className="w-6 h-6 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium">Any Available Barber</p>
                <p className="text-sm text-muted-foreground">First available</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Individual Barbers */}
        {barbers.map((barber) => (
          <Card
            key={barber.id}
            className={`cursor-pointer transition-all ${
              selectedBarber?.id === barber.id ? 'ring-2 ring-primary bg-primary/5' : 'hover:ring-1 hover:ring-primary/50'
            }`}
            onClick={() => onSelect(barber)}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Avatar className="w-12 h-12">
                  <AvatarImage src={barber.image} alt={barber.name} />
                  <AvatarFallback className="bg-primary/10">
                    {barber.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-medium">{barber.name}</p>
                  {barber.bio ? (
                    <p className="text-sm text-muted-foreground line-clamp-1">{barber.bio}</p>
                  ) : (
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Scissors className="w-3 h-3" />
                      <span>Professional Barber</span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        
        {/* Show placeholder if no barbers */}
        {barbers.length === 0 && (
          <Card className="col-span-full">
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground">No barbers available at this time.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}