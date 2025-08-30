CREATE TYPE "public"."appointment_status" AS ENUM('scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show');--> statement-breakpoint
CREATE TYPE "public"."payment_method" AS ENUM('cash', 'card', 'digital_wallet', 'online');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('pending', 'paid', 'failed', 'refunded', 'partial');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('owner', 'manager', 'barber', 'receptionist');--> statement-breakpoint
CREATE TABLE "analytics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shop_id" uuid NOT NULL,
	"date" timestamp NOT NULL,
	"total_appointments" integer DEFAULT 0,
	"completed_appointments" integer DEFAULT 0,
	"cancelled_appointments" integer DEFAULT 0,
	"no_show_appointments" integer DEFAULT 0,
	"total_revenue" numeric(10, 2) DEFAULT '0',
	"cash_revenue" numeric(10, 2) DEFAULT '0',
	"card_revenue" numeric(10, 2) DEFAULT '0',
	"new_clients" integer DEFAULT 0,
	"avg_service_time" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "appointments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shop_id" uuid NOT NULL,
	"client_id" uuid NOT NULL,
	"barber_id" uuid NOT NULL,
	"service_id" uuid NOT NULL,
	"start_time" timestamp NOT NULL,
	"end_time" timestamp NOT NULL,
	"status" "appointment_status" DEFAULT 'scheduled' NOT NULL,
	"price" numeric(10, 2) NOT NULL,
	"payment_status" "payment_status" DEFAULT 'pending' NOT NULL,
	"payment_method" "payment_method",
	"stripe_payment_intent_id" varchar(255),
	"notes" text,
	"internal_notes" text,
	"reminder_sent" boolean DEFAULT false,
	"confirmation_sent" boolean DEFAULT false,
	"source_type" varchar(50) DEFAULT 'online',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "clients" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shop_id" uuid NOT NULL,
	"first_name" varchar(100) NOT NULL,
	"last_name" varchar(100) NOT NULL,
	"email" varchar(255),
	"phone" varchar(20),
	"preferred_barber_id" uuid,
	"notes" text,
	"allergies" text,
	"email_notifications" boolean DEFAULT true,
	"sms_notifications" boolean DEFAULT true,
	"is_active" boolean DEFAULT true,
	"total_visits" integer DEFAULT 0,
	"total_spent" numeric(10, 2) DEFAULT '0',
	"last_visit" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "services" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shop_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"category" varchar(100),
	"price" numeric(10, 2) NOT NULL,
	"duration" integer NOT NULL,
	"is_active" boolean DEFAULT true,
	"allow_online_booking" boolean DEFAULT true,
	"requires_deposit" boolean DEFAULT false,
	"deposit_amount" numeric(10, 2),
	"color" varchar(7) DEFAULT '#3B82F6',
	"image" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shops" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"slug" varchar(100) NOT NULL,
	"description" text,
	"phone" varchar(20),
	"email" varchar(255),
	"website" varchar(255),
	"address" text,
	"city" varchar(100),
	"state" varchar(50),
	"zip_code" varchar(10),
	"country" varchar(50) DEFAULT 'US',
	"timezone" varchar(50) DEFAULT 'America/New_York',
	"currency" varchar(3) DEFAULT 'USD',
	"business_hours" jsonb DEFAULT '{"monday":{"open":"09:00","close":"18:00","closed":false},"tuesday":{"open":"09:00","close":"18:00","closed":false},"wednesday":{"open":"09:00","close":"18:00","closed":false},"thursday":{"open":"09:00","close":"18:00","closed":false},"friday":{"open":"09:00","close":"18:00","closed":false},"saturday":{"open":"09:00","close":"16:00","closed":false},"sunday":{"open":"10:00","close":"15:00","closed":false}}'::jsonb,
	"settings" jsonb DEFAULT '{}'::jsonb,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "shops_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"email_verified" timestamp,
	"name" varchar(255) NOT NULL,
	"image" text,
	"role" "user_role" DEFAULT 'barber' NOT NULL,
	"shop_id" uuid,
	"phone" varchar(20),
	"timezone" varchar(50) DEFAULT 'America/New_York',
	"is_active" boolean DEFAULT true,
	"stripe_customer_id" varchar(255),
	"subscription_tier" varchar(50) DEFAULT 'free',
	"onboarding_completed" boolean DEFAULT false,
	"preferences" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "analytics" ADD CONSTRAINT "analytics_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_barber_id_users_id_fk" FOREIGN KEY ("barber_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_service_id_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clients" ADD CONSTRAINT "clients_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clients" ADD CONSTRAINT "clients_preferred_barber_id_users_id_fk" FOREIGN KEY ("preferred_barber_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "services" ADD CONSTRAINT "services_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE no action ON UPDATE no action;