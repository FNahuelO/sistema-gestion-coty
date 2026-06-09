import {
  Coffee,
  Wine,
  Sandwich,
  Soup,
  Beef,
  UtensilsCrossed,
} from 'lucide-react'
import type { MenuCategoryId } from '@/lib/menu-categories'

export const MENU_SECTION_ICONS = {
  coffee: Coffee,
  cold: Wine,
  sandwiches: Sandwich,
  starters: Soup,
  burgers: Beef,
  milanesas: UtensilsCrossed,
} as const satisfies Record<Exclude<MenuCategoryId, 'all'>, typeof Coffee>
