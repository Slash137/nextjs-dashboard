'use server'; // Marca este archivo para ejecutarse solo en el servidor (Next.js)

// Importaciones de librerías
import { z as validateTo } from 'zod'; // Zod para validación de esquemas (renombrado)
import { revalidatePath } from 'next/cache'; // Para revalidar rutas cacheadas
import { redirect } from 'next/navigation'; // Para redirecciones
import pg from 'pg'; // Cliente PostgreSQL
import { signIn } from '@/auth';
import { AuthError } from 'next-auth';

export async function authenticate(
  prevState: string | undefined,
  formData: FormData,
) {
  try {
    await signIn('credentials', formData);
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case 'CredentialsSignin':
          return 'Invalid credentials.';
        default:
          return 'Something went wrong.';
      }
    }
    throw error;
  }
}

// Configuración inicial de PostgreSQL
const { Pool } = pg;
const pool = new Pool(); // Crea un pool de conexiones a la DB

// Esquema de validación principal con Zod
const FormSchema = validateTo.object({
  id: validateTo.string(), // ID autogenerado
  customerId: validateTo.string({
    invalid_type_error: 'Please select a customer.'
  }), // ID del cliente como string
  amount: validateTo.coerce.number().gt(
    0, { message: 'Please enter an amount greater than $0.'}
  ), // Conversión automática a número
  status: validateTo.enum(['pending', 'paid'], {
    invalid_type_error: 'Please select an invoice status.'
  }), // Solo permite estos valores
  date: validateTo.string(), // Fecha como string ISO
});

// Esquema derivado para creación (excluye campos autogenerados)
const CreateInvoice = FormSchema.omit({ 
  id: true,    // No se requiere en creación
  date: true   // Se genera automáticamente
});

export type State = {
  errors?: {
    customerId?: string[];
    amount?: string[];
    status?: string[];
  };
  message?: string | null;
};

// Función principal para crear facturas
export async function createInvoice(prevState: State, formData: FormData) {
  const client = await pool.connect(); // Obtiene conexión del pool

  // 1. Validación de datos del formulario con Zod
  const validatedFields = CreateInvoice.safeParse({
    customerId: formData.get('customerId'), // Obtiene valor del campo
    amount: formData.get('amount'),         // FormData es de tipo FormData nativo
    status: formData.get('status'),
  });

  // If form validation fails, return errors early. Otherwise, continue.
  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Missing Fields. Failed to Create Invoice.',
    };
  }

  const { customerId, amount, status } = validatedFields.data;

  // 2. Transformación de datos
  const amountInCents = amount * 100; // Convertir a centavos para evitar decimales
  const date = new Date().toISOString().split('.')[0].replace("T", " "); // Fecha actual en YYYY-MM-DDTHH:mm:ss
  
  try {

    // 3. Inserción en base de datos usando parámetros seguros
    await client.query(
      `INSERT INTO invoices (customer_id, amount, status, date)
      VALUES ($1, $2, $3, $4)`, // Placeholders para prevención de SQL injection
      [customerId, amountInCents, status, date] // Valores en orden correspondiente
    );


  } catch (error) {
    // Manejo centralizado de errores
    console.error('Database Error:', error); // Log detallado en servidor
    throw new Error('Failed to create invoice data.'); // Mensaje seguro para cliente
  } finally {
    // 4. Liberación de recursos
    client.release(); // Devuelve la conexión al pool SIEMPRE
  }

  // 5. Actualización de caché de Next.js
  revalidatePath('/dashboard/invoices'); // Fuerza re-renderizado de la ruta
  // 6. Redirección después de éxito
  redirect('/dashboard/invoices'); // Fuera del try-catch para evitar capturar el error de redirección
}


// Función principal para editar facturas

// Use Zod to update the expected types
const UpdateInvoice = FormSchema.omit({ id: true, date: true });
 
export async function updateInvoice(id: string, prevState: State, formData: FormData) {
  const client = await pool.connect(); // Obtiene conexión del pool

  const validatedFields = UpdateInvoice.safeParse({
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
  });

  // If form validation fails, return errors early. Otherwise, continue.
  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Missing Fields. Failed to Create Invoice.',
    };
  }
  
  const { customerId, amount, status } = validatedFields.data;
  const amountInCents = amount * 100;

  try {

    console.log('Executing query:', `
      UPDATE invoices
      SET customer_id = $1, amount = $2, status = $3
      WHERE id = $4
    `);
    console.log('Query parameters:', [customerId, amountInCents, status, id]);
    
    await client.query(`
      UPDATE invoices
      SET customer_id = $1, amount = $2, status = $3
      WHERE id = $4`,
      [customerId, amountInCents, status, id]
    );
  
  } catch (error) {
    // Manejo centralizado de errores
    console.error('Database Error:', error); // Log detallado en servidor
    throw new Error('Failed to update invoice data.'); // Mensaje seguro para cliente
  } finally {
    // 5. Liberación de recursos
    client.release(); // Devuelve la conexión al pool SIEMPRE
  }

  // Actualizacion de cache de Next.js
  revalidatePath('/dashboard/invoices');
  redirect('/dashboard/invoices');
}

export async function deleteInvoice(id: string) {
  const client = await pool.connect(); // Obtiene conexión del pool
  try {
    // Elimina entrada de la base de datos
    await client.query(`DELETE FROM invoices WHERE id = $1`, [id]);
    // Actualizacion de cache de Next.js
    revalidatePath('/dashboard/invoices');
  } catch (error) {
    // Manejo centralizado de errores
    console.error('Database Error:', error); // Log detallado en servidor
    throw new Error('Failed to create invoice data.'); // Mensaje seguro para cliente
  } finally {
    // 5. Liberación de recursos
    client.release(); // Devuelve la conexión al pool SIEMPRE
  }
}