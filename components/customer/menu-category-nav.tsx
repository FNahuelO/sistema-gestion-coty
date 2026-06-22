'use client'

import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getCategoryIcon } from '@/lib/category-icons'
import { LoadingSkeleton } from '@/components/shared/loading'
import type { Category } from '@/lib/types'
import type { MenuCategoryId } from '@/lib/menu-categories'

interface MenuCategoryNavProps {
  categories: Category[]
  selected: MenuCategoryId
  onSelect: (categoryId: MenuCategoryId) => void
}

export function MenuCategoryNav({ categories, selected, onSelect }: MenuCategoryNavProps) {
  const activeCategories = [...categories]
    .filter((category) => category.active !== false)
    .sort((left, right) => left.order - right.order)

  const items: Array<{ id: MenuCategoryId; name: string; icon: string }> = [
    ...activeCategories.map((category) => ({
      id: category.id as MenuCategoryId,
      name: category.name,
      icon: category.icon,
    })),
    { id: 'promo', name: 'Promos', icon: 'Star' },
  ]

  return (
    <div className="-mx-1 overflow-x-auto scrollbar-hide md:mx-0 md:overflow-visible">
      <div className="flex min-w-max px-1 md:min-w-0 md:justify-center md:gap-2 lg:gap-3">
        {items.map((category) => {
          const Icon = category.id === 'promo' ? Star : getCategoryIcon(category.icon)
          const isActive = selected === category.id

          return (
            <button
              key={category.id}
              type="button"
              onClick={() => onSelect(category.id)}
              className="flex w-[72px] shrink-0 flex-col items-center gap-2 md:w-20 lg:w-[88px]"
            >
              <div
                className={cn(
                  'flex h-14 w-14 items-center justify-center rounded-2xl shadow-md transition-colors md:h-16 md:w-16'
                )}
                style={{
                  backgroundColor: isActive ? '#6BACA5' : '#2E514E',
                }}
              >
                <Icon
                  className={cn('h-6 w-6', isActive ? 'text-[#2E514E]' : 'text-[#6BACA5]')}
                  strokeWidth={1.75}
                />
              </div>
              <span className="text-center text-[10px] font-medium leading-tight text-gray-900 md:text-xs">
                {category.name}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

export function MenuCategoryNavSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="-mx-1 overflow-hidden md:mx-0" aria-hidden="true">
      <div className="flex min-w-max px-1 md:min-w-0 md:justify-center md:gap-2 lg:gap-3">
        {Array.from({ length: count }).map((_, index) => (
          <div
            key={index}
            className="flex w-[72px] shrink-0 flex-col items-center gap-2 md:w-20 lg:w-[88px]"
          >
            <LoadingSkeleton className="h-14 w-14 rounded-2xl shadow-md md:h-16 md:w-16" />
            <LoadingSkeleton className="h-3 w-14 rounded-md" />
          </div>
        ))}
      </div>
    </div>
  )
}
