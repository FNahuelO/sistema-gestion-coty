import * as Icons from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export type CategoryIconOption = {
  slug: string
  label: string
}

type IconKey = keyof typeof Icons

const ICON_ENTRIES: [slug: string, label: string, key: IconKey][] = [
  // Bebidas
  ['coffee', 'Café', 'Coffee'],
  ['cup-soda', 'Gaseosa', 'CupSoda'],
  ['glass-water', 'Agua', 'GlassWater'],
  ['milk', 'Leche', 'Milk'],
  ['milk-off', 'Sin lactosa', 'MilkOff'],
  ['wine', 'Vino', 'Wine'],
  ['wine-off', 'Sin alcohol', 'WineOff'],
  ['beer', 'Cerveza', 'Beer'],
  ['beer-off', 'Sin alcohol', 'BeerOff'],
  ['bottle-wine', 'Botella', 'BottleWine'],
  ['martini', 'Cóctel', 'Martini'],
  ['pill-bottle', 'Jugo / shot', 'PillBottle'],
  ['droplets', 'Hidratación', 'Droplets'],

  // Panadería y dulces
  ['croissant', 'Croissant', 'Croissant'],
  ['cake', 'Torta', 'Cake'],
  ['cake-slice', 'Porción de torta', 'CakeSlice'],
  ['cookie', 'Galleta', 'Cookie'],
  ['candy', 'Caramelo', 'Candy'],
  ['candy-cane', 'Caramelo bastón', 'CandyCane'],
  ['candy-off', 'Sin azúcar', 'CandyOff'],
  ['donut', 'Donut', 'Donut'],
  ['ice-cream-cone', 'Helado cono', 'IceCreamCone'],
  ['ice-cream', 'Helado', 'IceCream'],
  ['ice-cream-bowl', 'Helado bowl', 'IceCreamBowl'],
  ['lollipop', 'Chupetín', 'Lollipop'],
  ['popsicle', 'Paleta', 'Popsicle'],
  ['popcorn', 'Pochoclo', 'Popcorn'],
  ['slice', 'Porción', 'Slice'],
  ['wheat', 'Pan / harinas', 'Wheat'],
  ['wheat-off', 'Sin gluten', 'WheatOff'],

  // Comidas
  ['utensils', 'Cubiertos', 'Utensils'],
  ['utensils-crossed', 'Comida', 'UtensilsCrossed'],
  ['fork-knife', 'Menú', 'ForkKnife'],
  ['fork-knife-crossed', 'Plato', 'ForkKnifeCrossed'],
  ['soup', 'Sopa', 'Soup'],
  ['salad', 'Ensalada', 'Salad'],
  ['pizza', 'Pizza', 'Pizza'],
  ['sandwich', 'Sandwich', 'Sandwich'],
  ['hamburger', 'Hamburguesa', 'Hamburger'],
  ['beef', 'Carne', 'Beef'],
  ['ham', 'Jamón', 'Ham'],
  ['drumstick', 'Pollo', 'Drumstick'],
  ['fish', 'Pescado', 'Fish'],
  ['fish-off', 'Sin pescado', 'FishOff'],
  ['shrimp', 'Camarón', 'Shrimp'],
  ['shell', 'Mariscos', 'Shell'],
  ['egg', 'Huevo', 'Egg'],
  ['egg-fried', 'Huevo frito', 'EggFried'],
  ['egg-off', 'Sin huevo', 'EggOff'],
  ['cooking-pot', 'Cocina', 'CookingPot'],
  ['chef-hat', 'Chef', 'ChefHat'],
  ['refrigerator', 'Frío / bebidas', 'Refrigerator'],

  // Frutas y naturales
  ['leaf', 'Natural', 'Leaf'],
  ['leafy-green', 'Verde', 'LeafyGreen'],
  ['sprout', 'Orgánico', 'Sprout'],
  ['vegan', 'Vegano', 'Vegan'],
  ['apple', 'Manzana', 'Apple'],
  ['cherry', 'Cereza', 'Cherry'],
  ['banana', 'Banana', 'Banana'],
  ['carrot', 'Zanahoria', 'Carrot'],
  ['grape', 'Uva', 'Grape'],
  ['citrus', 'Cítricos', 'Citrus'],
  ['bean', 'Legumbres', 'Bean'],
  ['bean-off', 'Sin legumbres', 'BeanOff'],
  ['nut', 'Frutos secos', 'Nut'],
  ['nut-off', 'Sin frutos secos', 'NutOff'],

  // Temperatura y clima
  ['snowflake', 'Frío', 'Snowflake'],
  ['flame', 'Caliente', 'Flame'],
  ['flame-kindling', 'A la parrilla', 'FlameKindling'],
  ['sun', 'Sol', 'Sun'],
  ['cloud-snow', 'Frappé / frío', 'CloudSnow'],
  ['sun-snow', 'Mix frío-calor', 'SunSnow'],
  ['mountain-snow', 'Montaña', 'MountainSnow'],
  ['thermometer-snowflake', 'Bien frío', 'ThermometerSnowflake'],
  ['thermometer', 'Temperatura', 'Thermometer'],

  // Destacados y promos
  ['star', 'Estrella', 'Star'],
  ['stars', 'Estrellas', 'Stars'],
  ['circle-star', 'Favorito', 'CircleStar'],
  ['sparkles', 'Especial', 'Sparkles'],
  ['sparkle', 'Brillo', 'Sparkle'],
  ['wand-sparkles', 'Mágico', 'WandSparkles'],
  ['tag', 'Etiqueta', 'Tag'],
  ['tags', 'Etiquetas', 'Tags'],
  ['heart', 'Favorito', 'Heart'],
  ['gift', 'Regalo', 'Gift'],
  ['percent', 'Descuento', 'Percent'],
  ['badge-percent', 'Promo', 'BadgePercent'],
  ['circle-percent', 'Oferta', 'CirclePercent'],
  ['ticket-percent', 'Cupón', 'TicketPercent'],
  ['crown', 'Premium', 'Crown'],
  ['trophy', 'Ganador', 'Trophy'],
  ['zap', 'Energía', 'Zap'],

  // Servicio y local
  ['truck', 'Delivery', 'Truck'],
  ['store', 'Local', 'Store'],
  ['shopping-bag', 'Para llevar', 'ShoppingBag'],
  ['handbag', 'Bolsa', 'Handbag'],
  ['clock', 'Horario', 'Clock'],
  ['hourglass', 'Espera', 'Hourglass'],
  ['map-pin', 'Ubicación', 'MapPin'],
  ['home', 'Inicio', 'Home'],
  ['users', 'Grupos / mesas', 'Users'],
  ['moon-star', 'Noche', 'MoonStar'],
]

