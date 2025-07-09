export default function AnalyticsIcon({ className = "w-12 h-12" }) {
  return (
    <svg className={className} viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="analyticsGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0f766e"/>
          <stop offset="100%" stopColor="#134e4a"/>
        </linearGradient>
      </defs>
      
      {/* Background circle */}
      <circle cx="30" cy="30" r="25" fill="url(#analyticsGradient)" opacity="0.1"/>
      
      {/* Chart container */}
      <rect x="10" y="15" width="40" height="30" rx="4" fill="url(#analyticsGradient)" opacity="0.8"/>
      
      {/* Chart bars */}
      <rect x="15" y="30" width="4" height="10" rx="1" fill="#f59e0b"/>
      <rect x="22" y="25" width="4" height="15" rx="1" fill="#f59e0b"/>
      <rect x="29" y="20" width="4" height="20" rx="1" fill="#f59e0b"/>
      <rect x="36" y="27" width="4" height="13" rx="1" fill="#f59e0b"/>
      <rect x="43" y="22" width="4" height="18" rx="1" fill="#f59e0b"/>
      
      {/* Trend line */}
      <path d="M15 35 L22 30 L29 25 L36 32 L43 27" stroke="#f59e0b" strokeWidth="1.5" fill="none" opacity="0.6"/>
      
      {/* Data points */}
      <circle cx="15" cy="35" r="1.5" fill="#f59e0b"/>
      <circle cx="22" cy="30" r="1.5" fill="#f59e0b"/>
      <circle cx="29" cy="25" r="1.5" fill="#f59e0b"/>
      <circle cx="36" cy="32" r="1.5" fill="#f59e0b"/>
      <circle cx="43" cy="27" r="1.5" fill="#f59e0b"/>
      
      {/* Sparkle for AI */}
      <path d="M47 12l1.5 3 3 1.5-3 1.5-1.5 3-1.5-3-3-1.5 3-1.5 1.5-3z" fill="#f59e0b" opacity="0.8"/>
    </svg>
  )
}