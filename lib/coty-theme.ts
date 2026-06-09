export const COTY_TEAL = '#2D5A57'
export const COTY_HEADER = '#053E38'
export const COTY_QTY_BG = '#C5DDD9'
export const COTY_CREAM = '#F5F0EA'
export const LOGO_SRC = '/logo-coty-cafe.png'
export const LOGO_SRC_SVG = '/coty-logo.svg'
export const LOGO_SRC_SVG_2 = '/coty-logo-2.svg'
export const LOGO_SRC_SVG_NEGRO = '/coty-logo-negro.svg'

export function formatPrice(price: number) {
  return `$${Math.round(price).toLocaleString('es-AR')}`
}
