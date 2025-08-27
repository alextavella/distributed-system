import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema.js'

const connectionString =
  process.env.DATABASE_URL ||
  'postgresql://postgres:password@localhost:5432/invoices_db'

// Create the connection
const client = postgres(connectionString, { max: 1 })

// Create the database instance
export const db = drizzle(client, { schema })
