import React from 'react';

export const Logo = ({ className = "w-10 h-10", color = "currentColor" }: { className?: string, color?: string }) => (
  <svg 
    viewBox="0 0 100 100" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg" 
    className={className}
  >
    {/* Background Circle/Square with rounded corners */}
    <rect width="100" height="100" rx="24" fill={color} fillOpacity="0.1" />
    
    {/* Stylized Minimalist Y */}
    <path 
      d="M30 25L50 55L70 25" 
      stroke={color} 
      strokeWidth="12" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
    />
    <path 
      d="M50 55V80" 
      stroke={color} 
      strokeWidth="12" 
      strokeLinecap="round" 
    />
    
    {/* Accent dot or line to represent POS/Growth */}
    <circle cx="75" cy="75" r="8" fill={color} />
  </svg>
);

export const LogoFull = ({ className = "h-10", color = "currentColor" }: { className?: string, color?: string }) => (
  <div className={`flex items-center gap-3 ${className}`}>
    <Logo className="w-8 h-8" color={color} />
    <span className="font-black text-2xl tracking-tighter" style={{ color }}>
      Yusra<span className="opacity-70">POS</span>
    </span>
  </div>
);
