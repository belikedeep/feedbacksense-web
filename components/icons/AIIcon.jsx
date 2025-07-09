export default function AIIcon({ className = "w-12 h-12" }) {
  return (
    <svg className={className} viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="aiGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0f766e"/>
          <stop offset="100%" stopColor="#134e4a"/>
        </linearGradient>
        <radialGradient id="brainGradient" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.8"/>
          <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.4"/>
        </radialGradient>
      </defs>
      
      {/* Background circle */}
      <circle cx="30" cy="30" r="25" fill="url(#aiGradient)" opacity="0.1"/>
      
      {/* AI Brain/Neural network */}
      <circle cx="30" cy="30" r="15" fill="url(#brainGradient)" opacity="0.2"/>
      
      {/* Neural connections */}
      <path d="M20 25 Q 25 20 30 25 Q 35 20 40 25" stroke="#0f766e" strokeWidth="1.5" fill="none" opacity="0.6"/>
      <path d="M20 35 Q 25 40 30 35 Q 35 40 40 35" stroke="#0f766e" strokeWidth="1.5" fill="none" opacity="0.6"/>
      <path d="M25 20 Q 30 25 35 20" stroke="#0f766e" strokeWidth="1.5" fill="none" opacity="0.4"/>
      <path d="M25 40 Q 30 35 35 40" stroke="#0f766e" strokeWidth="1.5" fill="none" opacity="0.4"/>
      
      {/* Neural nodes */}
      <circle cx="20" cy="25" r="2" fill="#0f766e" opacity="0.8"/>
      <circle cx="30" cy="25" r="2" fill="#0f766e" opacity="0.8"/>
      <circle cx="40" cy="25" r="2" fill="#0f766e" opacity="0.8"/>
      <circle cx="20" cy="35" r="2" fill="#0f766e" opacity="0.8"/>
      <circle cx="30" cy="35" r="2" fill="#0f766e" opacity="0.8"/>
      <circle cx="40" cy="35" r="2" fill="#0f766e" opacity="0.8"/>
      <circle cx="25" cy="20" r="1.5" fill="#0f766e" opacity="0.6"/>
      <circle cx="35" cy="20" r="1.5" fill="#0f766e" opacity="0.6"/>
      <circle cx="25" cy="40" r="1.5" fill="#0f766e" opacity="0.6"/>
      <circle cx="35" cy="40" r="1.5" fill="#0f766e" opacity="0.6"/>
      
      {/* Central processing unit */}
      <circle cx="30" cy="30" r="3" fill="#f59e0b" opacity="0.8"/>
      <circle cx="30" cy="30" r="1.5" fill="#f59e0b"/>
      
      {/* AI Sparkles */}
      <path d="M10 15l2 4 4 2-4 2-2 4-2-4-4-2 4-2 2-4z" fill="#f59e0b" opacity="0.7"/>
      <path d="M50 45l1.5 3 3 1.5-3 1.5-1.5 3-1.5-3-3-1.5 3-1.5 1.5-3z" fill="#f59e0b" opacity="0.7"/>
      <path d="M45 10l1 2 2 1-2 1-1 2-1-2-2-1 2-1 1-2z" fill="#f59e0b" opacity="0.6"/>
    </svg>
  )
}