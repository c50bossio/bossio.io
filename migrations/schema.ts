import { pgTable, unique, text, boolean, timestamp, foreignKey, jsonb, numeric, integer, pgEnum } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export const appointmentStatus = pgEnum("appointment_status", ['scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show'])
export const paymentMethod = pgEnum("payment_method", ['cash', 'card', 'digital_wallet', 'online'])
export const paymentStatus = pgEnum("payment_status", ['pending', 'paid', 'failed', 'refunded', 'partial'])
export const userRole = pgEnum("user_role", ['owner', 'manager', 'barber', 'receptionist'])


export const user = pgTable("user", {
	id: text().default((gen_random_uuid())).primaryKey().notNull(),
	name: text(),
	email: text().notNull(),
	emailVerified: boolean("email_verified").default(false).notNull(),
	image: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	unique("user_email_key").on(table.email),
]);

export const account = pgTable("account", {
	id: text().default((gen_random_uuid())).primaryKey().notNull(),
	accountId: text("account_id").notNull(),
	providerId: text("provider_id").notNull(),
	userId: text("user_id").notNull(),
	accessToken: text("access_token"),
	refreshToken: text("refresh_token"),
	idToken: text("id_token"),
	accessTokenExpiresAt: timestamp("access_token_expires_at", { mode: 'string' }),
	refreshTokenExpiresAt: timestamp("refresh_token_expires_at", { mode: 'string' }),
	scope: text(),
	password: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "account_user_id_fkey"
		}).onDelete("cascade"),
]);

export const session = pgTable("session", {
	id: text().default((gen_random_uuid())).primaryKey().notNull(),
	expiresAt: timestamp("expires_at", { mode: 'string' }).notNull(),
	token: text().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	ipAddress: text("ip_address"),
	userAgent: text("user_agent"),
	userId: text("user_id").notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "session_user_id_fkey"
		}).onDelete("cascade"),
	unique("session_token_key").on(table.token),
]);

export const verification = pgTable("verification", {
	id: text().default((gen_random_uuid())).primaryKey().notNull(),
	identifier: text().notNull(),
	value: text().notNull(),
	expiresAt: timestamp("expires_at", { mode: 'string' }).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
});

export const shop = pgTable("shop", {
	id: text().default((gen_random_uuid())).primaryKey().notNull(),
	name: text().notNull(),
	slug: text().notNull(),
	description: text(),
	ownerId: text("owner_id").notNull(),
	phone: text(),
	email: text(),
	website: text(),
	address: text(),
	city: text(),
	state: text(),
	zipCode: text("zip_code"),
	country: text().default('US'),
	timezone: text().default('America/New_York'),
	currency: text().default('USD'),
	businessHours: jsonb("business_hours").default({"friday":{"open":"09:00","close":"18:00","closed":false},"monday":{"open":"09:00","close":"18:00","closed":false},"sunday":{"closed":true},"tuesday":{"open":"09:00","close":"18:00","closed":false},"saturday":{"open":"09:00","close":"16:00","closed":false},"thursday":{"open":"09:00","close":"18:00","closed":false},"wednesday":{"open":"09:00","close":"18:00","closed":false}}),
	isActive: boolean("is_active").default(true),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.ownerId],
			foreignColumns: [user.id],
			name: "shop_owner_id_fkey"
		}),
	unique("shop_slug_key").on(table.slug),
]);

export const service = pgTable("service", {
	id: text().default((gen_random_uuid())).primaryKey().notNull(),
	shopId: text("shop_id").notNull(),
	name: text().notNull(),
	description: text(),
	category: text(),
	price: numeric({ precision: 10, scale:  2 }).notNull(),
	duration: integer().notNull(),
	isActive: boolean("is_active").default(true),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.shopId],
			foreignColumns: [shop.id],
			name: "service_shop_id_fkey"
		}).onDelete("cascade"),
]);

export const staff = pgTable("staff", {
	id: text().default((gen_random_uuid())).primaryKey().notNull(),
	shopId: text("shop_id").notNull(),
	userId: text("user_id").notNull(),
	role: text().default('barber'),
	isActive: boolean("is_active").default(true),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.shopId],
			foreignColumns: [shop.id],
			name: "staff_shop_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "staff_user_id_fkey"
		}).onDelete("cascade"),
	unique("staff_shop_id_user_id_key").on(table.shopId, table.userId),
]);
