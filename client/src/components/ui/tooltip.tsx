import * as React from "react";

type TooltipProviderProps = {
  children: React.ReactNode;
};
export function TooltipProvider({ children }: TooltipProviderProps) {
  return <>{children}</>;
}

type TooltipProps = {
  children: React.ReactNode;
};
export function Tooltip({ children }: TooltipProps) {
  return <>{children}</>;
}

type TooltipTriggerProps = {
  children: React.ReactNode;
  asChild?: boolean;
};
export function TooltipTrigger({ children }: TooltipTriggerProps) {
  return <>{children}</>;
}

type TooltipContentProps = React.HTMLAttributes<HTMLDivElement> & {
  side?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
};
export function TooltipContent({ children, ...props }: TooltipContentProps) {
  return (
    <div {...props} style={{ display: "none" }}>
      {children}
    </div>
  );
}
