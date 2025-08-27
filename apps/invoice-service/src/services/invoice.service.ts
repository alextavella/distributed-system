import { getBrokerClient } from '@streamflix/shared-broker'
import { desc, eq, sql } from 'drizzle-orm'
import { db } from '../db/connection.js'
import {
  invoiceItems,
  invoices,
  type Invoice as DrizzleInvoice,
} from '../db/schema.js'
import type {
  Invoice,
  InvoicesListResponse,
  InvoicesQuery,
  UpdateStatusData,
} from '../types/invoice.js'

// Interface para dados de criação de invoice
interface CreateInvoiceData {
  orderId: string
  userId: string
  amount: number
  currency: string
  dueDate: Date
  metadata?: Record<string, any> | undefined
  items?: Array<{
    itemType: string
    itemId: string
    itemName: string
    description?: string
    quantity: number
    unitPrice: number
    totalPrice: number
  }>
}

export class InvoiceService {
  async createInvoice(invoiceData: CreateInvoiceData): Promise<Invoice> {
    // Ensure amount is always a string
    const amountString = invoiceData.amount.toString()

    // Create invoice
    const [invoice] = await db
      .insert(invoices)
      .values({
        id: crypto.randomUUID(),
        orderId: invoiceData.orderId,
        invoiceNumber: `INV-${Date.now()}`,
        status: 'pending',
        amount: amountString,
        currency: invoiceData.currency,
        orderData: invoiceData.metadata
          ? JSON.stringify(invoiceData.metadata)
          : null,
        createdAt: new Date(),
        updatedAt: new Date(),
        generatedAt: null,
      })
      .returning()

    if (!invoice) {
      throw new Error('Failed to create invoice')
    }

    // Create invoice items if provided
    if (invoiceData.items && invoiceData.items.length > 0) {
      const itemsToInsert = invoiceData.items.map(item => ({
        id: crypto.randomUUID(),
        invoiceId: invoice.id,
        itemName: item.itemName,
        quantity: item.quantity,
        unitPrice: item.unitPrice.toString(), // Convert to string for decimal field
        totalPrice: item.totalPrice.toString(), // Convert to string for decimal field
      }))

      await db.insert(invoiceItems).values(itemsToInsert)
    }

    // Publish event - using event dispatcher directly
    const broker = getBrokerClient()
    const eventFactory = broker.getEventFactory()
    const eventDispatcher = broker.getEventDispatcher()

    // Create a custom event for invoice generated
    const event = eventFactory.createOrderCreatedEvent({
      orderId: invoice.orderId,
      userId: invoiceData.userId,
      subscriptionPlan: 'invoice',
      amount: amountString,
      currency: invoiceData.currency,
      status: invoice.status,
    })

    await eventDispatcher.dispatch(event)

    // Convert Drizzle Invoice to Zod Invoice type
    return this.convertDrizzleInvoiceToZodInvoice(invoice)
  }

  private convertDrizzleInvoiceToZodInvoice(
    drizzleInvoice: DrizzleInvoice,
  ): Invoice {
    return {
      id: drizzleInvoice.id,
      orderId: drizzleInvoice.orderId,
      invoiceNumber: drizzleInvoice.invoiceNumber,
      status: drizzleInvoice.status as 'pending' | 'generated',
      amount: Number(drizzleInvoice.amount), // Convert decimal to number
      currency: drizzleInvoice.currency,
      orderData: drizzleInvoice.orderData as Record<string, any> | null,
      createdAt: drizzleInvoice.createdAt.toISOString(),
      updatedAt: drizzleInvoice.updatedAt.toISOString(),
      generatedAt: drizzleInvoice.generatedAt?.toISOString() || null,
    }
  }

  async getInvoiceById(id: string): Promise<Invoice | null> {
    const [invoice] = await db
      .select()
      .from(invoices)
      .where(eq(invoices.id, id))

    if (!invoice) return null

    // Convert Drizzle Invoice to Zod Invoice type
    return this.convertDrizzleInvoiceToZodInvoice(invoice)
  }

  async getInvoices(query: InvoicesQuery): Promise<InvoicesListResponse> {
    const { page, limit, status, orderId } = query
    const offset = (page - 1) * limit

    // Build where condition
    let whereCondition = undefined
    if (status && orderId) {
      whereCondition =
        eq(invoices.status, status) && eq(invoices.orderId, orderId)
    } else if (status) {
      whereCondition = eq(invoices.status, status)
    } else if (orderId) {
      whereCondition = eq(invoices.orderId, orderId)
    }

    // Get total count
    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(invoices)
      .where(whereCondition)

    const total = Number(countResult[0]?.count || 0)

    // Get invoices with pagination
    const invoicesList = await db
      .select()
      .from(invoices)
      .where(whereCondition)
      .orderBy(desc(invoices.createdAt))
      .limit(limit)
      .offset(offset)

    // Convert Drizzle Invoices to Zod Invoice types
    const formattedInvoices = invoicesList.map(invoice =>
      this.convertDrizzleInvoiceToZodInvoice(invoice),
    )

    return {
      invoices: formattedInvoices,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    }
  }

  async updateStatus(
    id: string,
    statusData: UpdateStatusData,
  ): Promise<Invoice> {
    const [invoice] = await db
      .update(invoices)
      .set({
        status: statusData.status,
        updatedAt: new Date(),
        ...(statusData.status === 'generated' && { generatedAt: new Date() }),
      })
      .where(eq(invoices.id, id))
      .returning()

    if (!invoice) {
      throw new Error('Invoice not found')
    }

    // Convert Drizzle Invoice to Zod Invoice type
    return this.convertDrizzleInvoiceToZodInvoice(invoice)
  }
}
