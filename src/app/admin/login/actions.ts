'use server'

import { redirect } from 'next/navigation'
import { createAdminSession, destroyAdminSession } from '@/lib/auth'
import { verifyPassword } from '@/lib/password'
import { prisma } from '@/lib/prisma'

export async function loginAction(formData: FormData) {
  const email = String(formData.get('email') ?? '').trim().toLowerCase()
  const password = String(formData.get('password') ?? '')

  const user = await prisma.adminUser.findUnique({ where: { email } })
  if (!user || !verifyPassword(password, user.passwordHash)) {
    redirect('/admin/login?error=1')
  }

  await createAdminSession(user.id)
  redirect('/admin/catalog')
}

export async function logoutAction() {
  await destroyAdminSession()
  redirect('/admin/login')
}
