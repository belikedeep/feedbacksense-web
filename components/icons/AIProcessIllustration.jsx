export default function AIProcessIllustration({ className = "w-full h-80" }) {
  return (
    <svg className={className} viewBox="0 0 900 400" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="aiProcessBg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0f766e" stopOpacity="0.1"/>
          <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.05"/>
        </linearGradient>
        <linearGradient id="feedbackGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f59e0b"/>
          <stop offset="100%" stopColor="#d97706"/>
        </linearGradient>
        <linearGradient id="aiGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0f766e"/>
          <stop offset="100%" stopColor="#134e4a"/>
        </linearGradient>
        <linearGradient id="insightGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f59e0b"/>
          <stop offset="100%" stopColor="#0f766e"/>
        </linearGradient>
      </defs>
      
      {/* Background */}
      <rect width="100%" height="100%" fill="url(#aiProcessBg)"/>
      
      {/* Step 1: Raw Feedback Input */}
      <g transform="translate(50, 50)">
        {/* Input container */}
        <rect x="0" y="50" width="200" height="250" rx="15" fill="url(#feedbackGradient)" opacity="0.1"/>
        <text x="100" y="40" fontSize="16" fill="#0f766e" fontWeight="700" textAnchor="middle">Raw Feedback</text>
        
        {/* Feedback bubbles */}
        <g opacity="0.8">
          <circle cx="50" cy="80" r="25" fill="#f59e0b" opacity="0.2"/>
          <path d="M35 75c0-8.3 6.7-15 15-15s15 6.7 15 15c0 3.7-1.3 7-3.5 9.6L65 100l-9.6-3.5C52.3 95.0 50.7 92.0 50 88h-4.5c-3.3 0-6-2.7-6-6v-7z" fill="#f59e0b" opacity="0.7"/>
          <text x="50" y="82" fontSize="10" fill="white" textAnchor="middle" fontWeight="600">"Great!"</text>
        </g>
        
        <g opacity="0.8">
          <circle cx="150" cy="100" r="30" fill="#d97706" opacity="0.2"/>
          <path d="M130 95c0-11 9-20 20-20s20 9 20 20c0 4.9-1.8 9.4-4.7 12.8L175 125l-12.8-4.7C158.8 118.5 156.2 115.0 155 110h-6c-4.4 0-8-3.6-8-8v-7z" fill="#d97706" opacity="0.7"/>
          <text x="150" y="100" fontSize="8" fill="white" textAnchor="middle" fontWeight="600">"Slow delivery"</text>
        </g>
        
        <g opacity="0.8">
          <circle cx="75" cy="150" r="20" fill="#f59e0b" opacity="0.2"/>
          <path d="M62 145c0-7.2 5.8-13 13-13s13 5.8 13 13c0 3.2-1.2 6.1-3.1 8.3L88 165l-8.3-3.1C77.2 160.8 75.8 158.5 75 156h-3.9c-2.9 0-5.2-2.3-5.2-5.2v-5.8z" fill="#f59e0b" opacity="0.7"/>
          <text x="75" y="152" fontSize="9" fill="white" textAnchor="middle" fontWeight="600">"Love it!"</text>
        </g>
        
        <g opacity="0.8">
          <circle cx="125" cy="180" r="22" fill="#0f766e" opacity="0.2"/>
          <path d="M110 175c0-8.3 6.7-15 15-15s15 6.7 15 15c0 3.7-1.3 7-3.5 9.6L140 200l-9.6-3.5C127.3 195.0 125.7 192.0 125 188h-4.5c-3.3 0-6-2.7-6-6v-7z" fill="#0f766e" opacity="0.7"/>
          <text x="125" y="180" fontSize="8" fill="white" textAnchor="middle" fontWeight="600">"Confusing UI"</text>
        </g>
        
        <g opacity="0.8">
          <circle cx="50" cy="220" r="18" fill="#f59e0b" opacity="0.2"/>
          <path d="M37 215c0-7.2 5.8-13 13-13s13 5.8 13 13c0 3.2-1.2 6.1-3.1 8.3L63 235l-8.3-3.1C52.2 230.8 50.8 228.5 50 226h-3.9c-2.9 0-5.2-2.3-5.2-5.2v-5.8z" fill="#f59e0b" opacity="0.7"/>
          <text x="50" y="222" fontSize="9" fill="white" textAnchor="middle" fontWeight="600">"Perfect!"</text>
        </g>
        
        <g opacity="0.8">
          <circle cx="150" cy="250" r="25" fill="#d97706" opacity="0.2"/>
          <path d="M135 245c0-8.3 6.7-15 15-15s15 6.7 15 15c0 3.7-1.3 7-3.5 9.6L165 270l-9.6-3.5C152.3 265.0 150.7 262.0 150 258h-4.5c-3.3 0-6-2.7-6-6v-7z" fill="#d97706" opacity="0.7"/>
          <text x="150" y="248" fontSize="8" fill="white" textAnchor="middle" fontWeight="600">"Too expensive"</text>
        </g>
      </g>
      
      {/* Arrow 1 */}
      <g transform="translate(280, 150)">
        <path d="M0 50 L60 50 M45 35 L60 50 L45 65" stroke="#0f766e" strokeWidth="4" fill="none"/>
        <text x="30" y="35" fontSize="12" fill="#0f766e" fontWeight="600" textAnchor="middle">Process</text>
      </g>
      
      {/* Step 2: AI Brain Processing */}
      <g transform="translate(350, 100)">
        <rect x="0" y="0" width="200" height="200" rx="15" fill="url(#aiGradient)" opacity="0.1"/>
        <text x="100" y="-10" fontSize="16" fill="#0f766e" fontWeight="700" textAnchor="middle">AI Analysis</text>
        
        {/* AI Brain */}
        <circle cx="100" cy="100" r="80" fill="url(#aiGradient)" opacity="0.2"/>
        
        {/* Neural network */}
        <g stroke="#0f766e" strokeWidth="2" fill="none" opacity="0.6">
          <path d="M50 70 Q 75 50 100 70 Q 125 50 150 70"/>
          <path d="M50 130 Q 75 150 100 130 Q 125 150 150 130"/>
          <path d="M70 50 Q 100 75 130 50"/>
          <path d="M70 150 Q 100 125 130 150"/>
        </g>
        
        {/* Neural nodes */}
        <g fill="#0f766e" opacity="0.8">
          <circle cx="50" cy="70" r="4"/>
          <circle cx="100" cy="70" r="4"/>
          <circle cx="150" cy="70" r="4"/>
          <circle cx="50" cy="130" r="4"/>
          <circle cx="100" cy="130" r="4"/>
          <circle cx="150" cy="130" r="4"/>
          <circle cx="70" cy="50" r="3"/>
          <circle cx="130" cy="50" r="3"/>
          <circle cx="70" cy="150" r="3"/>
          <circle cx="130" cy="150" r="3"/>
        </g>
        
        {/* Central processor */}
        <circle cx="100" cy="100" r="15" fill="#f59e0b" opacity="0.8"/>
        <circle cx="100" cy="100" r="8" fill="#f59e0b"/>
        <text x="100" y="105" fontSize="8" fill="white" textAnchor="middle" fontWeight="700">AI</text>
        
        {/* Processing sparkles */}
        <g fill="#f59e0b" opacity="0.7">
          <path d="M30 30l3 6 6 3-6 3-3 6-3-6-6-3 6-3 3-6z"/>
          <path d="M170 30l2 4 4 2-4 2-2 4-2-4-4-2 4-2 2-4z"/>
          <path d="M170 170l3 6 6 3-6 3-3 6-3-6-6-3 6-3 3-6z"/>
          <path d="M30 170l2 4 4 2-4 2-2 4-2-4-4-2 4-2 2-4z"/>
        </g>
        
        {/* Processing indicators */}
        <g opacity="0.5">
          <circle cx="85" cy="85" r="2" fill="#f59e0b">
            <animate attributeName="opacity" values="0.3;1;0.3" dur="1.5s" repeatCount="indefinite"/>
          </circle>
          <circle cx="115" cy="85" r="2" fill="#f59e0b">
            <animate attributeName="opacity" values="1;0.3;1" dur="1.5s" repeatCount="indefinite"/>
          </circle>
          <circle cx="85" cy="115" r="2" fill="#f59e0b">
            <animate attributeName="opacity" values="0.3;1;0.3" dur="2s" repeatCount="indefinite"/>
          </circle>
          <circle cx="115" cy="115" r="2" fill="#f59e0b">
            <animate attributeName="opacity" values="1;0.3;1" dur="2s" repeatCount="indefinite"/>
          </circle>
        </g>
      </g>
      
      {/* Arrow 2 */}
      <g transform="translate(580, 150)">
        <path d="M0 50 L60 50 M45 35 L60 50 L45 65" stroke="#0f766e" strokeWidth="4" fill="none"/>
        <text x="30" y="35" fontSize="12" fill="#0f766e" fontWeight="600" textAnchor="middle">Generate</text>
      </g>
      
      {/* Step 3: Insights Output */}
      <g transform="translate(650, 50)">
        <rect x="0" y="50" width="200" height="250" rx="15" fill="url(#insightGradient)" opacity="0.1"/>
        <text x="100" y="40" fontSize="16" fill="#0f766e" fontWeight="700" textAnchor="middle">Actionable Insights</text>
        
        {/* Insight cards */}
        <g opacity="0.9">
          <rect x="20" y="70" width="160" height="35" rx="8" fill="#0f766e" opacity="0.8"/>
          <text x="30" y="85" fontSize="10" fill="white" fontWeight="600">😊 68% Positive Sentiment</text>
          <text x="30" y="98" fontSize="8" fill="#f5f5f4">Customer satisfaction is high</text>
        </g>
        
        <g opacity="0.9">
          <rect x="20" y="115" width="160" height="35" rx="8" fill="#f59e0b" opacity="0.8"/>
          <text x="30" y="130" fontSize="10" fill="white" fontWeight="600">⚠️ Delivery Issues Found</text>
          <text x="30" y="143" fontSize="8" fill="#f5f5f4">23% mention slow delivery</text>
        </g>
        
        <g opacity="0.9">
          <rect x="20" y="160" width="160" height="35" rx="8" fill="#0f766e" opacity="0.8"/>
          <text x="30" y="175" fontSize="10" fill="white" fontWeight="600">💡 UI Needs Improvement</text>
          <text x="30" y="188" fontSize="8" fill="#f5f5f4">15% find interface confusing</text>
        </g>
        
        <g opacity="0.9">
          <rect x="20" y="205" width="160" height="35" rx="8" fill="#d97706" opacity="0.8"/>
          <text x="30" y="220" fontSize="10" fill="white" fontWeight="600">💰 Pricing Concerns</text>
          <text x="30" y="233" fontSize="8" fill="#f5f5f4">12% mention high cost</text>
        </g>
        
        <g opacity="0.9">
          <rect x="20" y="250" width="160" height="35" rx="8" fill="#0f766e" opacity="0.8"/>
          <text x="30" y="265" fontSize="10" fill="white" fontWeight="600">📈 Trending Positive</text>
          <text x="30" y="278" fontSize="8" fill="#f5f5f4">+15% improvement this month</text>
        </g>
      </g>
      
      {/* Data flow particles */}
      <g opacity="0.4">
        <circle cx="260" cy="120" r="2" fill="#f59e0b">
          <animate attributeName="cx" values="260;340" dur="3s" repeatCount="indefinite"/>
          <animate attributeName="opacity" values="1;0" dur="3s" repeatCount="indefinite"/>
        </circle>
        <circle cx="260" cy="140" r="2" fill="#0f766e">
          <animate attributeName="cx" values="260;340" dur="2.5s" repeatCount="indefinite" begin="0.5s"/>
          <animate attributeName="opacity" values="1;0" dur="2.5s" repeatCount="indefinite" begin="0.5s"/>
        </circle>
        <circle cx="260" cy="160" r="2" fill="#d97706">
          <animate attributeName="cx" values="260;340" dur="3.5s" repeatCount="indefinite" begin="1s"/>
          <animate attributeName="opacity" values="1;0" dur="3.5s" repeatCount="indefinite" begin="1s"/>
        </circle>
        
        <circle cx="560" cy="120" r="2" fill="#f59e0b">
          <animate attributeName="cx" values="560;640" dur="2s" repeatCount="indefinite"/>
          <animate attributeName="opacity" values="1;0" dur="2s" repeatCount="indefinite"/>
        </circle>
        <circle cx="560" cy="140" r="2" fill="#0f766e">
          <animate attributeName="cx" values="560;640" dur="2.2s" repeatCount="indefinite" begin="0.3s"/>
          <animate attributeName="opacity" values="1;0" dur="2.2s" repeatCount="indefinite" begin="0.3s"/>
        </circle>
        <circle cx="560" cy="160" r="2" fill="#d97706">
          <animate attributeName="cx" values="560;640" dur="2.8s" repeatCount="indefinite" begin="0.8s"/>
          <animate attributeName="opacity" values="1;0" dur="2.8s" repeatCount="indefinite" begin="0.8s"/>
        </circle>
      </g>
    </svg>
  )
}