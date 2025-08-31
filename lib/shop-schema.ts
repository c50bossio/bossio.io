import { pgTable, text, timestamp, boolean, decimal, integer, jsonb } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { user } from "./better-auth-schema";

// Shops/Barbershops table
export const shop = pgTable("shop", {
  id: text("id").primaryKey().default("gen_random_uuid()"),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  
  // Owner
  ownerId: text("owner_id").notNull().references(() => user.id),
  
  // Contact
  phone: text("phone"),
  email: text("email"),
  website: text("website"),
  
  // Address
  address: text("address"),
  city: text("city"),
  state: text("state"),
  zipCode: text("zip_code"),
  country: text("country").default("US"),
  
  // Settings
  timezone: text("timezone").default("America/New_York"),
  currency: text("currency").default("USD"),
  businessHours: jsonb("business_hours").default({
    monday: { open: "09:00", close: "18:00", closed: false },
    tuesday: { open: "09:00", close: "18:00", closed: false },
    wednesday: { open: "09:00", close: "18:00", closed: false },
    thursday: { open: "09:00", close: "18:00", closed: false },
    friday: { open: "09:00", close: "18:00", closed: false },
    saturday: { open: "09:00", close: "16:00", closed: false },
    sunday: { closed: true }
  }),
  
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Services table
export const service = pgTable("service", {
  id: text("id").primaryKey().default("gen_random_uuid()"),
  shopId: text("shop_id").notNull().references(() => shop.id),
  
  name: text("name").notNull(),
  description: text("description"),
  category: text("category"), // 'haircut', 'shave', 'treatment', etc.
  
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  duration: integer("duration").notNull(), // minutes
  
  isActive: boolean("is_active").default(true),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Staff members table  
export const staff = pgTable("staff", {
  id: text("id").primaryKey().default("gen_random_uuid()"),
  shopId: text("shop_id").notNull().references(() => shop.id),
  userId: text("user_id").notNull().references(() => user.id),
  
  role: text("role").default("barber"), // 'owner', 'manager', 'barber'
  isActive: boolean("is_active").default(true),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Clients table - customer database
export const clients = pgTable("clients", {
  id: text("id").primaryKey().default("gen_random_uuid()"),
  shopId: text("shop_id").notNull().references(() => shop.id),
  
  // Personal information
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email"),
  phone: text("phone"),
  
  // Preferences and notes
  preferredBarberId: text("preferred_barber_id").references(() => user.id),
  notes: text("notes"),
  allergies: text("allergies"),
  
  // Marketing preferences
  emailNotifications: boolean("email_notifications").default(true),
  smsNotifications: boolean("sms_notifications").default(true),
  
  // Status and analytics
  isActive: boolean("is_active").default(true),
  totalVisits: integer("total_visits").default(0),
  totalSpent: decimal("total_spent", { precision: 10, scale: 2 }).default("0"),
  lastVisit: timestamp("last_visit"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Appointments table - supports both client and guest bookings
export const appointments = pgTable("appointments", {
  id: text("id").primaryKey().default("gen_random_uuid()"),
  shopId: text("shop_id").notNull().references(() => shop.id),
  serviceId: text("service_id").notNull().references(() => service.id),
  barberId: text("barber_id").references(() => staff.id), // nullable for "any available"
  clientId: text("client_id").references(() => clients.id), // nullable for guest bookings
  
  // Guest booking fields (when clientId is null)
  guestName: text("guest_name"),
  guestEmail: text("guest_email"),
  guestPhone: text("guest_phone"),
  
  // Scheduling
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  duration: integer("duration").notNull(), // minutes
  
  // Booking details
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  status: text("status").default("scheduled").notNull(), // 'scheduled', 'confirmed', 'completed', 'cancelled', 'no_show'
  paymentStatus: text("payment_status").default("pending").notNull(), // 'pending', 'paid', 'failed', 'refunded'
  paymentMethod: text("payment_method"), // 'cash', 'card', 'online'
  
  notes: text("notes"),
  internalNotes: text("internal_notes"), // staff-only notes
  
  // Reminder tracking
  reminderSent: timestamp("reminder_sent"), // 24-hour reminder timestamp
  confirmationSent: timestamp("confirmation_sent"), // 2-hour reminder timestamp
  
  // Soft delete support
  deletedAt: timestamp("deleted_at"), // null = not deleted, timestamp = soft deleted
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Define relationships
export const shopRelations = relations(shop, ({ one, many }) => ({
  owner: one(user, {
    fields: [shop.ownerId],
    references: [user.id],
  }),
  services: many(service),
  staff: many(staff),
  clients: many(clients),
  appointments: many(appointments),
}));

export const serviceRelations = relations(service, ({ one, many }) => ({
  shop: one(shop, {
    fields: [service.shopId],
    references: [shop.id],
  }),
  appointments: many(appointments),
}));

export const staffRelations = relations(staff, ({ one, many }) => ({
  shop: one(shop, {
    fields: [staff.shopId],
    references: [shop.id],
  }),
  user: one(user, {
    fields: [staff.userId],
    references: [user.id],
  }),
  appointments: many(appointments),
}));

export const clientsRelations = relations(clients, ({ one, many }) => ({
  shop: one(shop, {
    fields: [clients.shopId],
    references: [shop.id],
  }),
  preferredBarber: one(user, {
    fields: [clients.preferredBarberId],
    references: [user.id],
  }),
  appointments: many(appointments),
}));

export const appointmentsRelations = relations(appointments, ({ one }) => ({
  shop: one(shop, {
    fields: [appointments.shopId],
    references: [shop.id],
  }),
  service: one(service, {
    fields: [appointments.serviceId],
    references: [service.id],
  }),
  barber: one(staff, {
    fields: [appointments.barberId],
    references: [staff.id],
  }),
  client: one(clients, {
    fields: [appointments.clientId],
    references: [clients.id],
  }),
}));

// Export types
// Export singular alias for compatibility
export const appointment = appointments;

export type Shop = typeof shop.$inferSelect;
export type NewShop = typeof shop.$inferInsert;
export type Service = typeof service.$inferSelect;
export type NewService = typeof service.$inferInsert;
export type Staff = typeof staff.$inferSelect;
export type NewStaff = typeof staff.$inferInsert;
export type Client = typeof clients.$inferSelect;
export type NewClient = typeof clients.$inferInsert;
export type Appointment = typeof appointments.$inferSelect;
export type NewAppointment = typeof appointments.$inferInsert;