function resolveIcon(key: IconKey): LucideIcon {
  const icon = Icons[key]
  if (typeof icon !== 'function' && (typeof icon !== 'object' || icon === null)) {
    throw new Error(`Icono Lucide no encontrado: ${String(key)}`)
  }
  return icon as LucideIcon
}

export const CATEGORY_ICON_REGISTRY = ICON_ENTRIES.map(([slug, label, key]) => ({
  slug,
  label,
  icon: resolveIcon(key),
}))

export const CATEGORY_ICON_OPTIONS: CategoryIconOption[] = CATEGORY_ICON_REGISTRY.map(({ slug, label }) => ({
  slug,
  label,
}))

const SLUG_TO_ICON = Object.fromEntries(CATEGORY_ICON_REGISTRY.map((entry) => [entry.slug, entry.icon])) as Record<
  string,
  LucideIcon
>

export function toIconSlug(name: string) {
  if (!name) return ''
  if (/^[a-z0-9-]+$/.test(name)) return name
  return name
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/([A-Z])([A-Z][a-z])/g, '$1-$2')
    .replace(/([a-zA-Z])(\d)/g, '$1-$2')
    .toLowerCase()
}

export function formatCategoryIconLabel(iconName: string) {
  const slug = toIconSlug(iconName)
  if (!slug) return 'Sin icono'
  const option = CATEGORY_ICON_OPTIONS.find((entry) => entry.slug === slug)
  return option?.label ?? slug.replace(/-/g, ' ')
}

export function getCategoryIcon(iconName: string): LucideIcon {
  const slug = toIconSlug(iconName)
  return SLUG_TO_ICON[slug] ?? Icons.UtensilsCrossed
}
