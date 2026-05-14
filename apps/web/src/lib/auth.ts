import { cookies } from 'next/headers'

export async function getAuthToken(): Promise<string | undefined> {
  const cookieStore = await cookies()
  return cookieStore.get('token')?.value
}

export async function isAuthenticated(): Promise<boolean> {
  return !!(await getAuthToken())
}
