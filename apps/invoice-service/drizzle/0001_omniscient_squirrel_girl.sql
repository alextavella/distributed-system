DROP INDEX "idx_invoices_created_at";--> statement-breakpoint
DROP INDEX "idx_invoices_number";--> statement-breakpoint
ALTER TABLE "invoice_items" DROP COLUMN "item_type";--> statement-breakpoint
ALTER TABLE "invoice_items" DROP COLUMN "item_id";--> statement-breakpoint
ALTER TABLE "invoices" DROP COLUMN "sent_at";