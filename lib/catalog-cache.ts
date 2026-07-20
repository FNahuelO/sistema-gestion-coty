import { revalidateTag } from 'next/cache'

export const PUBLIC_CATALOG_TAG = 'public-catalog'

/** Invalida el cache de `/api/catalog` tras cambios de menú, horarios o settings. */
export function revalidatePublicCatalog() {
  revalidateTag(PUBLIC_CATALOG_TAG, 'max')
}
