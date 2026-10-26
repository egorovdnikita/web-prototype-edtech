import type { Metadata, Viewport } from "next";
import { Inter_Tight, Raleway } from "next/font/google";
import { FONT } from "@/lib/style";

// Порядок важен: Box UI (примитивы → темы → контролы → адаптив → компоненты),
// поверх — бренд-слой ЕНЛ, затем Tailwind.
import "@/vendor/box-ui/css/primitives.css";
import "@/vendor/box-ui/css/theme.css";
import "@/vendor/box-ui/css/controls.css";
import "@/vendor/box-ui/css/adaptive.css";
import "@/vendor/box-ui/css/components.css";
import "@/styles/enl.css";
import "./globals.css";

// Inter Tight — мода Brand · Typography «inter-tight». Raleway — шрифт стиля ЕНЛ,
// без предзагрузки: нужен, только если вернуть FONT = "enl".
const interTight = Inter_Tight({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-inter-tight",
  display: "swap",
});

const raleway = Raleway({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-raleway",
  display: "swap",
  preload: false,
});

export const metadata: Metadata = {
  title: "ЕГЭ налегке — прототип платформы",
  description: "Кликабельный прототип кабинета ученика",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#ffffff",
};

// Моды Box UI для всего документа. Предмет (data-accent) ставит layout предмета,
// data-device не ставим: adaptive.css сам включает Mobile ниже 768px.
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="ru"
      data-theme="light"
      data-radius="high"
      data-font={FONT}
      data-icon-style="linear"
      className={`${interTight.variable} ${raleway.variable}`}
    >
      <body className="min-h-dvh antialiased">{children}</body>
    </html>
  );
}
