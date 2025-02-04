'use server';

// Importaciones básicas
import pg from 'pg'; // Cliente PostgreSQL para Node.js
import {
  CustomerField,
  CustomersTableType,
  InvoiceForm,
  InvoicesTable,
  LatestInvoice,
  Revenue,
} from './definitions'; // Tipos de datos personalizados
import { formatCurrency } from './utils'; // Utilidad para formatear moneda

// Configuración de la conexión a PostgreSQL
const { Pool } = pg;
const pool = new Pool(); // Pool de conexiones para manejar múltiples clientes

// ================================================
// Funciones para obtener datos de la base de datos
// ================================================

/**
 * Obtiene todos los registros de ingresos (revenue)
 * @returns Promise<Revenue[]> - Lista de ingresos
 */
export async function fetchRevenue(): Promise<Revenue[]> {
  const client = await pool.connect();
  try {
    // Consulta simple sin filtros
    const data = await client.query(`SELECT * FROM revenue`);
    return data.rows;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch revenue data.');
  } finally {
    client.release(); // Siempre liberar la conexión
  }
}

/**
 * Obtiene las últimas 5 facturas con datos de clientes
 * @returns Promise<LatestInvoice[]> - Últimas facturas formateadas
 */
export async function fetchLatestInvoices(): Promise<LatestInvoice[]> {
  const client = await pool.connect();
  try {
    const data = await client.query(`
      SELECT invoices.amount, invoices.status, customers.name, customers.image_url, customers.email, invoices.id
      FROM invoices
      JOIN customers ON invoices.customer_id = customers.id
      ORDER BY invoices.date DESC
      LIMIT 5`);

    // Formatear el monto de las facturas
    return data.rows.map((invoice) => ({
      ...invoice,
      amount: formatCurrency(invoice.amount),
    }));
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch the latest invoices.');
  } finally {
    client.release();
  }
}

/**
 * Obtiene métricas para tarjetas resumen
 * @returns Objeto con totales de clientes, facturas y montos
 */
export async function fetchCardData() {
  const client = await pool.connect();
  try {
    // Consultas paralelas para obtener métricas
    const [invoiceCount, customerCount, invoiceStatus] = await Promise.all([
      client.query(`SELECT COUNT(*) FROM invoices`),
      client.query(`SELECT COUNT(*) FROM customers`),
      client.query(`SELECT
        SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END) AS "paid",
        SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END) AS "pending"
        FROM invoices`),
    ]);

    // Procesar resultados
    return {
      numberOfInvoices: Number(invoiceCount.rows[0].count),
      numberOfCustomers: Number(customerCount.rows[0].count),
      totalPaidInvoices: formatCurrency(invoiceStatus.rows[0].paid),
      totalPendingInvoices: formatCurrency(invoiceStatus.rows[0].pending),
    };
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch card data.');
  } finally {
    client.release();
  }
}

// ================================================
// Funciones para paginación y filtrado
// ================================================

const ITEMS_PER_PAGE = 6; // Número de elementos por página

/**
 * Obtiene facturas filtradas y paginadas
 * @param query - Término de búsqueda
 * @param currentPage - Página actual
 * @returns Promise<InvoicesTable[]> - Facturas filtradas
 */
export async function fetchFilteredInvoices(
  query: string,
  currentPage: number,
): Promise<InvoicesTable[]> {
  const client = await pool.connect();
  const offset = (currentPage - 1) * ITEMS_PER_PAGE;

  try {
    // Búsqueda con filtros múltiples (⚠️ riesgo de SQL injection)
    const result = await client.query(`
      SELECT
        invoices.id,
        invoices.amount,
        invoices.date,
        invoices.status,
        customers.name,
        customers.email,
        customers.image_url
      FROM invoices
      JOIN customers ON invoices.customer_id = customers.id
      WHERE
        customers.name ILIKE '%${query}%' OR
        customers.email ILIKE '%${query}%' OR
        invoices.amount::text ILIKE '%${query}%' OR
        invoices.date::text ILIKE '%${query}%' OR
        invoices.status ILIKE '%${query}%'
      ORDER BY invoices.date DESC
      LIMIT ${ITEMS_PER_PAGE} OFFSET ${offset}
    `);
    return result.rows;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch invoices.');
  } finally {
    client.release();
  }
}

