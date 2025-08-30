'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Scissors, 
  MapPin, 
  Phone, 
  Mail, 
  Plus, 
  Settings,
  Calendar,
  Users,
  DollarSign,
  Share2,
  Copy,
  Check
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

interface Shop {
  shop: {
    id: string;
    name: string;
    slug?: string;
    description: string;
    phone: string;
    email: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    isActive: boolean;
    createdAt: string;
  };
  role: string;
}

export function ShopHeader() {
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch('/api/shops')
      .then(res => res.json())
      .then(data => {
        setShops(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching shops:', err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded w-1/3 mb-4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!shops.length) {
    return (
      <Card className="mb-6">
        <CardContent className="p-6 text-center">
          <Scissors className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-xl font-semibold mb-2">No Barbershop Yet</h2>
          <p className="text-muted-foreground mb-4">Get started by setting up your barbershop</p>
          <Link href="/setup">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create Barbershop
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  const primaryShop = shops[0];

  const handleShare = () => {
    // Generate the booking URL using the shop slug
    const bookingUrl = `https://bossio.io/book/${primaryShop.shop.slug || primaryShop.shop.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
    
    // Copy to clipboard
    navigator.clipboard.writeText(bookingUrl).then(() => {
      setCopied(true);
      toast.success('Booking link copied to clipboard!');
      
      // Reset the copied state after 2 seconds
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {
      toast.error('Failed to copy link');
    });
  };

  return (
    <Card className="mb-6 bg-gradient-to-r from-primary/5 to-card">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
              <Scissors className="w-6 h-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-2xl flex items-center gap-2">
                {primaryShop.shop.name}
                <Badge variant={primaryShop.shop.isActive ? "default" : "secondary"}>
                  {primaryShop.shop.isActive ? 'Active' : 'Inactive'}
                </Badge>
                {primaryShop.role === 'owner' && (
                  <Badge variant="outline">Owner</Badge>
                )}
              </CardTitle>
              <CardDescription className="mt-1">
                {primaryShop.shop.description || 'Premium barbershop services'}
              </CardDescription>
              
              <div className="flex flex-wrap gap-4 mt-3 text-sm text-muted-foreground">
                {primaryShop.shop.address && (
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {primaryShop.shop.address}, {primaryShop.shop.city}, {primaryShop.shop.state} {primaryShop.shop.zipCode}
                  </div>
                )}
                {primaryShop.shop.phone && (
                  <div className="flex items-center gap-1">
                    <Phone className="w-3 h-3" />
                    {primaryShop.shop.phone}
                  </div>
                )}
                {primaryShop.shop.email && (
                  <div className="flex items-center gap-1">
                    <Mail className="w-3 h-3" />
                    {primaryShop.shop.email}
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleShare}
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 mr-2" />
                  Share Link
                </>
              )}
            </Button>
            <Link href="/dashboard/settings">
              <Button variant="outline" size="sm">
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Button>
            </Link>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Link href="/dashboard/services">
            <Button variant="outline" className="w-full justify-start">
              <Plus className="w-4 h-4 mr-2" />
              Add Services
            </Button>
          </Link>
          <Link href="/dashboard/calendar">
            <Button variant="outline" className="w-full justify-start">
              <Calendar className="w-4 h-4 mr-2" />
              Manage Calendar
            </Button>
          </Link>
          <Link href="/dashboard/clients">
            <Button variant="outline" className="w-full justify-start">
              <Users className="w-4 h-4 mr-2" />
              View Clients
            </Button>
          </Link>
          <Link href="/dashboard/payment">
            <Button variant="outline" className="w-full justify-start">
              <DollarSign className="w-4 h-4 mr-2" />
              Payments
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}