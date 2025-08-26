import type { OrderCreatedEvent } from '@streamflix/shared-broker'
import { eq } from 'drizzle-orm'
import { db } from '../db/connection.js'
import { invoices, type InvoiceWithItems } from '../db/schema.js'

export class InvoiceService {
  /**
   * Process order event and create invoice (SIMPLIFIED)
   */
  async processOrderEvent(event: OrderCreatedEvent): Promise<void> {
    const { orderId, amount, currency } = event.data

    console.log(`📝 Processing order: ${orderId}`)

    try {
      // Check if invoice already exists
      const existing = await db.query.invoices.findFirst({
        where: eq(invoices.orderId, orderId),
      })

      if (existing) {
        console.log(`📋 Invoice exists for order: ${orderId}`)
        return
      }

      // Create invoice
      const invoiceNumber = `INV-${Date.now()}-${Math.floor(Math.random() * 1000)}`

      await db.insert(invoices).values({
        orderId,
        invoiceNumber,
        status: 'generated',
        amount,
        currency,
        orderData: event.data,
        generatedAt: new Date(),
      })

      console.log(`✅ Created invoice ${invoiceNumber} for order ${orderId}`)
    } catch (error) {
      console.error(`❌ Error processing order ${orderId}:`, error)
      throw error
    }
  }

  /**
   * Get invoice by ID
   */
  async getInvoiceById(id: string): Promise<InvoiceWithItems | null> {
    const invoice = await db.query.invoices.findFirst({
      where: eq(invoices.id, id),
      with: { items: true },
    })
    return invoice || null
  }

  /**
   * Find invoice by order ID
   */
  async findByOrderId(orderId: string): Promise<InvoiceWithItems | null> {
    const invoice = await db.query.invoices.findFirst({
      where: eq(invoices.orderId, orderId),
      with: { items: true },
    })
    return invoice || null
  }

  /**
   * Get all invoices with pagination and filtering
   */
  async getInvoices(query?: {
    page?: number
    limit?: number
    status?: string | undefined
    orderId?: string | undefined
  }): Promise<{
    invoices: InvoiceWithItems[]
    pagination: {
      page: number
      limit: number
      total: number
    }
  }> {
    const page = query?.page || 1
    const limit = query?.limit || 20
    const offset = (page - 1) * limit

    // Build where conditions
    const conditions: any[] = []
    if (query?.status) {
      conditions.push(eq(invoices.status, query.status as any))
    }
    if (query?.orderId) {
      conditions.push(eq(invoices.orderId, query.orderId))
    }

    // Get total count
    const totalInvoices = await db.query.invoices.findMany({
      where: conditions.length > 0 ? conditions[0] : undefined,
    })

    // Get paginated results
    const paginatedInvoices = await db.query.invoices.findMany({
      where: conditions.length > 0 ? conditions[0] : undefined,
      with: { items: true },
      orderBy: (invoices, { desc }) => [desc(invoices.createdAt)],
      limit,
      offset,
    })

    return {
      invoices: paginatedInvoices,
      pagination: {
        page,
        limit,
        total: totalInvoices.length,
      },
    }
  }

  /**
   * Update invoice status
   */
  async updateStatus(
    id: string,
    status: string,
  ): Promise<InvoiceWithItems | null> {
    try {
      await db
        .update(invoices)
        .set({
          status: status as any,
          updatedAt: new Date(),
        })
        .where(eq(invoices.id, id))

      // Return updated invoice
      return await this.getInvoiceById(id)
    } catch (error) {
      console.error(`Error updating invoice status:`, error)
      throw error
    }
  }

  /**
   * Get invoice statistics
   */
  async getInvoiceStats(): Promise<{
    total: number
    generated: number
  }> {
    const allInvoices = await db.query.invoices.findMany()
    return {
      total: allInvoices.length,
      generated: allInvoices.filter(i => i.status === 'generated').length,
    }
  }
}
