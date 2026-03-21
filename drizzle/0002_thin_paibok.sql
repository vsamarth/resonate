CREATE TABLE IF NOT EXISTS "auth_artist_likes" (
	"user_id" text NOT NULL,
	"item_idx" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "auth_artist_likes_user_id_item_idx_pk" PRIMARY KEY("user_id","item_idx")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "auth_artist_likes" ADD CONSTRAINT "auth_artist_likes_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "auth_artist_likes" ADD CONSTRAINT "auth_artist_likes_item_idx_artists_item_idx_fk" FOREIGN KEY ("item_idx") REFERENCES "public"."artists"("item_idx") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
