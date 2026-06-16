import type { CartItem, Product, Promotion, SelectedOption } from '@/lib/types'

export function isPromotionActive(promotion: Promotion, now = new Date()) {
  return promotion.active && now >= promotion.validFrom && now <= promotion.validTo
}

export function getActivePromotions(promotions: Promotion[], now = new Date()) {
  return promotions.filter((promotion) => isPromotionActive(promotion, now))
}

export function promotionAppliesToProduct(promotion: Promotion, product: Product) {
  const hasProducts = Boolean(promotion.productIds?.length)
  const hasCategories = Boolean(promotion.categoryIds?.length)

  if (!hasProducts && !hasCategories) return false

  if (promotion.productIds?.includes(product.id)) return true
  if (promotion.categoryIds?.includes(product.categoryId)) return true
  return false
}

export function getProductDiscountPercent(product: Product, promotions: Promotion[], now = new Date()) {
  let maxDiscount = 0

  for (const promotion of getActivePromotions(promotions, now)) {
    if (promotionAppliesToProduct(promotion, product) && promotion.discount > maxDiscount) {
      maxDiscount = promotion.discount
    }
  }

  return maxDiscount
}

export function getItemModifiers(product: Product, selectedOptions: SelectedOption[]) {
  return selectedOptions.reduce((sum, selectedOption) => {
    const option = product.options?.find((candidate) => candidate.id === selectedOption.optionId)
    return (
      sum +
      (option?.choices
        .filter((choice) => selectedOption.choiceIds.includes(choice.id))
        .reduce((choiceSum, choice) => choiceSum + choice.priceModifier, 0) ?? 0)
    )
  }, 0)
}

export function getItemUnitPrice(product: Product, selectedOptions: SelectedOption[]) {
  return product.price + getItemModifiers(product, selectedOptions)
}

export function getDiscountedUnitPrice(
  product: Product,
  selectedOptions: SelectedOption[],
  promotions: Promotion[],
  now = new Date()
) {
  const base = getItemUnitPrice(product, selectedOptions)
  const discount = getProductDiscountPercent(product, promotions, now)
  return discount > 0 ? base * (1 - discount / 100) : base
}

export function getCartSubtotal(items: CartItem[], promotions: Promotion[], now = new Date()) {
  return items.reduce((sum, item) => {
    const unitPrice = getDiscountedUnitPrice(item.product, item.selectedOptions, promotions, now)
    return sum + unitPrice * item.quantity
  }, 0)
}

export function getCartDiscountAmount(items: CartItem[], promotions: Promotion[], now = new Date()) {
  return items.reduce((sum, item) => {
    const regular = getItemUnitPrice(item.product, item.selectedOptions)
    const discounted = getDiscountedUnitPrice(item.product, item.selectedOptions, promotions, now)
    return sum + (regular - discounted) * item.quantity
  }, 0)
}

export function getPromotedProducts(products: Product[], promotions: Promotion[], now = new Date()) {
  return products.filter(
    (product) => product.available && getProductDiscountPercent(product, promotions, now) > 0
  )
}
