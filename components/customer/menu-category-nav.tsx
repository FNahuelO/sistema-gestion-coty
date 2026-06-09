'use client'

import {
  Coffee,
  Wine,
  Sandwich,
  Soup,
  Beef,
  UtensilsCrossed,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { COTY_QTY_BG, COTY_TEAL } from '@/lib/coty-theme'
import { MENU_CATEGORIES, type MenuCategoryId } from '@/lib/menu-categories'

const CATEGORY_ICONS = {
  coffee: Coffee,
  cold: Wine,
  sandwiches: Sandwich,
  starters: Soup,
  burgers: Beef,
  milanesas: UtensilsCrossed,
} as const

interface MenuCategoryNavProps {
  selected: MenuCategoryId
  onSelect: (categoryId: MenuCategoryId) => void
}

export function MenuCategoryNav({ selected, onSelect }: MenuCategoryNavProps) {
  return (
    <div className="-mx-1 overflow-x-auto scrollbar-hide">
      <div className="flex min-w-max px-1">
        {MENU_CATEGORIES.map((category) => {
          const Icon = CATEGORY_ICONS[category.id]
          const isActive = selected === category.id

          return (
            <button
              key={category.id}
              type="button"
              onClick={() => onSelect(category.id)}
              className="flex w-[72px] shrink-0 flex-col items-center gap-2"
            >
              <div
                className={cn(
                  'flex h-14 w-14 items-center justify-center rounded-2xl shadow-md transition-colors'
                )}
                style={{
                  backgroundColor: isActive ? '#6BACA5' : '#2E514E',
                }}
              >
                <Icon
                  className={cn(
                    'h-6 w-6',
                    isActive ? '#2E514E' : 'text-[#6BACA5]',
                  )}
                  strokeWidth={1.75}
                />
              </div>
              <span className="text-center text-[10px] font-medium leading-tight text-gray-900">
                {category.name}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