/**
 * Calcula el número total de páginas para la paginación
 * @param query - Término de búsqueda
 * @returns Número total de páginas
 */
export async function fetchInvoicesPages(query: string) {
  const client = await pool.connect();
  try {
    // Conteo total de registros filtrados
    const count = await client.query(`
      SELECT COUNT(*)
      FROM invoices
      JOIN customers ON invoices.customer_id = customers.id
      WHERE
        customers.name ILIKE '%${query}%' OR
        customers.email ILIKE '%${query}%' OR
        invoices.amount::text ILIKE '%${query}%' OR
        invoices.date::text ILIKE '%${query}%' OR
        invoices.status ILIKE '%${query}%'
    `);
    return Math.ceil(Number(count.rows[0].count) / ITEMS_PER_PAGE);
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch total number of invoices.');
  } finally {
    client.release();
  }
}

// ================================================
// Funciones para operaciones específicas
// ================================================

/**
 * Obtiene una factura por ID y formatea su monto
 * @param id - ID de la factura
 * @returns Promise<InvoiceForm> - Datos de la factura
 */
export async function fetchInvoiceById(id: string): Promise<InvoiceForm> {
  const client = await pool.connect();
  try {
    // Consulta simple por ID (⚠️ riesgo de SQL injection)
    const data = await client.query(`
      SELECT
        invoices.id,
        invoices.customer_id,
        invoices.amount,
        invoices.status
      FROM invoices
      WHERE invoices.id = $1`,
      [id]
    );
    
    // Convertir monto de centavos a dólares
    return data.rows.map(invoice => ({
      ...invoice,
      amount: invoice.amount / 100
    }))[0];
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch invoice.');
  } finally {
    client.release();
  }
}

/**
 * Obtiene todos los clientes ordenados por nombre
 * @returns Promise<CustomerField[]> - Lista de clientes
 */
export async function fetchCustomers(): Promise<CustomerField[]> {
  const client = await pool.connect();
  try {
    const data = await client.query(`
      SELECT id, name
      FROM customers
      ORDER BY name ASC
    `);
    return data.rows;
  } catch (err) {
    console.error('Database Error:', err);
    throw new Error('Failed to fetch all customers.');
  } finally {
    client.release();
  }
}

/**
 * Obtiene clientes filtrados con métricas financieras
 * @param query - Término de búsqueda
 * @returns Promise<CustomersTableType[]> - Clientes con datos financieros
 */
export async function fetchFilteredCustomers(query: string): Promise<CustomersTableType[]> {
  const client = await pool.connect();
  try {
    // Consulta compleja con agregaciones
    const data = await client.query(`
      SELECT
        customers.id,
        customers.name,
        customers.email,
        customers.image_url,
        COUNT(invoices.id) AS total_invoices,
        SUM(CASE WHEN invoices.status = 'pending' THEN invoices.amount ELSE 0 END) AS total_pending,
        SUM(CASE WHEN invoices.status = 'paid' THEN invoices.amount ELSE 0 END) AS total_paid
      FROM customers
      LEFT JOIN invoices ON customers.id = invoices.customer_id
      WHERE
        customers.name ILIKE '%${query}%' OR
        customers.email ILIKE '%${query}%'
      GROUP BY customers.id, customers.name, customers.email, customers.image_url
      ORDER BY customers.name ASC
    `);

    // Formatear montos monetarios
    return data.rows.map(customer => ({
      ...customer,
      total_pending: formatCurrency(customer.total_pending),
      total_paid: formatCurrency(customer.total_paid),
    }));
  } catch (err) {
    console.error('Database Error:', err);
    throw new Error('Failed to fetch customer table.');
  } finally {
    client.release();
  }
}