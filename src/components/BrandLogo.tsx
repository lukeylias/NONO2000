interface BrandLogoProps {
  variant: 'boot' | 'header'
}

const logoUrl = `${import.meta.env.BASE_URL}assets/nono2000-logo.png?v=20260825-transparent`

export function BrandLogo({ variant }: BrandLogoProps) {
  return (
    <span className={`brand-logo brand-logo-${variant}`}>
      <span className="brand-logo-text">NONO2000</span>
      <img aria-hidden="true" alt="" src={logoUrl} />
    </span>
  )
}
