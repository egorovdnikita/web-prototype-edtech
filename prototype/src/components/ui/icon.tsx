import type { SVGProps } from "react";
import icons from "@/vendor/box-ui/icons.json";
import { ICON } from "@/lib/style";

// Облегчённый <Icon> Box UI: тот же API, но только иконки из scripts/icons.json.
// Новая иконка — добавить имя туда и запустить `npm run sync:box-ui`.
// Набор задаёт мода Brand · Icon (src/lib/style.ts). variant — акцент состояния
// (активное, сделанное): работает только в контурном наборе, в «bold» залиты все.

type Style = keyof typeof icons;
export type IconName = keyof (typeof icons)["linear"];
export type IconSize = "min" | "2xs" | "xs" | "s" | "m" | "l" | "xl" | "2xl" | "max";

interface IconProps extends Omit<SVGProps<SVGSVGElement>, "name"> {
  name: IconName;
  variant?: Style;
  size?: IconSize;
  title?: string;
}

// Стрелки — навигация, а не смысл: всегда контурные, чтобы не спорить с текстом.
const setOf = (name: IconName, variant: Style): Style =>
  name.includes("arrow") ? "linear" : ICON === "linear" ? variant : ICON;

export function Icon({ name, variant = "linear", size = "xs", title, style, ...rest }: IconProps) {
  const box = `var(--size-${size})`;
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      focusable="false"
      data-icon={name}
      style={{ display: "block", flex: "none", width: box, height: box, ...style }}
      dangerouslySetInnerHTML={{ __html: icons[setOf(name, variant)][name] }}
      {...rest}
    />
  );
}
