import NextAuth from 'next-auth';
import { authConfig } from './auth.config';
import Credentials from 'next-auth/providers/credentials';
import { z as validateTo } from 'zod';
import type { User } from '@/app/lib/definitions';
import bcrypt from 'bcrypt';
import pg from 'pg';

// Configuración de la conexión a PostgreSQL
const { Pool } = pg;
const pool = new Pool({ // Pool de conexiones para manejar múltiples clientes
  connectionString: process.env.POSTGRES_URL,
  ssl: false
});

async function getUser(email: string): Promise<User | undefined> {
  const client = await pool.connect();
  try {
    const user = await client.query('SELECT * FROM users WHERE email = $1', [email]);
    return user.rows[0]; // Accede al primer registro
  } catch (error) {
    console.error('Failed to fetch user:', error);
    throw new Error('Failed to fetch user.');
  } finally {
    client.release(); // Asegura que la conexión sea liberada
  }
}

export const { auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      async authorize(credentials) {
        const parsedCredentials = validateTo.object({
          email: validateTo.string().email(),
          password: validateTo.string().min(6),
        }).safeParse(credentials);

        if (parsedCredentials.success) {
          const { email, password } = parsedCredentials.data;
          const user = await getUser(email);
          if (!user) {
            console.log('User not found');
            return null;
          }

          // Log para verificar la contraseña almacenada
          console.log('Stored password:', user.password);

          const passwordsMatch = await bcrypt.compare(password, user.password);
          if (passwordsMatch) {
            return user;
          } else {
            console.log('Passwords do not match');
          }
        } else {
          console.log('Invalid credentials');
        }

        return null;
      },
    }),
  ],
});
