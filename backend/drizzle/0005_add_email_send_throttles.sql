CREATE TABLE "email_send_throttles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"recipient" text NOT NULL,
	"purpose" text NOT NULL,
	"last_sent_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "email_send_throttles_recipient_purpose_key" UNIQUE("recipient","purpose")
);
