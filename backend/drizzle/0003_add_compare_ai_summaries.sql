CREATE TABLE "compare_ai_summaries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"hotel_ids_hash" text NOT NULL,
	"content_hash" text NOT NULL,
	"summary" text NOT NULL,
	"model_version" text NOT NULL,
	"generated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "compare_ai_summaries_hotel_ids_hash_unique" UNIQUE("hotel_ids_hash")
);
