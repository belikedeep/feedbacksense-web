export default function TestimonialAvatar({ className = "w-12 h-12", name = "User" }) {
  // Generate a consistent color based on the name
  const colors = [
    { bg: '#0f766e', text: '#ffffff' },
    { bg: '#f59e0b', text: '#ffffff' },
    { bg: '#134e4a', text: '#ffffff' },
    { bg: '#d97706', text: '#ffffff' },
    { bg: '#0d9488', text: '#ffffff' }
  ];
  
  const colorIndex = name.length % colors.length;
  const color = colors[colorIndex];
  const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  
  return (
    <svg className={className} viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id={`avatarGradient-${name}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={color.bg}/>
          <stop offset="100%" stopColor={color.bg} stopOpacity="0.8"/>
        </linearGradient>
      </defs>
      
      {/* Background circle */}
      <circle cx="30" cy="30" r="30" fill={`url(#avatarGradient-${name})`}/>
      
      {/* Subtle pattern overlay */}
      <circle cx="30" cy="30" r="28" fill="none" stroke="white" strokeWidth="0.5" opacity="0.2"/>
      <circle cx="30" cy="30" r="25" fill="none" stroke="white" strokeWidth="0.3" opacity="0.1"/>
      
      {/* Initials */}
      <text 
        x="30" 
        y="30" 
        textAnchor="middle" 
        dominantBaseline="central" 
        fontSize="18" 
        fontWeight="600" 
        fill={color.text}
        fontFamily="system-ui, -apple-system, sans-serif"
      >
        {initials}
      </text>
      
      {/* Subtle highlight */}
      <circle cx="22" cy="22" r="3" fill="white" opacity="0.2"/>
    </svg>
  )
}