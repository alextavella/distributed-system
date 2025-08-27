import { and, eq, sql } from 'drizzle-orm'
import { db } from '../db/connection.js'
import { invoiceItems, invoices } from '../db/schema.js'
import {
  HttpError,
  InternalServerError,
  NotFoundError,
} from '../errors/http-errors.js'
import type {
  InvoiceItemRepository,
  InvoiceRepository,
} from '../interfaces/invoice-repository.interface.js'
import type {
  CreateInvoiceData,
  Invoice,
  InvoiceItem,
} from '../types/invoice.js'

export class DrizzleInvoiceRepository
  implements InvoiceRepository, InvoiceItemRepository
{
  async createInvoice(invoiceData: CreateInvoiceData): Promise<Invoice> {
    try {
      const [invoice] = await db
        .insert(invoices)
        .values({
          orderId: invoiceData.orderId,
          invoiceNumber: invoiceData.invoiceNumber,
          status: invoiceData.status,
          amount: invoiceData.amount.toString(),
          currency: invoiceData.currency,
          orderData: invoiceData.orderData
            ? JSON.stringify(invoiceData.orderData)
            : null,
          createdAt: new Date(),
          updatedAt: new Date(),
          generatedAt: null,
        })
        .returning()

      if (!invoice) {
        throw new InternalServerError('Failed to create invoice')
      }

      // Create invoice items if provided
      if (invoiceData.items && invoiceData.items.length > 0) {
        const itemsToInsert = invoiceData.items.map(item => ({
          invoiceId: invoice.id,
          itemName: item.itemName,
          quantity: item.quantity,
          unitPrice: item.unitPrice.toString(),
          totalPrice: item.totalPrice.toString(),
        }))

        await this.createInvoiceItems(itemsToInsert)
      }

      return this.convertDrizzleInvoiceToZodInvoice(invoice)
    } catch (error) {
      if (error instanceof HttpError) {
        throw error
      }
      throw new InternalServerError('Failed to create invoice')
    }
  }

  async getInvoiceById(id: string): Promise<Invoice | null> {
    try {
      const [invoice] = await db
        .select()
        .from(invoices)
        .where(eq(invoices.id, id))

      if (!invoice) {
        return null
      }

      // Get invoice items
      const items = await this.getInvoiceItems(invoice.id)

      return this.convertDrizzleInvoiceToZodInvoice(invoice, items)
    } catch (error) {
      if (error instanceof HttpError) {
        throw error
      }
      throw new InternalServerError('Failed to retrieve invoice')
    }
  }

  async getInvoices(params: {
    page: number
    limit: number
    status?: string
    orderId?: string
  }): Promise<{ invoices: Invoice[]; total: number }> {
    try {
      const { page, limit, status, orderId } = params
      const offset = (page - 1) * limit

      // Build where conditions
      let whereCondition = undefined
      if (status && orderId) {
        whereCondition = and(
          eq(invoices.status, status as 'pending' | 'generated'),
          eq(invoices.orderId, orderId),
        )
      } else if (status) {
        whereCondition = eq(invoices.status, status as 'pending' | 'generated')
      } else if (orderId) {
        whereCondition = eq(invoices.orderId, orderId)
      }

      // Get invoices
      const invoicesResult = await db
        .select()
        .from(invoices)
        .where(whereCondition)
        .limit(limit)
        .offset(offset)

      // Get total count
      const countResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(invoices)
        .where(whereCondition)

      const total = countResult[0]?.count || 0

      // Get items for each invoice
      const invoicesWithItems = await Promise.all(
        invoicesResult.map(async invoice => {
          const items = await this.getInvoiceItems(invoice.id)
          return this.convertDrizzleInvoiceToZodInvoice(invoice, items)
        }),
      )

      return {
        invoices: invoicesWithItems,
        total: Number(total),
      }
    } catch (error) {
      if (error instanceof HttpError) {
        throw error
      }
      throw new InternalServerError('Failed to retrieve invoices')
    }
  }

  async updateInvoiceStatus(id: string, status: string): Promise<Invoice> {
    try {
      const [invoice] = await db
        .update(invoices)
        .set({
          status: status as 'pending' | 'generated',
          updatedAt: new Date(),
        })
        .where(eq(invoices.id, id))
        .returning()

      if (!invoice) {
        throw new NotFoundError('Invoice not found', 'INVOICE_NOT_FOUND')
      }

      // Get invoice items
      const items = await this.getInvoiceItems(invoice.id)

      return this.convertDrizzleInvoiceToZodInvoice(invoice, items)
    } catch (error) {
      if (error instanceof HttpError) {
        throw error
      }
      throw new InternalServerError('Failed to update invoice status')
    }
  }

  async getInvoicesByOrderId(orderId: string): Promise<Invoice[]> {
    try {
      const result = await db
        .select()
        .from(invoices)
        .where(eq(invoices.orderId, orderId))

      // Get items for each invoice
      const invoicesWithItems = await Promise.all(
        result.map(async invoice => {
          const items = await this.getInvoiceItems(invoice.id)
          return this.convertDrizzleInvoiceToZodInvoice(invoice, items)
        }),
      )

      return invoicesWithItems
    } catch (error) {
      if (error instanceof HttpError) {
        throw error
      }
      throw new InternalServerError('Failed to retrieve invoices by order ID')
    }
  }

  async createInvoiceItems(
    items: Array<{
      invoiceId: string
      itemName: string
      quantity: number
      unitPrice: string
      totalPrice: string
    }>,
  ): Promise<InvoiceItem[]> {
    if (items.length === 0) return []

    try {
      const result = await db.insert(invoiceItems).values(items).returning()

      // Convert string values back to numbers for consistency with Zod types
      return result.map(item => ({
        ...item,
        unitPrice: Number(item.unitPrice),
        totalPrice: Number(item.totalPrice),
      }))
    } catch (error) {
      if (error instanceof HttpError) {
        throw error
      }
      throw new InternalServerError('Failed to create invoice items')
    }
  }

  async getInvoiceItems(invoiceId: string): Promise<InvoiceItem[]> {
    try {
      const result = await db
        .select()
        .from(invoiceItems)
        .where(eq(invoiceItems.invoiceId, invoiceId))

      // Convert string values back to numbers for consistency with Zod types
      return result.map(item => ({
        ...item,
        unitPrice: Number(item.unitPrice),
        totalPrice: Number(item.totalPrice),
      }))
    } catch (error) {
      if (error instanceof HttpError) {
        throw error
      }
      throw new InternalServerError('Failed to retrieve invoice items')
    }
  }

  private convertDrizzleInvoiceToZodInvoice(
    drizzleInvoice: any,
    items: InvoiceItem[] = [],
  ): Invoice {
    return {
      id: drizzleInvoice.id,
      orderId: drizzleInvoice.orderId,
      invoiceNumber: drizzleInvoice.invoiceNumber,
      status: drizzleInvoice.status as 'pending' | 'generated',
      amount: parseFloat(drizzleInvoice.amount),
      currency: drizzleInvoice.currency,
      orderData: drizzleInvoice.orderData
        ? JSON.parse(drizzleInvoice.orderData)
        : null,
      createdAt: drizzleInvoice.createdAt.toISOString(),
      updatedAt: drizzleInvoice.updatedAt.toISOString(),
      generatedAt: drizzleInvoice.generatedAt?.toISOString() || null,
      items,
    }
  }
}
