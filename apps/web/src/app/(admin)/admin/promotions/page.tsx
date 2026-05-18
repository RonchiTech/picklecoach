import type { PublicPromotion } from '@picklecoach/shared'
import { serverApiFetch } from '@/lib/server-api'
import { AdminPromoList } from '@/components/admin/AdminPromoList'

export default async function AdminPromotionsPage() {
  const promos = await serverApiFetch<PublicPromotion[]>('/api/v1/promotions')

  return (
    <div>
      <h1 className="font-outfit text-3xl font-bold text-text-primary">Promotions</h1>
      <p className="mt-1 mb-8 text-sm text-text-secondary">Create and manage promo codes</p>

      <AdminPromoList initialPromos={promos ?? []} />
    </div>
  )
}
