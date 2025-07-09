export default function BrandLogo({ className = "w-8 h-8" }) {
  return (
    <svg className={className} viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Background circle */}
      <circle cx="30" cy="30" r="25" fill="currentColor" opacity="0.1"/>
      
      {/* Main icon - feedback bubble with AI sparkles */}
      <path 
        d="M15 25c0-7.18 5.82-13 13-13s13 5.82 13 13c0 3.19-1.16 6.1-3.08 8.36L41 42l-8.36-3.08C30.39 37.16 27.19 36 24 36h-4c-2.76 0-5-2.24-5-5v-6z" 
        fill="currentColor"
      />
      
      {/* Sparkle 1 - AI indicator */}
      <path 
        d="M43 18l2 4 4 2-4 2-2 4-2-4-4-2 4-2 2-4z" 
        fill="#f59e0b"
      />
      
      {/* Sparkle 2 */}
      <path 
        d="M11 11l1.5 3 3 1.5-3 1.5L11 20l-1.5-3L6 15.5l3-1.5L11 11z" 
        fill="#f59e0b"
      />
      
      {/* Data dots inside bubble */}
      <circle cx="22" cy="22" r="1.5" fill="white" opacity="0.8"/>
      <circle cx="28" cy="22" r="1.5" fill="white" opacity="0.8"/>
      <circle cx="34" cy="22" r="1.5" fill="white" opacity="0.8"/>
      <circle cx="25" cy="28" r="1.5" fill="white" opacity="0.6"/>
      <circle cx="31" cy="28" r="1.5" fill="white" opacity="0.6"/>
    </svg>
  )
}