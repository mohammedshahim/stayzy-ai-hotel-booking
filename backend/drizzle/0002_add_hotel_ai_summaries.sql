CREATE TABLE "hotel_ai_summaries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"hotel_id" uuid NOT NULL,
	"content_hash" text NOT NULL,
	"summary" text NOT NULL,
	"model_version" text NOT NULL,
	"generated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "hotel_ai_summaries_hotel_id_unique" UNIQUE("hotel_id")
);
--> statement-breakpoint
ALTER TABLE "hotel_ai_summaries" ADD CONSTRAINT "hotel_ai_summaries_hotel_id_hotels_id_fk" FOREIGN KEY ("hotel_id") REFERENCES "public"."hotels"("id") ON DELETE cascade ON UPDATE no action;