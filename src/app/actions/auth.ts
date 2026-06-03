'use server';

import { redirect } from 'next/navigation';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { createSession, deleteSession } from '@/lib/session';
import { LoginSchema } from '@/lib/validations';

export type LoginState = {
  errors?: { email?: string[]; password?: string[] };
  message?: string;
} | undefined;

export async function login(state: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = LoginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  });

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors as LoginState['errors'] };
  }

  const { email, password } = parsed.data;

  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);

  if (!user) {
    return { message: 'Invalid email or password.' };
  }

  const passwordMatch = await bcrypt.compare(password, user.passwordHash);
  if (!passwordMatch) {
    return { message: 'Invalid email or password.' };
  }

  await createSession({
    userId: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  });

  redirect(user.role === 'admin' ? '/admin/dashboard' : '/seller/dashboard');
}

export async function logout(): Promise<void> {
  await deleteSession();
  redirect('/login');
}
