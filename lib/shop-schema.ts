import { pgTable, text, timestamp, boolean, decimal, integer, jsonb } from "drizzle-orm/pg-core";
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