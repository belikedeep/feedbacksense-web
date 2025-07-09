export default function SecurityIcon({ className = "w-12 h-12" }) {
  return (
    <svg className={className} viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="securityGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0f766e"/>
          <stop offset="100%" stopColor="#134e4a"/>
        </linearGradient>
      </defs>
      
      {/* Background circle */}
      <circle cx="30" cy="30" r="25" fill="url(#securityGradient)" opacity="0.1"/>
      
      {/* Shield shape */}
      <path d="M30 10 L45 18 L45 32 Q45 40 30 48 Q15 40 15 32 L15 18 L30 10 Z" fill="url(#securityGradient)" opacity="0.8"/>
      
      {/* Inner shield */}
      <path d="M30 15 L40 21 L40 32 Q40 37 30 43 Q20 37 20 32 L20 21 L30 15 Z" fill="#f59e0b" opacity="0.3"/>
      
      {/* Lock icon inside */}
      <rect x="26" y="26" width="8" height="10" rx="1" fill="#f59e0b" opacity="0.8"/>
      <path d="M28 26 Q28 23 30 23 Q32 23 32 26" stroke="#f59e0b" strokeWidth="1.5" fill="none" opacity="0.8"/>
      
      {/* Security dots */}
      <circle cx="30" cy="20" r="1" fill="#f59e0b" opacity="0.6"/>
      <circle cx="30" cy="38" r="1" fill="#f59e0b" opacity="0.6"/>
      <circle cx="25" cy="29" r="0.8" fill="#f59e0b" opacity="0.5"/>
      <circle cx="35" cy="29" r="0.8" fill="#f59e0b" opacity="0.5"/>
      
      {/* Protection aura */}
      <circle cx="30" cy="30" r="20" stroke="#0f766e" strokeWidth="1" fill="none" opacity="0.2" strokeDasharray="3,3"/>
      
      {/* Checkmark */}
      <path d="M25 30 L28 33 L35 26" stroke="#f59e0b" strokeWidth="2" fill="none" opacity="0.9" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}