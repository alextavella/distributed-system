import { getBrokerClient } from '@streamflix/shared-broker'
import { db } from '../db/connection.js'
import {
  orderItems,
  orders,
  type NewOrderItem,
  type Order,
} from '../db/schema.js'
import type { CreateOrderRequest } from '../types/order.js'

export class OrderService {
  async createOrder(data: CreateOrderRequest): Promise<Order> {
    return await db.transaction(async tx => {
      // Calculate total amount from items
      const totalAmount = data.items.reduce((sum, item) => {
        const quantity = parseFloat(item.quantity)
        const unitPrice = parseFloat(item.unitPrice)
        return sum + quantity * unitPrice
      }, 0)

      // Create order
      const [order] = await tx
        .insert(orders)
        .values({
          userId: data.userId,
          subscriptionPlan: data.subscriptionPlan,
          amount: totalAmount.toFixed(2),
          currency: data.currency,
          paymentMethod: data.paymentMethod,
          metadata: data.metadata,
        })
        .returning()

      // Create order items
      const orderItemsData: NewOrderItem[] = data.items.map(item => ({
        orderId: order.id,
        itemType: item.itemType,
        itemId: item.itemId,
        itemName: item.itemName,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: (
          parseFloat(item.quantity) * parseFloat(item.unitPrice)
        ).toFixed(2),
      }))

      await tx.insert(orderItems).values(orderItemsData)

      // Publish order created event using the new broker architecture
      try {
        const brokerClient = getBrokerClient()
        await brokerClient.publishOrderCreated({
          orderId: order.id,
          userId: order.userId,
          subscriptionPlan: order.subscriptionPlan,
          amount: order.amount,
          currency: order.currency,
          status: order.status,
        })
      } catch (error) {
        console.error('Failed to publish order created event:', error)
        // Note: We don't throw here to avoid rolling back the transaction
        // In production, you might want to implement retry logic or dead letter queue
      }

      return order
    })
  }
}
