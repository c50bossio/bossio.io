import { pgTable, text, timestamp, uuid, integer, decimal, boolean, jsonb, varchar, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums for type safety
export const userRoleEnum = pgEnum('user_role', ['owner', 'manager', 'barber', 'receptionist']);
export const appointmentStatusEnum = pgEnum('appointment_status', ['scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show']);
export const paymentStatusEnum = pgEnum('payment_status', ['pending', 'paid', 'failed', 'refunded', 'partial']);
export const paymentMethodEnum = pgEnum('payment_method', ['cash', 'card', 'digital_wallet', 'online']);

// Users table - handles authentication and roles
export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  emailVerified: timestamp('email_verified'),
  name: varchar('name', { length: 255 }),
  image: text('image'),
  role: userRoleEnum('role').default('barber').notNull(),
  
  // Barbershop-specific fields
  shopId: uuid('shop_id').references(() => shops.id),
  phone: varchar('phone', { length: 20 }),
  timezone: varchar('timezone', { length: 50 }).default('America/New_York'),
  isActive: boolean('is_active').default(true),
  
  // Subscription and billing
  stripeCustomerId: varchar('stripe_customer_id', { length: 255 }),
  subscriptionTier: varchar('subscription_tier', { length: 50 }).default('free'),
  
  // Metadata
  onboardingCompleted: boolean('onboarding_completed').default(false),
  preferences: jsonb('preferences').default({}),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

// Better Auth required tables
export const session = pgTable('session', {
  id: text('id').primaryKey(),
  expiresAt: timestamp('expires_at').notNull(),
  token: text('token').notNull().unique(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  userId: uuid('user_id').notNull().references(() => users.id)
});

export const account = pgTable('account', {
  id: text('id').primaryKey(),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  userId: uuid('user_id').notNull().references(() => users.id),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  idToken: text('id_token'),
  accessTokenExpiresAt: timestamp('access_token_expires_at'),
  refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
  scope: text('scope'),
  password: text('password'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

export const verification = pgTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

// Shops/Barbershops table - multi-tenant support
export const shops = pgTable('shops', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 100 }).notNull().unique(),
  description: text('description'),
  
  // Contact information
  phone: varchar('phone', { length: 20 }),
  email: varchar('email', { length: 255 }),
  website: varchar('website', { length: 255 }),
  
  // Address
  address: text('address'),
  city: varchar('city', { length: 100 }),
  state: varchar('state', { length: 50 }),
  zipCode: varchar('zip_code', { length: 10 }),
  country: varchar('country', { length: 50 }).default('US'),
  
  // Business settings
  timezone: varchar('timezone', { length: 50 }).default('America/New_York'),
  currency: varchar('currency', { length: 3 }).default('USD'),
  
  // Business hours (JSON format for flexibility)
  businessHours: jsonb('business_hours').default({
    monday: { open: '09:00', close: '18:00', closed: false },
    tuesday: { open: '09:00', close: '18:00', closed: false },
    wednesday: { open: '09:00', close: '18:00', closed: false },
    thursday: { open: '09:00', close: '18:00', closed: false },
    friday: { open: '09:00', close: '18:00', closed: false },
    saturday: { open: '09:00', close: '16:00', closed: false },
    sunday: { open: '10:00', close: '15:00', closed: false }
  }),
  
  // Features and settings
  settings: jsonb('settings').default({}),
  isActive: boolean('is_active').default(true),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

// Services table - haircuts, shaves, treatments, etc.
export const services = pgTable('services', {
  id: uuid('id').defaultRandom().primaryKey(),
  shopId: uuid('shop_id').references(() => shops.id).notNull(),
  
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  category: varchar('category', { length: 100 }), // 'haircut', 'shave', 'treatment', etc.
  
  // Pricing
  price: decimal('price', { precision: 10, scale: 2 }).notNull(),
  duration: integer('duration').notNull(), // minutes
  
  // Settings
  isActive: boolean('is_active').default(true),
  allowOnlineBooking: boolean('allow_online_booking').default(true),
  requiresDeposit: boolean('requires_deposit').default(false),
  depositAmount: decimal('deposit_amount', { precision: 10, scale: 2 }),
  
  // Metadata
  color: varchar('color', { length: 7 }).default('#3B82F6'), // hex color for calendar
  image: text('image'),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

// Clients table - customer information
export const clients = pgTable('clients', {
  id: uuid('id').defaultRandom().primaryKey(),
  shopId: uuid('shop_id').references(() => shops.id).notNull(),
  
  // Personal information
  firstName: varchar('first_name', { length: 100 }).notNull(),
  lastName: varchar('last_name', { length: 100 }).notNull(),
  email: varchar('email', { length: 255 }),
  phone: varchar('phone', { length: 20 }),
  
  // Preferences and notes
  preferredBarberId: uuid('preferred_barber_id').references(() => users.id),
  notes: text('notes'),
  allergies: text('allergies'),
  
  // Marketing preferences
  emailNotifications: boolean('email_notifications').default(true),
  smsNotifications: boolean('sms_notifications').default(true),
  
  // Status
  isActive: boolean('is_active').default(true),
  totalVisits: integer('total_visits').default(0),
  totalSpent: decimal('total_spent', { precision: 10, scale: 2 }).default('0'),
  lastVisit: timestamp('last_visit'),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

// Appointments table - the core booking system
export const appointments = pgTable('appointments', {
  id: uuid('id').defaultRandom().primaryKey(),
  shopId: uuid('shop_id').references(() => shops.id).notNull(),
  
  // Core appointment details
  clientId: uuid('client_id').references(() => clients.id).notNull(),
  barberId: uuid('barber_id').references(() => users.id).notNull(),
  serviceId: uuid('service_id').references(() => services.id).notNull(),
  
  // Scheduling
  startTime: timestamp('start_time').notNull(),
  endTime: timestamp('end_time').notNull(),
  status: appointmentStatusEnum('status').default('scheduled').notNull(),
  
  // Pricing (can override service price)
  price: decimal('price', { precision: 10, scale: 2 }).notNull(),
  
  // Payment information
  paymentStatus: paymentStatusEnum('payment_status').default('pending').notNull(),
  paymentMethod: paymentMethodEnum('payment_method'),
  stripePaymentIntentId: varchar('stripe_payment_intent_id', { length: 255 }),
  
  // Additional information
  notes: text('notes'),
  internalNotes: text('internal_notes'), // staff-only notes
  
  // Notifications
  reminderSent: boolean('reminder_sent').default(false),
  confirmationSent: boolean('confirmation_sent').default(false),
  
  // Metadata
  sourceType: varchar('source_type', { length: 50 }).default('online'), // 'online', 'phone', 'walk_in'
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  
  // Soft delete support
  deletedAt: timestamp('deleted_at')
});

// Analytics and tracking
export const analytics = pgTable('analytics', {
  id: uuid('id').defaultRandom().primaryKey(),
  shopId: uuid('shop_id').references(() => shops.id).notNull(),
  
  // Date tracking
  date: timestamp('date').notNull(),
  
  // Metrics
  totalAppointments: integer('total_appointments').default(0),
  completedAppointments: integer('completed_appointments').default(0),
  cancelledAppointments: integer('cancelled_appointments').default(0),
  noShowAppointments: integer('no_show_appointments').default(0),
  
  // Revenue
  totalRevenue: decimal('total_revenue', { precision: 10, scale: 2 }).default('0'),
  cashRevenue: decimal('cash_revenue', { precision: 10, scale: 2 }).default('0'),
  cardRevenue: decimal('card_revenue', { precision: 10, scale: 2 }).default('0'),
  
  // Additional metrics
  newClients: integer('new_clients').default(0),
  avgServiceTime: integer('avg_service_time').default(0), // minutes
  
  createdAt: timestamp('created_at').defaultNow().notNull()
});

// Define relationships
export const usersRelations = relations(users, ({ one, many }) => ({
  shop: one(shops, {
    fields: [users.shopId],
    references: [shops.id]
  }),
  appointments: many(appointments),
  preferredByClients: many(clients)
}));

export const shopsRelations = relations(shops, ({ many }) => ({
  users: many(users),
  services: many(services),
  clients: many(clients),
  appointments: many(appointments),
  analytics: many(analytics)
}));

export const servicesRelations = relations(services, ({ one, many }) => ({
  shop: one(shops, {
    fields: [services.shopId],
    references: [shops.id]
  }),
  appointments: many(appointments)
}));

export const clientsRelations = relations(clients, ({ one, many }) => ({
  shop: one(shops, {
    fields: [clients.shopId],
    references: [shops.id]
  }),
  preferredBarber: one(users, {
    fields: [clients.preferredBarberId],
    references: [users.id]
  }),
  appointments: many(appointments)
}));

export const appointmentsRelations = relations(appointments, ({ one }) => ({
  shop: one(shops, {
    fields: [appointments.shopId],
    references: [shops.id]
  }),
  client: one(clients, {
    fields: [appointments.clientId],
    references: [clients.id]
  }),
  barber: one(users, {
    fields: [appointments.barberId],
    references: [users.id]
  }),
  service: one(services, {
    fields: [appointments.serviceId],
    references: [services.id]
  })
}));

export const analyticsRelations = relations(analytics, ({ one }) => ({
  shop: one(shops, {
    fields: [analytics.shopId],
    references: [shops.id]
  })
}));

// Export types for TypeScript
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Shop = typeof shops.$inferSelect;
export type NewShop = typeof shops.$inferInsert;
export type Service = typeof services.$inferSelect;
export type NewService = typeof services.$inferInsert;
export type Client = typeof clients.$inferSelect;
export type NewClient = typeof clients.$inferInsert;
export type Appointment = typeof appointments.$inferSelect;
export type NewAppointment = typeof appointments.$inferInsert;
export type Analytics = typeof analytics.$inferSelect;
export type NewAnalytics = typeof analytics.$inferInsert;