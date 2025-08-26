import { relations } from 'drizzle-orm'
import {
  decimal,
  index,
  integer,
  jsonb,
  pgTable,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core'

// Simplified invoice status
export const invoiceStatuses = ['pending', 'generated'] as const
export type InvoiceStatus = (typeof invoiceStatuses)[number]

// Main invoices table (simplified)
export const invoices = pgTable(
  'invoices',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orderId: uuid('order_id').notNull().unique(),
    invoiceNumber: varchar('invoice_number', { length: 50 }).notNull().unique(),
    status: varchar('status', { length: 20 }).notNull().default('pending'),
    amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
    currency: varchar('currency', { length: 3 }).notNull(),
    orderData: jsonb('order_data'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
    generatedAt: timestamp('generated_at'),
  },
  table => ({
    orderIdIdx: index('idx_invoices_order_id').on(table.orderId),
    statusIdx: index('idx_invoices_status').on(table.status),
  }),
)

// Simplified invoice items (optional, for future use)
export const invoiceItems = pgTable(
  'invoice_items',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    invoiceId: uuid('invoice_id')
      .notNull()
      .references(() => invoices.id, { onDelete: 'cascade' }),
    itemName: varchar('item_name', { length: 200 }).notNull(),
    quantity: integer('quantity').notNull().default(1),
    unitPrice: decimal('unit_price', { precision: 10, scale: 2 }).notNull(),
    totalPrice: decimal('total_price', { precision: 10, scale: 2 }).notNull(),
  },
  table => ({
    invoiceIdIdx: index('idx_invoice_items_invoice_id').on(table.invoiceId),
  }),
)

// Relations
export const invoicesRelations = relations(invoices, ({ many }) => ({
  items: many(invoiceItems),
}))

export const invoiceItemsRelations = relations(invoiceItems, ({ one }) => ({
  invoice: one(invoices, {
    fields: [invoiceItems.invoiceId],
    references: [invoices.id],
  }),
}))

// Types
export type Invoice = typeof invoices.$inferSelect
export type NewInvoice = typeof invoices.$inferInsert
export type InvoiceItem = typeof invoiceItems.$inferSelect
export type NewInvoiceItem = typeof invoiceItems.$inferInsert

// Invoice with items type
export type InvoiceWithItems = Invoice & {
  items: InvoiceItem[]
}