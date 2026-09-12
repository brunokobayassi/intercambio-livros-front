import { useId } from 'react'

function joinClassNames(...classNames) {
  return classNames.filter(Boolean).join(' ')
}

/**
 * Local, dependency-free rendering of the Intercâmbio de Livros brand.
 *
 * @param {Object} props
 * @param {boolean} [props.compact=false] Renders only the symbol when true.
 * @param {boolean} [props.decorative=false] Hides the SVG from assistive tech.
 * @param {string} [props.className=''] Additional styling hook.
 */
export function BrandLogo({ compact = false, decorative = false, className = '' }) {
  const titleId = useId()

  return (
    <svg
      aria-hidden={decorative || undefined}
      aria-labelledby={decorative ? undefined : titleId}
      className={joinClassNames(
        'brand-logo',
        compact && 'brand-logo--compact',
        className,
      )}
      fill="none"
      focusable="false"
      role={decorative ? undefined : 'img'}
      viewBox={compact ? '0 0 52 60' : '0 0 240 60'}
      xmlns="http://www.w3.org/2000/svg"
    >
      {!decorative && <title id={titleId}>Intercâmbio de Livros</title>}
      <rect className="brand-logo__tile" fill="#6c5ce7" height="44" rx="12" width="44" x="4" y="8" />
      <path
        className="brand-logo__book-page brand-logo__book-page--left"
        d="M16 22C16 19.7909 17.7909 18 20 18H28C30.2091 18 32 19.7909 32 22V38C30.5 37 28 36.5 25 36.5C21.5 36.5 18 37.5 16 39V22Z"
        fill="#ffffff"
      />
      <path
        className="brand-logo__book-page brand-logo__book-page--right"
        d="M36 22C36 19.7909 34.2091 18 32 18H24C21.7909 18 20 19.7909 20 22V38C21.5 37 24 36.5 27 36.5C30.5 36.5 34 37.5 36 39V22Z"
        fill="#00d2d3"
        fillOpacity="0.9"
      />
      <path
        className="brand-logo__exchange-mark"
        d="M22 28L28 24M28 24L34 28M28 24V34"
        stroke="#ff7675"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2.5"
      />
      {!compact && (
        <>
          <text
            className="brand-logo__wordmark"
            fill="#2d3436"
            fontFamily="Plus Jakarta Sans Variable, Plus Jakarta Sans, sans-serif"
            fontSize="19"
            fontWeight="800"
            letterSpacing="-0.5"
            x="58"
            y="32"
          >
            Intercâmbio
          </text>
          <text
            className="brand-logo__descriptor"
            fill="#6c5ce7"
            fontFamily="Plus Jakarta Sans Variable, Plus Jakarta Sans, sans-serif"
            fontSize="14"
            fontWeight="600"
            x="58"
            y="46"
          >
            de Livros
          </text>
        </>
      )}
    </svg>
  )
}
