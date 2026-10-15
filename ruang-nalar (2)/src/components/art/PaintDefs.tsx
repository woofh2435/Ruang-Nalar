// Definisi filter SVG untuk efek cat tebal: feTurbulence + feDisplacementMap.
// Dipasang sekali di App. Dipakai lewat CSS: filter: url(#cat-tepi) dst.

export function PaintDefs() {
  return (
    <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true" focusable="false">
      <defs>
        {/* tepi panel kolase: bergelombang seperti guntingan kertas bercat */}
        <filter id="cat-tepi" x="-6%" y="-6%" width="112%" height="112%" colorInterpolationFilters="sRGB">
          <feTurbulence type="fractalNoise" baseFrequency="0.032" numOctaves="2" seed="3" result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="9" xChannelSelector="R" yChannelSelector="G" />
        </filter>
        {/* judul: goyangan halus supaya huruf terasa dilukis */}
        <filter id="cat-judul" x="-4%" y="-10%" width="108%" height="124%" colorInterpolationFilters="sRGB">
          <feTurbulence type="fractalNoise" baseFrequency="0.045" numOctaves="2" seed="11" result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="3.2" xChannelSelector="R" yChannelSelector="G" />
        </filter>
        {/* sapuan kuas (transisi halaman, progress bar): goresan memanjang */}
        <filter id="cat-kuas" x="-10%" y="-10%" width="120%" height="120%" colorInterpolationFilters="sRGB">
          <feTurbulence type="fractalNoise" baseFrequency="0.012 0.16" numOctaves="3" seed="5" result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="22" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </defs>
    </svg>
  )
}
