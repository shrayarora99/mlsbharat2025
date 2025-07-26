import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { CheckCircle } from "lucide-react";

interface VerificationBadgeProps {
  isVerified: boolean;
  reraId?: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function VerificationBadge({ isVerified, reraId, size = "sm", className = "" }: VerificationBadgeProps) {
  if (!isVerified || !reraId) {
    return null;
  }

  const sizeClasses = {
    sm: "text-xs px-2 py-1",
    md: "text-sm px-3 py-1.5",
    lg: "text-base px-4 py-2"
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge 
            className={`bg-green-100 text-green-800 border border-green-200 hover:bg-green-200 transition-colors cursor-help flex items-center gap-1 ${sizeClasses[size]} ${className}`}
          >
            <CheckCircle className="w-3 h-3" />
            RERA Verified
          </Badge>
        </TooltipTrigger>
        <TooltipContent side="top" className="bg-gray-900 text-white text-sm p-2 rounded">
          <p>This broker's RERA ID has been verified by MLSBharat</p>
          <p className="text-xs text-gray-300 mt-1">ID: {reraId}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}