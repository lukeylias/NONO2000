import { assetUrl } from '../asset-url'

interface BrandLogoProps {
  variant: 'boot' | 'header'
}

const logoUrl = assetUrl('assets/nono2000-logo-aqua-gel.png?v=20260825')

export function BrandLogo({ variant }: BrandLogoProps) {
  return (
    <span className={`brand-logo brand-logo-${variant}`}>
      <span className="brand-logo-text">NONO2000</span>
      <img aria-hidden="true" alt="" src={logoUrl} />
    </span>
  )
}
