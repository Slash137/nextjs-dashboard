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
  name: validateTo.string({
    invalid_type_error: 'Please enter a name.'
  }), // ID del cliente como string
  email: validateTo.string({
    message: 'Please enter an email.'}
  ), // Conversión automática a número
  imageUrl: validateTo.string({ 
    message: 'Please enter a picture.'}
  ), // Conversión automática a número
});

// Esquema derivado para creación (excluye campos autogenerados)
const CreateCustomer = FormSchema.omit({ 
  id: true,    // No se requiere en creación
  imageUrl: true   // Se genera automáticamente
});

export type State = {
  errors?: {
    name?: string[];
    email?: string[];
    imageUrl?: string[];
  };
  message?: string | null;
};

// Función principal para crear clientes
export async function createCustomer(prevState: State, formData: FormData) {
  const client = await pool.connect(); // Obtiene conexión del pool

  // 1. Validación de datos del formulario con Zod
  const validatedFields = CreateCustomer.safeParse({
    name: formData.get('name'), // Obtiene valor del campo
    email: formData.get('email'),         // FormData es de tipo FormData nativo
  });

  // If form validation fails, return errors early. Otherwise, continue.
  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Missing Fields. Failed to Create Customer.',
    };
  }

  const { name, email, imageUrl } = validatedFields.data;
  
  try {

    // 3. Inserción en base de datos usando parámetros seguros
    await client.query(
      `INSERT INTO customers (name, email, image_url)
      VALUES ($1, $2, $3)`, // Placeholders para prevención de SQL injection
      [customerId, amountInCents, status, date] // Valores en orden correspondiente
    );


  } catch (error) {
    // Manejo centralizado de errores
    console.error('Database Error:', error); // Log detallado en servidor
    throw new Error('Failed to create customer data.'); // Mensaje seguro para cliente
  } finally {
    // 4. Liberación de recursos
    client.release(); // Devuelve la conexión al pool SIEMPRE
  }

  // 5. Actualización de caché de Next.js
  revalidatePath('/dashboard/customers'); // Fuerza re-renderizado de la ruta
  // 6. Redirección después de éxito
  redirect('/dashboard/customers'); // Fuera del try-catch para evitar capturar el error de redirección
}


// Función principal para editar clientes

// Use Zod to update the expected types
const UpdateCustomer = FormSchema.omit({ id: true, imageUrl: true });
 
export async function updateCustomer(id: string, prevState: State, formData: FormData) {
  const client = await pool.connect(); // Obtiene conexión del pool

  // 1. Validación de datos del formulario con Zod
  const validatedFields = CreateCustomer.safeParse({
    name: formData.get('name'), // Obtiene valor del campo
    email: formData.get('email')
  });

  console.log("############################");
  console.log(formData.get('name'));
  console.log("############################");

  // If form validation fails, return errors early. Otherwise, continue.
  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Missing Fields. Failed to Update Customer.',
    };
  }

  const { name, email, imageUrl } = validatedFields.data;

  try {
    
    await client.query(`
      UPDATE customers
      SET name = $1, email = $2
      WHERE id = $3`,
      [name, email, id]
    );
  
  } catch (error) {
    // Manejo centralizado de errores
    console.error('Database Error:', error); // Log detallado en servidor
    throw new Error('Failed to update customer data.'); // Mensaje seguro para cliente
  } finally {
    // 5. Liberación de recursos
    client.release(); // Devuelve la conexión al pool SIEMPRE
  }

  // Actualizacion de cache de Next.js
  revalidatePath('/dashboard/customers');
  redirect('/dashboard/customers/' + id);
}

export async function deleteCustomer(id: string) {
  const client = await pool.connect(); // Obtiene conexión del pool
  try {
    // Elimina entrada de la base de datos
    // await client.query(`DELETE FROM customers WHERE id = $1`, [id]);
    // Actualizacion de cache de Next.js
    revalidatePath('/dashboard/customers');
  } catch (error) {
    // Manejo centralizado de errores
    console.error('Database Error:', error); // Log detallado en servidor
    throw new Error('Failed to create customer data.'); // Mensaje seguro para cliente
  } finally {
    // 5. Liberación de recursos
    client.release(); // Devuelve la conexión al pool SIEMPRE
  }
}