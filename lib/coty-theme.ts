export const COTY_TEAL = '#2D5A57'
export const COTY_HEADER = '#053E38'
export const COTY_COMBOS_GRADIENT =
  'linear-gradient(145.61deg, #2E514E 9.59%, #579E98 147.45%)'
export const COTY_CTA_GRADIENT =
  'linear-gradient(90deg, #007C6F 0%, #008C7D 50.47%, #008C7D 50.48%, #00D0BA 100%)'
export const COTY_QTY_BG = '#C5DDD9'
export const COTY_CREAM = '#F5F0EA'
export const LOGO_SRC = '/logo-coty-cafe.png'
export const LOGO_SRC_SVG = '/coty-logo.svg'
export const LOGO_SRC_SVG_2 = '/coty-logo-2.svg'
export const LOGO_SRC_SVG_NEGRO = '/coty-logo-negro.svg'

export function formatPrice(price: number) {
  return `$${Math.round(price).toLocaleString('es-AR')}`
}
