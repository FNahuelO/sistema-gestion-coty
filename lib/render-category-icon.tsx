import type { LucideIcon } from 'lucide-react'
import { createElement, type CSSProperties } from 'react'
import { getCategoryIcon } from '@/lib/category-icon-registry'

export function renderCategoryIcon(
  iconName: string,
  props: { className?: string; style?: CSSProperties; strokeWidth?: number }
) {
  const Icon = getCategoryIcon(iconName) as LucideIcon
  return createElement(Icon, props)
}
