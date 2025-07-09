export default function SecurityIllustration({ className = "w-full h-64" }) {
  return (
    <svg className={className} viewBox="0 0 600 300" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="securityBg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0f766e" stopOpacity="0.1"/>
          <stop offset="100%" stopColor="#134e4a" stopOpacity="0.05"/>
        </linearGradient>
        <linearGradient id="shieldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0f766e"/>
          <stop offset="100%" stopColor="#134e4a"/>
        </linearGradient>
        <linearGradient id="lockGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f59e0b"/>
          <stop offset="100%" stopColor="#d97706"/>
        </linearGradient>
        <radialGradient id="glowGradient" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#0f766e" stopOpacity="0.3"/>
          <stop offset="100%" stopColor="#0f766e" stopOpacity="0"/>
        </radialGradient>
      </defs>
      
      {/* Background */}
      <rect width="100%" height="100%" fill="url(#securityBg)"/>
      
      {/* Central Shield */}
      <g transform="translate(250, 50)">
        {/* Outer glow */}
        <circle cx="50" cy="100" r="120" fill="url(#glowGradient)"/>
        
        {/* Main shield */}
        <path d="M50 20 L90 35 L90 70 Q90 85 50 120 Q10 85 10 70 L10 35 L50 20 Z" fill="url(#shieldGradient)" opacity="0.9"/>
        
        {/* Inner shield detail */}
        <path d="M50 30 L80 42 L80 70 Q80 80 50 105 Q20 80 20 70 L20 42 L50 30 Z" fill="#f59e0b" opacity="0.2"/>
        
        {/* Central lock */}
        <rect x="42" y="65" width="16" height="20" rx="2" fill="url(#lockGradient)"/>
        <path d="M45 65 Q45 58 50 58 Q55 58 55 65" stroke="#f59e0b" strokeWidth="3" fill="none"/>
        
        {/* Shield emblem */}
        <circle cx="50" cy="50" r="3" fill="#f59e0b"/>
        <path d="M42 90 L47 95 L58 84" stroke="#f59e0b" strokeWidth="3" fill="none" strokeLinecap="round"/>
        
        {/* Security badges around shield */}
        <g transform="translate(-40, -20)">
          <rect x="0" y="0" width="25" height="15" rx="3" fill="#0f766e" opacity="0.8"/>
          <text x="12.5" y="10" fontSize="8" fill="white" textAnchor="middle" fontWeight="600">SSL</text>
        </g>
        
        <g transform="translate(115, -20)">
          <rect x="0" y="0" width="35" height="15" rx="3" fill="#0f766e" opacity="0.8"/>
          <text x="17.5" y="10" fontSize="8" fill="white" textAnchor="middle" fontWeight="600">SOC 2</text>
        </g>
        
        <g transform="translate(-50, 40)">
          <rect x="0" y="0" width="30" height="15" rx="3" fill="#0f766e" opacity="0.8"/>
          <text x="15" y="10" fontSize="8" fill="white" textAnchor="middle" fontWeight="600">GDPR</text>
        </g>
        
        <g transform="translate(120, 40)">
          <rect x="0" y="0" width="40" height="15" rx="3" fill="#0f766e" opacity="0.8"/>
          <text x="20" y="10" fontSize="8" fill="white" textAnchor="middle" fontWeight="600">256-bit</text>
        </g>
        
        <g transform="translate(-45, 100)">
          <rect x="0" y="0" width="35" height="15" rx="3" fill="#0f766e" opacity="0.8"/>
          <text x="17.5" y="10" fontSize="8" fill="white" textAnchor="middle" fontWeight="600">99.9%</text>
        </g>
        
        <g transform="translate(110, 100)">
          <rect x="0" y="0" width="30" height="15" rx="3" fill="#0f766e" opacity="0.8"/>
          <text x="15" y="10" fontSize="8" fill="white" textAnchor="middle" fontWeight="600">ISO</text>
        </g>
      </g>
      
      {/* Data Encryption Visualization - Left Side */}
      <g transform="translate(50, 80)">
        <text x="0" y="-10" fontSize="14" fill="#0f766e" fontWeight="700">Data Encryption</text>
        
        {/* Original data */}
        <rect x="0" y="0" width="80" height="40" rx="5" fill="#f59e0b" opacity="0.2"/>
        <text x="5" y="15" fontSize="10" fill="#0f766e" fontWeight="600">Customer Data</text>
        <text x="5" y="30" fontSize="8" fill="#0f766e">john@email.com</text>
        
        {/* Encryption process */}
        <path d="M80 20 L120 20 M110 15 L120 20 L110 25" stroke="#0f766e" strokeWidth="2" fill="none"/>
        <text x="85" y="10" fontSize="8" fill="#0f766e">Encrypt</text>
        
        {/* Encrypted data */}
        <rect x="120" y="0" width="80" height="40" rx="5" fill="#0f766e" opacity="0.8"/>
        <text x="125" y="15" fontSize="10" fill="white" fontWeight="600">Encrypted</text>
        <text x="125" y="30" fontSize="8" fill="white">xK9#mP2$vL8@</text>
        
        {/* Lock icon */}
        <rect x="185" y="45" width="10" height="8" rx="1" fill="#f59e0b"/>
        <path d="M187 45 Q187 42 190 42 Q193 42 193 45" stroke="#f59e0b" strokeWidth="1" fill="none"/>
      </g>
      
      {/* Secure Transmission - Right Side */}
      <g transform="translate(420, 80)">
        <text x="0" y="-10" fontSize="14" fill="#0f766e" fontWeight="700">Secure Transit</text>
        
        {/* Server */}
        <rect x="0" y="0" width="15" height="40" rx="3" fill="#0f766e" opacity="0.8"/>
        <circle cx="7.5" cy="10" r="2" fill="#f59e0b"/>
        <circle cx="7.5" cy="20" r="2" fill="#f59e0b" opacity="0.6"/>
        <circle cx="7.5" cy="30" r="2" fill="#f59e0b" opacity="0.3"/>
        
        {/* Secure connection */}
        <path d="M15 20 Q 45 10 75 20" stroke="#0f766e" strokeWidth="3" fill="none" strokeDasharray="5,5">
          <animate attributeName="stroke-dashoffset" values="0;10" dur="2s" repeatCount="indefinite"/>
        </path>
        
        {/* Encryption indicators */}
        <g opacity="0.7">
          <rect x="25" y="15" width="8" height="5" rx="1" fill="#f59e0b"/>
          <path d="M26.5 15 Q26.5 13.5 29 13.5 Q31.5 13.5 31.5 15" stroke="#f59e0b" strokeWidth="0.5" fill="none"/>
        </g>
        
        <g opacity="0.7">
          <rect x="45" y="12" width="8" height="5" rx="1" fill="#f59e0b"/>
          <path d="M46.5 12 Q46.5 10.5 49 10.5 Q51.5 10.5 51.5 12" stroke="#f59e0b" strokeWidth="0.5" fill="none"/>
        </g>
        
        <g opacity="0.7">
          <rect x="65" y="15" width="8" height="5" rx="1" fill="#f59e0b"/>
          <path d="M66.5 15 Q66.5 13.5 69 13.5 Q71.5 13.5 71.5 15" stroke="#f59e0b" strokeWidth="0.5" fill="none"/>
        </g>
        
        {/* Client device */}
        <rect x="75" y="10" width="20" height="15" rx="2" fill="#0f766e" opacity="0.8"/>
        <rect x="77" y="12" width="16" height="11" rx="1" fill="#f5f5f4"/>
        <circle cx="85" cy="17" r="2" fill="#f59e0b"/>
      </g>
      
      {/* Security Features List - Bottom */}
      <g transform="translate(50, 220)">
        <text x="250" y="-10" fontSize="16" fill="#0f766e" fontWeight="700" textAnchor="middle">Enterprise Security Features</text>
        
        {/* Feature items */}
        <g transform="translate(0, 10)">
          <circle cx="5" cy="8" r="3" fill="#f59e0b"/>
          <path d="M3 8 L4.5 9.5 L7 6.5" stroke="white" strokeWidth="1" fill="none"/>
          <text x="15" y="12" fontSize="12" fill="#0f766e" fontWeight="600">End-to-End Encryption</text>
        </g>
        
        <g transform="translate(150, 10)">
          <circle cx="5" cy="8" r="3" fill="#f59e0b"/>
          <path d="M3 8 L4.5 9.5 L7 6.5" stroke="white" strokeWidth="1" fill="none"/>
          <text x="15" y="12" fontSize="12" fill="#0f766e" fontWeight="600">SOC 2 Compliance</text>
        </g>
        
        <g transform="translate(300, 10)">
          <circle cx="5" cy="8" r="3" fill="#f59e0b"/>
          <path d="M3 8 L4.5 9.5 L7 6.5" stroke="white" strokeWidth="1" fill="none"/>
          <text x="15" y="12" fontSize="12" fill="#0f766e" fontWeight="600">GDPR Ready</text>
        </g>
        
        <g transform="translate(450, 10)">
          <circle cx="5" cy="8" r="3" fill="#f59e0b"/>
          <path d="M3 8 L4.5 9.5 L7 6.5" stroke="white" strokeWidth="1" fill="none"/>
          <text x="15" y="12" fontSize="12" fill="#0f766e" fontWeight="600">99.9% Uptime</text>
        </g>
        
        <g transform="translate(75, 35)">
          <circle cx="5" cy="8" r="3" fill="#f59e0b"/>
          <path d="M3 8 L4.5 9.5 L7 6.5" stroke="white" strokeWidth="1" fill="none"/>
          <text x="15" y="12" fontSize="12" fill="#0f766e" fontWeight="600">Regular Security Audits</text>
        </g>
        
        <g transform="translate(275, 35)">
          <circle cx="5" cy="8" r="3" fill="#f59e0b"/>
          <path d="M3 8 L4.5 9.5 L7 6.5" stroke="white" strokeWidth="1" fill="none"/>
          <text x="15" y="12" fontSize="12" fill="#0f766e" fontWeight="600">Secure Data Centers</text>
        </g>
      </g>
      
      {/* Floating security icons */}
      <g opacity="0.3">
        <path d="M100 50l2 4 4 2-4 2-2 4-2-4-4-2 4-2 2-4z" fill="#f59e0b"/>
        <path d="M480 60l1.5 3 3 1.5-3 1.5-1.5 3-1.5-3-3-1.5 3-1.5 1.5-3z" fill="#0f766e"/>
        <path d="M120 200l2 4 4 2-4 2-2 4-2-4-4-2 4-2 2-4z" fill="#f59e0b"/>
        <path d="M460 180l1.5 3 3 1.5-3 1.5-1.5 3-1.5-3-3-1.5 3-1.5 1.5-3z" fill="#0f766e"/>
      </g>
    </svg>
  )
}