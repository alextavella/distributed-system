import { getBrokerClient } from '@streamflix/shared-broker'
import { desc, eq, sql } from 'drizzle-orm'
import { invoiceItems, invoices } from '../db/schema.js'
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
  amount: string
  currency: string
  dueDate: Date
  metadata?: Record<string, any> | undefined
  items?: Array<{
    itemType: string
    itemId: string
    itemName: string
    description?: string
    quantity: number
    unitPrice: string
    totalPrice: string
  }>
}

export class InvoiceService {
  async createInvoice(invoiceData: CreateInvoiceData): Promise<Invoice> {
    const db = await this.getDb()

    // Create invoice
    const [invoice] = await db
      .insert(invoices)
      .values({
        id: crypto.randomUUID(),
        orderId: invoiceData.orderId,
        invoiceNumber: `INV-${Date.now()}`,
        status: 'pending',
        amount: invoiceData.amount,
        currency: invoiceData.currency,
        orderData: invoiceData.metadata
          ? JSON.stringify(invoiceData.metadata)
          : null,
        createdAt: new Date(),
        updatedAt: new Date(),
        generatedAt: null,
      })
      .returning()

    // Create invoice items if provided
    if (invoiceData.items && invoiceData.items.length > 0) {
      const itemsToInsert = invoiceData.items.map(item => ({
        id: crypto.randomUUID(),
        invoiceId: invoice.id,
        itemName: item.itemName,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice,
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
      amount: invoiceData.amount,
      currency: invoiceData.currency,
      status: invoice.status,
    })

    await eventDispatcher.dispatch(event)

    return invoice
  }

  async getInvoiceById(id: string): Promise<Invoice | null> {
    const db = await this.getDb()
    const [invoice] = await db
      .select()
      .from(invoices)
      .where(eq(invoices.id, id))
    return invoice || null
  }

  async getInvoices(query: InvoicesQuery): Promise<InvoicesListResponse> {
    const db = await this.getDb()
    const { page, limit, status, orderId } = query
    const offset = (page - 1) * limit

    // Build where conditions
    const whereConditions = []
    if (status) whereConditions.push(eq(invoices.status, status))
    if (orderId) whereConditions.push(eq(invoices.orderId, orderId))

    // Get total count
    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(invoices)
      .where(whereConditions.length > 0 ? whereConditions : undefined)

    const total = countResult[0]?.count || 0

    // Get invoices with pagination
    const invoicesList = await db
      .select()
      .from(invoices)
      .where(whereConditions.length > 0 ? whereConditions : undefined)
      .orderBy(desc(invoices.createdAt))
      .limit(limit)
      .offset(offset)

    return {
      invoices: invoicesList,
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
    const db = await this.getDb()

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

    return invoice
  }

  private async getDb() {
    // This would typically return a database connection
    // For now, we'll assume it's available
    return {} as any
  }
}
