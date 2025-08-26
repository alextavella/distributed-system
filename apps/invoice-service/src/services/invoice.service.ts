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
   * Get all invoices (simple list)
   */
  async getInvoices(): Promise<InvoiceWithItems[]> {
    return await db.query.invoices.findMany({
      with: { items: true },
      orderBy: (invoices, { desc }) => [desc(invoices.createdAt)],
    })
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
