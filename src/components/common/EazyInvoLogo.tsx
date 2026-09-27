import React from "react";
import { cn } from "@/lib/utils";

interface EazyInvoLogoProps {
  className?: string;
  collapsed?: boolean;
  size?: "sm" | "md" | "lg";
}

export function EazyInvoLogo({ className, collapsed = false, size = "md" }: EazyInvoLogoProps) {
  const iconSizes = {
    sm: "w-7 h-7",
    md: "w-9 h-9",
    lg: "w-11 h-11",
  };

  const textSizes = {
    sm: "text-base",
    md: "text-lg",
    lg: "text-xl",
  };

  return (
    <div className={cn("flex items-center gap-2.5 select-none", className)}>
      {/* Green Isometric Box Icon with Receipt */}
      <div className={cn("relative shrink-0 flex items-center justify-center drop-shadow-sm", iconSizes[size])}>
        <svg
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
        >
          {/* Isometric Box Top Face */}
          <path
            d="M50 12 L84 28 L50 44 L16 28 Z"
            fill="#34D399"
          />
          {/* Isometric Box Left Face */}
          <path
            d="M16 28 L50 44 L50 82 L16 66 Z"
            fill="#10B981"
          />
          {/* Isometric Box Right Face */}
          <path
            d="M50 44 L84 28 L84 66 L50 82 Z"
            fill="#059669"
          />
          {/* Box Seam Line */}
          <path
            d="M50 12 L50 44"
            stroke="#047857"
            strokeWidth="3"
            strokeLinecap="round"
            opacity="0.6"
          />
          {/* Receipt / Invoice Tag Attachment */}
          <g transform="translate(48, 38)">
            <rect
              x="0"
              y="0"
              width="32"
              height="44"
              rx="4"
              fill="#ECFDF5"
              stroke="#047857"
              strokeWidth="4"
            />
            {/* Bottom serrated edge */}
            <path
              d="M0 40 L5 44 L10 40 L15 44 L20 40 L25 44 L30 40 L32 40 L32 0 L0 0 Z"
              fill="#ECFDF5"
            />
            {/* Invoice Line Items */}
            <line x1="7" y1="10" x2="25" y2="10" stroke="#10B981" strokeWidth="3" strokeLinecap="round" />
            <line x1="7" y1="18" x2="20" y2="18" stroke="#10B981" strokeWidth="3" strokeLinecap="round" />
            <line x1="7" y1="26" x2="24" y2="26" stroke="#10B981" strokeWidth="3" strokeLinecap="round" />
          </g>
        </svg>
      </div>

      {/* Brand Text: EazyInvo */}
      {!collapsed && (
        <div className="flex flex-col leading-none">
          <span className={cn("font-black tracking-tight text-foreground font-sans flex items-center gap-0.5", textSizes[size])}>
            Eazy<span className="text-emerald-600 dark:text-emerald-400">Invo</span>
          </span>
          <span className="text-[10px] text-muted-foreground font-medium mt-0.5 tracking-wider uppercase">
            CRM & Billing
          </span>
        </div>
      )}
    </div>
  );
}
