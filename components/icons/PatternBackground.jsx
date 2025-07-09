export default function PatternBackground({ className = "w-full h-full" }) {
  return (
    <svg className={className} viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#0f766e" strokeWidth="0.5" opacity="0.1"/>
        </pattern>
        <pattern id="dots" width="20" height="20" patternUnits="userSpaceOnUse">
          <circle cx="10" cy="10" r="1" fill="#f59e0b" opacity="0.1"/>
        </pattern>
      </defs>
      
      {/* Grid pattern */}
      <rect width="100%" height="100%" fill="url(#grid)"/>
      
      {/* Dot pattern overlay */}
      <rect width="100%" height="100%" fill="url(#dots)"/>
      
      {/* Floating geometric shapes */}
      <circle cx="80" cy="80" r="3" fill="#0f766e" opacity="0.2"/>
      <circle cx="320" cy="120" r="2" fill="#f59e0b" opacity="0.3"/>
      <circle cx="60" cy="280" r="2.5" fill="#0f766e" opacity="0.15"/>
      <circle cx="350" cy="300" r="3.5" fill="#f59e0b" opacity="0.2"/>
      
      {/* Hexagonal shapes */}
      <polygon points="150,50 165,60 165,80 150,90 135,80 135,60" fill="#0f766e" opacity="0.1"/>
      <polygon points="280,200 295,210 295,230 280,240 265,230 265,210" fill="#f59e0b" opacity="0.1"/>
      <polygon points="100,350 115,360 115,380 100,390 85,380 85,360" fill="#0f766e" opacity="0.08"/>
      
      {/* Diamond shapes */}
      <polygon points="200,30 210,40 200,50 190,40" fill="#f59e0b" opacity="0.15"/>
      <polygon points="70,200 80,210 70,220 60,210" fill="#0f766e" opacity="0.12"/>
      <polygon points="330,350 340,360 330,370 320,360" fill="#f59e0b" opacity="0.1"/>
      
      {/* Connecting lines */}
      <path d="M80 80 Q 120 60 150 90" stroke="#0f766e" strokeWidth="1" fill="none" opacity="0.05"/>
      <path d="M320 120 Q 280 160 280 200" stroke="#f59e0b" strokeWidth="1" fill="none" opacity="0.05"/>
      <path d="M60 280 Q 100 320 100 350" stroke="#0f766e" strokeWidth="1" fill="none" opacity="0.05"/>
    </svg>
  )
}