export default function DashboardMockup({ className = "w-full h-96" }) {
  return (
    <svg className={className} viewBox="0 0 800 500" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="dashboardBg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0f766e"/>
          <stop offset="100%" stopColor="#134e4a"/>
        </linearGradient>
        <linearGradient id="cardGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f5f5f4"/>
          <stop offset="100%" stopColor="#e7e5e4"/>
        </linearGradient>
        <linearGradient id="chartGradient" x1="0%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.8"/>
          <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.3"/>
        </linearGradient>
      </defs>
      
      {/* Main dashboard container */}
      <rect x="50" y="50" width="700" height="400" rx="20" fill="url(#dashboardBg)" opacity="0.95"/>
      
      {/* Top navigation bar */}
      <rect x="70" y="70" width="660" height="40" rx="8" fill="white" opacity="0.1"/>
      <circle cx="90" cy="90" r="8" fill="#f59e0b" opacity="0.8"/>
      <rect x="110" y="85" width="120" height="10" rx="5" fill="white" opacity="0.6"/>
      <rect x="600" y="85" width="80" height="10" rx="5" fill="white" opacity="0.4"/>
      
      {/* Main content area */}
      <rect x="70" y="130" width="660" height="300" rx="12" fill="white" opacity="0.05"/>
      
      {/* Stats cards */}
      <rect x="90" y="150" width="150" height="80" rx="8" fill="url(#cardGradient)" opacity="0.9"/>
      <rect x="260" y="150" width="150" height="80" rx="8" fill="url(#cardGradient)" opacity="0.9"/>
      <rect x="430" y="150" width="150" height="80" rx="8" fill="url(#cardGradient)" opacity="0.9"/>
      <rect x="600" y="150" width="120" height="80" rx="8" fill="url(#cardGradient)" opacity="0.9"/>
      
      {/* Stats content */}
      <text x="105" y="175" fontSize="12" fill="#0f766e" fontWeight="600">Total Feedback</text>
      <text x="105" y="195" fontSize="24" fill="#0f766e" fontWeight="800">12,847</text>
      <text x="105" y="215" fontSize="10" fill="#f59e0b">↗ +23.5%</text>
      
      <text x="275" y="175" fontSize="12" fill="#0f766e" fontWeight="600">Sentiment Score</text>
      <text x="275" y="195" fontSize="24" fill="#0f766e" fontWeight="800">8.4/10</text>
      <text x="275" y="215" fontSize="10" fill="#f59e0b">↗ +0.8</text>
      
      <text x="445" y="175" fontSize="12" fill="#0f766e" fontWeight="600">Response Time</text>
      <text x="445" y="195" fontSize="24" fill="#0f766e" fontWeight="800">2.3h</text>
      <text x="445" y="215" fontSize="10" fill="#f59e0b">↗ -15%</text>
      
      <text x="615" y="175" fontSize="12" fill="#0f766e" fontWeight="600">Categories</text>
      <text x="615" y="195" fontSize="24" fill="#0f766e" fontWeight="800">24</text>
      <text x="615" y="215" fontSize="10" fill="#f59e0b">↗ +3</text>
      
      {/* Chart area */}
      <rect x="90" y="250" width="400" height="160" rx="8" fill="url(#cardGradient)" opacity="0.9"/>
      
      {/* Chart title */}
      <text x="105" y="275" fontSize="14" fill="#0f766e" fontWeight="600">Feedback Trends</text>
      
      {/* Chart bars */}
      <rect x="110" y="350" width="25" height="40" rx="2" fill="url(#chartGradient)"/>
      <rect x="145" y="330" width="25" height="60" rx="2" fill="url(#chartGradient)"/>
      <rect x="180" y="320" width="25" height="70" rx="2" fill="url(#chartGradient)"/>
      <rect x="215" y="340" width="25" height="50" rx="2" fill="url(#chartGradient)"/>
      <rect x="250" y="310" width="25" height="80" rx="2" fill="url(#chartGradient)"/>
      <rect x="285" y="325" width="25" height="65" rx="2" fill="url(#chartGradient)"/>
      <rect x="320" y="305" width="25" height="85" rx="2" fill="url(#chartGradient)"/>
      <rect x="355" y="315" width="25" height="75" rx="2" fill="url(#chartGradient)"/>
      <rect x="390" y="300" width="25" height="90" rx="2" fill="url(#chartGradient)"/>
      <rect x="425" y="320" width="25" height="70" rx="2" fill="url(#chartGradient)"/>
      
      {/* Trend line */}
      <path d="M122 370 L157 350 L192 340 L227 360 L262 330 L297 345 L332 325 L367 335 L402 320 L437 340" 
            stroke="#0f766e" strokeWidth="3" fill="none" opacity="0.8"/>
      
      {/* Pie chart */}
      <circle cx="600" cy="330" r="60" fill="url(#cardGradient)" opacity="0.9"/>
      <text x="600" y="280" fontSize="14" fill="#0f766e" fontWeight="600" textAnchor="middle">Sentiment Distribution</text>
      
      {/* Pie segments */}
      <path d="M 600 270 A 60 60 0 0 1 650 300 L 600 330 Z" fill="#f59e0b" opacity="0.8"/>
      <path d="M 650 300 A 60 60 0 0 1 620 385 L 600 330 Z" fill="#0f766e" opacity="0.8"/>
      <path d="M 620 385 A 60 60 0 0 1 550 300 L 600 330 Z" fill="#d97706" opacity="0.6"/>
      <path d="M 550 300 A 60 60 0 0 1 600 270 L 600 330 Z" fill="#134e4a" opacity="0.4"/>
      
      {/* Pie chart labels */}
      <circle cx="520" cy="360" r="3" fill="#f59e0b"/>
      <text x="530" y="365" fontSize="10" fill="#0f766e">Positive (68%)</text>
      
      <circle cx="520" cy="375" r="3" fill="#0f766e"/>
      <text x="530" y="380" fontSize="10" fill="#0f766e">Neutral (22%)</text>
      
      <circle cx="520" cy="390" r="3" fill="#d97706"/>
      <text x="530" y="395" fontSize="10" fill="#0f766e">Negative (10%)</text>
      
      {/* Floating feedback bubbles */}
      <g opacity="0.6">
        <circle cx="150" cy="100" r="15" fill="#f59e0b" opacity="0.2"/>
        <path d="M142 95c0-4.4 3.6-8 8-8s8 3.6 8 8c0 2-0.7 3.8-1.9 5.2L160 110l-5.2-1.9C152.8 107.1 151 105.5 150 103h-2c-1.7 0-3-1.3-3-3v-5z" fill="#f59e0b" opacity="0.7"/>
        <text x="150" y="100" fontSize="8" fill="white" textAnchor="middle">😊</text>
      </g>
      
      <g opacity="0.6">
        <circle cx="650" cy="120" r="12" fill="#0f766e" opacity="0.2"/>
        <path d="M644 115c0-3.3 2.7-6 6-6s6 2.7 6 6c0 1.5-0.5 2.8-1.4 3.9L658 125l-3.9-1.4C652.8 122.8 651.5 121.5 651 120h-1.5c-1.2 0-2.2-1-2.2-2.2V115z" fill="#0f766e" opacity="0.7"/>
        <text x="650" y="120" fontSize="6" fill="white" textAnchor="middle">📊</text>
      </g>
      
      <g opacity="0.6">
        <circle cx="700" cy="180" r="10" fill="#d97706" opacity="0.2"/>
        <path d="M695 175c0-2.8 2.2-5 5-5s5 2.2 5 5c0 1.2-0.4 2.3-1.1 3.2L707 185l-3.2-1.1C702.3 183.2 701.2 182.1 701 181h-1.2c-1 0-1.8-0.8-1.8-1.8V175z" fill="#d97706" opacity="0.7"/>
        <text x="700" y="180" fontSize="5" fill="white" textAnchor="middle">⚡</text>
      </g>
      
      {/* AI processing indicators */}
      <path d="M760 100l3 6 6 3-6 3-3 6-3-6-6-3 6-3 3-6z" fill="#f59e0b" opacity="0.8"/>
      <path d="M20 200l2 4 4 2-4 2-2 4-2-4-4-2 4-2 2-4z" fill="#f59e0b" opacity="0.7"/>
      <path d="M780 350l2.5 5 5 2.5-5 2.5-2.5 5-2.5-5-5-2.5 5-2.5 2.5-5z" fill="#f59e0b" opacity="0.6"/>
      
      {/* Data connection lines */}
      <path d="M150 120 Q 200 140 250 160" stroke="#0f766e" strokeWidth="1" fill="none" opacity="0.3" strokeDasharray="3,3"/>
      <path d="M650 140 Q 600 160 550 180" stroke="#f59e0b" strokeWidth="1" fill="none" opacity="0.3" strokeDasharray="3,3"/>
      <path d="M700 200 Q 650 220 600 240" stroke="#d97706" strokeWidth="1" fill="none" opacity="0.3" strokeDasharray="3,3"/>
    </svg>
  )
}