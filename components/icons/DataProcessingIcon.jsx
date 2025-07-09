export default function DataProcessingIcon({ className = "w-12 h-12" }) {
  return (
    <svg className={className} viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="dataGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0f766e"/>
          <stop offset="100%" stopColor="#134e4a"/>
        </linearGradient>
      </defs>
      
      {/* Background circle */}
      <circle cx="30" cy="30" r="25" fill="url(#dataGradient)" opacity="0.1"/>
      
      {/* Server/Database stack */}
      <ellipse cx="30" cy="18" rx="15" ry="4" fill="url(#dataGradient)" opacity="0.8"/>
      <ellipse cx="30" cy="30" rx="15" ry="4" fill="url(#dataGradient)" opacity="0.8"/>
      <ellipse cx="30" cy="42" rx="15" ry="4" fill="url(#dataGradient)" opacity="0.8"/>
      
      {/* Server sides */}
      <rect x="15" y="18" width="30" height="12" fill="url(#dataGradient)" opacity="0.6"/>
      <rect x="15" y="30" width="30" height="12" fill="url(#dataGradient)" opacity="0.6"/>
      
      {/* Data flow arrows */}
      <path d="M10 25 L20 25 M17 22 L20 25 L17 28" stroke="#f59e0b" strokeWidth="2" fill="none" opacity="0.8"/>
      <path d="M40 25 L50 25 M47 22 L50 25 L47 28" stroke="#f59e0b" strokeWidth="2" fill="none" opacity="0.8"/>
      <path d="M10 35 L20 35 M17 32 L20 35 L17 38" stroke="#f59e0b" strokeWidth="2" fill="none" opacity="0.8"/>
      <path d="M40 35 L50 35 M47 32 L50 35 L47 38" stroke="#f59e0b" strokeWidth="2" fill="none" opacity="0.8"/>
      
      {/* Processing indicators */}
      <circle cx="25" cy="22" r="1.5" fill="#f59e0b" opacity="0.9"/>
      <circle cx="30" cy="22" r="1.5" fill="#f59e0b" opacity="0.7"/>
      <circle cx="35" cy="22" r="1.5" fill="#f59e0b" opacity="0.9"/>
      
      <circle cx="25" cy="34" r="1.5" fill="#f59e0b" opacity="0.7"/>
      <circle cx="30" cy="34" r="1.5" fill="#f59e0b" opacity="0.9"/>
      <circle cx="35" cy="34" r="1.5" fill="#f59e0b" opacity="0.7"/>
      
      {/* AI processing sparkle */}
      <path d="M45 10l2 4 4 2-4 2-2 4-2-4-4-2 4-2 2-4z" fill="#f59e0b" opacity="0.8"/>
      
      {/* Data streams */}
      <path d="M5 15 Q 15 10 25 15" stroke="#f59e0b" strokeWidth="1" fill="none" opacity="0.4" strokeDasharray="2,2"/>
      <path d="M35 15 Q 45 10 55 15" stroke="#f59e0b" strokeWidth="1" fill="none" opacity="0.4" strokeDasharray="2,2"/>
      <path d="M5 45 Q 15 50 25 45" stroke="#f59e0b" strokeWidth="1" fill="none" opacity="0.4" strokeDasharray="2,2"/>
      <path d="M35 45 Q 45 50 55 45" stroke="#f59e0b" strokeWidth="1" fill="none" opacity="0.4" strokeDasharray="2,2"/>
    </svg>
  )
}