CREATE TABLE IF NOT EXISTS "artists" (
	"item_idx" integer PRIMARY KEY NOT NULL,
	"mbid" text NOT NULL,
	"name" text NOT NULL,
	"embedding" vector(64) NOT NULL,
	"total_plays" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "artists_mbid_unique" UNIQUE("mbid")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "train_edges" (
	"user_idx" integer NOT NULL,
	"item_idx" integer NOT NULL,
	"plays" integer DEFAULT 1 NOT NULL,
	CONSTRAINT "train_edges_user_idx_item_idx_pk" PRIMARY KEY("user_idx","item_idx")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
	"user_idx" integer PRIMARY KEY NOT NULL,
	"sha1" text NOT NULL,
	"embedding" vector(64) NOT NULL,
	"display_name" text,
	"email" text,
	"avatar_url" text,
	"country" text,
	"created_at" timestamp with time zone,
	CONSTRAINT "users_sha1_unique" UNIQUE("sha1"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp with time zone,
	"refresh_token_expires_at" timestamp with time zone,
	"scope" text,
	"password" text,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	"resonate_user_idx" integer,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
