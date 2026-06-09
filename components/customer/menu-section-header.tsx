interface MenuSectionHeaderProps {
  icon: React.ReactNode
  name: string
  count: number
  className?: string
}

export function MenuSectionHeader({
  icon,
  name,
  count,
  className = '',
}: MenuSectionHeaderProps) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div
        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl"
        style={{ backgroundColor: '#053E38' }}
      >
        {icon}
      </div>
      <div>
        <h2 className="text-base font-bold text-foreground md:text-lg">{name}</h2>
        <p className="text-xs text-[#6BACA5] md:text-sm">
          {count} {count === 1 ? 'producto' : 'productos'}
        </p>
      </div>
    </div>
  )
}
