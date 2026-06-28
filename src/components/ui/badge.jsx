import * as React from "react";
import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils";

// Variants include the status colours used across the dashboard, matched to Figma.
const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold tracking-wide transition-colors",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground",
        secondary: "bg-secondary text-secondary-foreground",
        outline: "border border-border text-foreground",
        ok: "bg-[#E8F5EC] text-[#2E7D32]",
        warn: "bg-[#FFF3E0] text-[#D9480F]",
        info: "bg-[#E7F0FB] text-[#1565C0]",
        muted: "bg-[#F3F4F6] text-[#5F5F5F]",
        danger: "bg-[#FCE9E4] text-[#B11226]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

function Badge({ className, variant, ...props }) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
