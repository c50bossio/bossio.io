import { relations } from "drizzle-orm/relations";
import { user, account, session, shop, service, staff } from "./schema";

export const accountRelations = relations(account, ({one}) => ({
	user: one(user, {
		fields: [account.userId],
		references: [user.id]
	}),
}));

export const userRelations = relations(user, ({many}) => ({
	accounts: many(account),
	sessions: many(session),
	shops: many(shop),
	staff: many(staff),
}));

export const sessionRelations = relations(session, ({one}) => ({
	user: one(user, {
		fields: [session.userId],
		references: [user.id]
	}),
}));

export const shopRelations = relations(shop, ({one, many}) => ({
	user: one(user, {
		fields: [shop.ownerId],
		references: [user.id]
	}),
	services: many(service),
	staff: many(staff),
}));

export const serviceRelations = relations(service, ({one}) => ({
	shop: one(shop, {
		fields: [service.shopId],
		references: [shop.id]
	}),
}));

export const staffRelations = relations(staff, ({one}) => ({
	shop: one(shop, {
		fields: [staff.shopId],
		references: [shop.id]
	}),
	user: one(user, {
		fields: [staff.userId],
		references: [user.id]
	}),
}));