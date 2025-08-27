import type { CreateInvoiceData, Invoice, InvoiceItem } from '../types/invoice.js'

export interface InvoiceRepository {
  createInvoice(invoiceData: CreateInvoiceData): Promise<Invoice>
  getInvoiceById(id: string): Promise<Invoice | null>
  getInvoices(params: {
    page: number
    limit: number
    orderId?: string
    status?: string
  }): Promise<{ invoices: Invoice[]; total: number }>
  updateInvoiceStatus(id: string, status: string): Promise<Invoice>
  getInvoicesByOrderId(orderId: string): Promise<Invoice[]>
}

export interface InvoiceItemRepository {
  createInvoiceItems(items: Array<{
    invoiceId: string
    itemName: string
    quantity: number
    unitPrice: string
    totalPrice: string
  }>): Promise<InvoiceItem[]>
  getInvoiceItems(invoiceId: string): Promise<InvoiceItem[]>
}
