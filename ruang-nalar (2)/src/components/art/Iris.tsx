interface Props {
  className?: string
}

// Bunga iris: tiga kelopak tegak, tiga kelopak menjuntai, daun pedang.
export function Iris({ className }: Props) {
  const tegak = 'M0 0 C -27 -22 -27 -68 0 -94 C 27 -68 27 -22 0 0 Z'
  const juntai = 'M0 0 C -32 12 -42 52 -15 76 C -5 84 5 84 15 76 C 42 52 32 12 0 0 Z'
  return (
    <svg viewBox="0 0 200 290" className={className} aria-hidden="true" focusable="false">
      <path d="M100 290 C 92 210 44 160 26 96 C 62 150 104 196 110 290Z" fill="#4f7a3a" stroke="#34561f" strokeWidth="2" />
      <path d="M100 290 C 112 214 154 170 176 110 C 140 156 100 200 96 290Z" fill="#5c8a43" stroke="#34561f" strokeWidth="2" />
      <path d="M100 290 C 98 240 100 200 100 150" fill="none" stroke="#3d6a2a" strokeWidth="6" strokeLinecap="round" />
      <g transform="translate(100 124)">
        {[-64, 0, 64].map((a) => (
          <g key={'f' + a} transform={`rotate(${a === 0 ? 180 : a < 0 ? 180 - 64 : 180 + 64}) scale(0.95)`}>
            <path d={juntai} fill="#3f2f7a" stroke="#271c55" strokeWidth="2" />
            <path d="M0 18 L0 50" stroke="#f6d24b" strokeWidth="4" strokeLinecap="round" opacity="0.95" />
            <path d="M-6 28 L-9 48 M6 28 L9 48" stroke="#f6d24b" strokeWidth="2" strokeLinecap="round" opacity="0.8" />
          </g>
        ))}
        {[-30, 0, 30].map((a) => (
          <path key={'t' + a} d={tegak} transform={`rotate(${a}) scale(${a === 0 ? 1 : 0.9})`} fill="#7a5cc4" stroke="#4a3a94" strokeWidth="2" />
        ))}
        <circle r="7" fill="#f6d24b" stroke="#c98a12" strokeWidth="1.5" />
      </g>
    </svg>
  )
}
