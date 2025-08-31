import type { Client, NewClient } from '@/lib/shop-schema';

export interface ClientWithStats extends Client {
  nextAppointment?: string;
  status: 'Active' | 'Inactive';
}

export interface CreateClientData {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  notes?: string;
  allergies?: string;
  emailNotifications?: boolean;
  smsNotifications?: boolean;
}

export interface UpdateClientData extends Partial<CreateClientData> {}

export interface ClientsResponse {
  clients: ClientWithStats[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

export class ClientService {
  private baseUrl = '/api/clients';

  async getClients(options?: {
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<ClientsResponse> {
    const searchParams = new URLSearchParams();
    
    if (options?.search) {
      searchParams.set('search', options.search);
    }
    if (options?.limit) {
      searchParams.set('limit', options.limit.toString());
    }
    if (options?.offset) {
      searchParams.set('offset', options.offset.toString());
    }

    const response = await fetch(`${this.baseUrl}?${searchParams.toString()}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch clients: ${response.statusText}`);
    }

    const data = await response.json();
    
    // Transform the data to match our expected format
    const clientsWithStats: ClientWithStats[] = data.clients.map((client: Client) => ({
      ...client,
      status: client.isActive ? 'Active' : 'Inactive',
      // TODO: Add nextAppointment calculation when appointment API is ready
    }));

    return {
      clients: clientsWithStats,
      pagination: data.pagination,
    };
  }

  async getClient(id: string): Promise<{
    client: Client;
    appointmentHistory: any[];
    stats: {
      totalAppointments: number;
      completedAppointments: number;
      totalSpent: string;
      lastVisit: string | null;
    };
  }> {
    const response = await fetch(`${this.baseUrl}/${id}`);
    
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Client not found');
      }
      throw new Error(`Failed to fetch client: ${response.statusText}`);
    }

    return await response.json();
  }

  async createClient(data: CreateClientData): Promise<{ client: Client; message: string }> {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create client');
    }

    return await response.json();
  }

  async updateClient(id: string, data: UpdateClientData): Promise<{ client: Client; message: string }> {
    const response = await fetch(`${this.baseUrl}/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update client');
    }

    return await response.json();
  }

  async deleteClient(id: string): Promise<{ message: string }> {
    const response = await fetch(`${this.baseUrl}/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete client');
    }

    return await response.json();
  }

  // Helper method to format client name
  static getFullName(client: Pick<Client, 'firstName' | 'lastName'>): string {
    return `${client.firstName} ${client.lastName}`.trim();
  }

  // Helper method to get client initials
  static getInitials(client: Pick<Client, 'firstName' | 'lastName'>): string {
    const firstInitial = client.firstName?.charAt(0) || '';
    const lastInitial = client.lastName?.charAt(0) || '';
    return `${firstInitial}${lastInitial}`.toUpperCase();
  }

  // Helper method to format currency
  static formatCurrency(amount: string | number, currency = 'USD'): string {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(numAmount);
  }

  // Helper method to format phone numbers
  static formatPhone(phone: string | null): string | null {
    if (!phone) return null;
    
    // Remove all non-digit characters
    const digits = phone.replace(/\D/g, '');
    
    // Format as (XXX) XXX-XXXX if it's a 10-digit US number
    if (digits.length === 10) {
      return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
    }
    
    // Return original if not a standard format
    return phone;
  }

  // Helper method to format dates
  static formatDate(date: string | Date | null): string | null {
    if (!date) return null;
    
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }
}

export const clientService = new ClientService();