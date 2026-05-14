import { getAuthToken } from './auth'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'

export async function serverApiFetch<T>(path: string): Promise<T | null> {
  const token = await getAuthToken()
  if (!token) return null
  const res = await fetch(`${API_URL}${path}`, {
    headers: { Cookie: `token=${token}` },
    cache: 'no-store',
  })
  if (!res.ok) return null
  const data = (await res.json()) as { data: T }
  return data.data
}
