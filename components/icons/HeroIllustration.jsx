export default function HeroIllustration({ className = "w-96 h-96" }) {
  return (
    <svg className={className} viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Background gradient circle */}
      <defs>
        <radialGradient id="heroGradient" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#0f766e" stopOpacity="0.1"/>
          <stop offset="100%" stopColor="#0f766e" stopOpacity="0.05"/>
        </radialGradient>
        <linearGradient id="dashboardGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0f766e"/>
          <stop offset="100%" stopColor="#134e4a"/>
        </linearGradient>
      </defs>
      
      <circle cx="200" cy="200" r="180" fill="url(#heroGradient)"/>
      
      {/* Dashboard mockup */}
      <rect x="80" y="120" width="240" height="160" rx="12" fill="url(#dashboardGradient)" opacity="0.9"/>
      <rect x="90" y="130" width="220" height="20" rx="4" fill="white" opacity="0.1"/>
      
      {/* Chart bars */}
      <rect x="100" y="170" width="15" height="40" rx="2" fill="#f59e0b" opacity="0.8"/>
      <rect x="120" y="160" width="15" height="50" rx="2" fill="#f59e0b" opacity="0.9"/>
      <rect x="140" y="150" width="15" height="60" rx="2" fill="#f59e0b"/>
      <rect x="160" y="165" width="15" height="45" rx="2" fill="#f59e0b" opacity="0.8"/>
      <rect x="180" y="155" width="15" height="55" rx="2" fill="#f59e0b" opacity="0.9"/>
      
      {/* Pie chart */}
      <circle cx="250" cy="185" r="25" fill="none" stroke="#f59e0b" strokeWidth="8" strokeDasharray="40 60" opacity="0.8"/>
      <circle cx="250" cy="185" r="25" fill="none" stroke="#0f766e" strokeWidth="8" strokeDasharray="60 40" strokeDashoffset="40" opacity="0.6"/>
      
      {/* Feedback bubbles floating around */}
      <circle cx="50" cy="80" r="20" fill="#f59e0b" opacity="0.2"/>
      <path d="M45 75c0-5.5 4.5-10 10-10s10 4.5 10 10c0 2.5-1 4.8-2.6 6.5L65 90l-6.5-2.4C56.8 86.6 55.5 85 55 83h-3c-2.2 0-4-1.8-4-4v-4z" fill="#f59e0b" opacity="0.6"/>
      
      <circle cx="350" cy="100" r="15" fill="#0f766e" opacity="0.2"/>
      <path d="M343 95c0-4 3-7 7-7s7 3 7 7c0 1.8-0.7 3.4-1.8 4.6L358 108l-4.6-1.8C351.6 105.4 350.8 104 350 102h-2c-1.5 0-2.8-1.3-2.8-2.8V95z" fill="#0f766e" opacity="0.6"/>
      
      <circle cx="60" cy="320" r="18" fill="#f59e0b" opacity="0.2"/>
      <path d="M54 315c0-4.8 3.8-8.5 8.5-8.5s8.5 3.8 8.5 8.5c0 2.1-0.8 4-2.1 5.4L72 330l-5.4-2C64.8 327.2 63.9 325.5 63 323h-2.5c-1.9 0-3.5-1.6-3.5-3.5V315z" fill="#f59e0b" opacity="0.6"/>
      
      <circle cx="340" cy="300" r="22" fill="#0f766e" opacity="0.2"/>
      <path d="M332 295c0-6 4.8-11 11-11s11 4.8 11 11c0 2.7-1 5.2-2.8 7L356 315l-7-2.8C346.2 311.2 344.7 309 344 306h-3.5c-2.5 0-4.5-2-4.5-4.5V295z" fill="#0f766e" opacity="0.6"/>
      
      {/* AI sparkles */}
      <path d="M120 60l3 6 6 3-6 3-3 6-3-6-6-3 6-3 3-6z" fill="#f59e0b" opacity="0.8"/>
      <path d="M300 50l2 4 4 2-4 2-2 4-2-4-4-2 4-2 2-4z" fill="#f59e0b" opacity="0.7"/>
      <path d="M90 350l2.5 5 5 2.5-5 2.5-2.5 5-2.5-5-5-2.5 5-2.5 2.5-5z" fill="#f59e0b" opacity="0.8"/>
      <path d="M320 340l2 4 4 2-4 2-2 4-2-4-4-2 4-2 2-4z" fill="#f59e0b" opacity="0.6"/>
      
      {/* Data flow lines */}
      <path d="M70 100 Q 150 80 200 120" stroke="#0f766e" strokeWidth="2" fill="none" opacity="0.3" strokeDasharray="5,5"/>
      <path d="M330 120 Q 250 100 200 140" stroke="#f59e0b" strokeWidth="2" fill="none" opacity="0.3" strokeDasharray="5,5"/>
      <path d="M80 320 Q 140 280 200 260" stroke="#0f766e" strokeWidth="2" fill="none" opacity="0.3" strokeDasharray="5,5"/>
      <path d="M320 300 Q 260 280 200 260" stroke="#f59e0b" strokeWidth="2" fill="none" opacity="0.3" strokeDasharray="5,5"/>
    </svg>
  )
}