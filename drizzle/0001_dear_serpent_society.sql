CREATE TABLE IF NOT EXISTS "user_artist_likes" (
	"user_idx" integer NOT NULL,
	"item_idx" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_artist_likes_user_idx_item_idx_pk" PRIMARY KEY("user_idx","item_idx")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_artist_likes" ADD CONSTRAINT "user_artist_likes_user_idx_users_user_idx_fk" FOREIGN KEY ("user_idx") REFERENCES "public"."users"("user_idx") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_artist_likes" ADD CONSTRAINT "user_artist_likes_item_idx_artists_item_idx_fk" FOREIGN KEY ("item_idx") REFERENCES "public"."artists"("item_idx") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
