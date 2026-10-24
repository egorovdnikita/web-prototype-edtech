import type { Metadata, Viewport } from "next";
import { Raleway } from "next/font/google";

// Порядок важен: Box UI (примитивы → темы → контролы → адаптив → компоненты),
// поверх — бренд-слой ЕНЛ, затем Tailwind.
import "@/vendor/box-ui/css/primitives.css";
import "@/vendor/box-ui/css/theme.css";
import "@/vendor/box-ui/css/controls.css";
import "@/vendor/box-ui/css/adaptive.css";
import "@/vendor/box-ui/css/components.css";
import "@/styles/enl.css";
import "./globals.css";

const raleway = Raleway({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-raleway",
  display: "swap",
});

export const metadata: Metadata = {
  title: "ЕГЭ налегке — прототип платформы",
  description: "Кликабельный прототип кабинета ученика",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#fffbef",
};

// Моды Box UI для всего документа. Предмет (data-accent) ставит layout предмета,
// data-device не ставим: adaptive.css сам включает Mobile ниже 768px.
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="ru"
      data-theme="light"
      data-radius="high"
      data-font="enl"
      data-icon-style="linear"
      className={raleway.variable}
    >
      <body className="min-h-dvh antialiased">{children}</body>
    </html>
  );
}
