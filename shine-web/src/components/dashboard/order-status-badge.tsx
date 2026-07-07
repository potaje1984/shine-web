"use client";

/**
 * OrderStatusBadge.tsx
 * Badge de estado con colores según la configuración.
 */

import { Badge } from "@/components/ui/badge";
import { ORDER_STATUS_CONFIG } from "@/lib/constants";
import type { OrderStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

interface OrderStatusBadgeProps {
  status: OrderStatus;
  className?: string;
}

export function OrderStatusBadge({ status, className }: OrderStatusBadgeProps) {
  const config = ORDER_STATUS_CONFIG[status];
  return (
    <Badge
      variant="outline"
      className={cn(
        "border-0 text-xs font-medium",
        config.bg,
        config.color,
        className
      )}
    >
      {config.label}
    </Badge>
  );
}