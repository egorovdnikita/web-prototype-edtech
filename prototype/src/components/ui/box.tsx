import Link, { type LinkProps } from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

// Примитивы Box UI как есть, плюс ссылка в виде кнопки:
// у Box UI <Button> — это <button>, а в прототипе большинство действий — переходы.
export { Badge, Button, Card, Stack, Text } from "@/vendor/box-ui/components";
export type { ButtonSize, ControlAppearance, ControlFamily } from "@/vendor/box-ui/components";

interface ButtonLinkProps extends LinkProps {
  family?: "accent" | "neutral" | "static" | "ghost";
  appearance?: "solid" | "soft" | "outline";
  size?: "xs" | "s" | "m" | "l" | "xl";
  className?: string;
  children: ReactNode;
}

export function ButtonLink({
  family = "accent",
  appearance = "solid",
  size = "m",
  className,
  children,
  ...rest
}: ButtonLinkProps) {
  return (
    <Link
      className={cn("box-button", `box-control--${family}`, `box-button--${size}`, "no-underline", className)}
      data-box-control=""
      data-appearance={appearance}
      data-state="default"
      {...rest}
    >
      {children}
    </Link>
  );
}
