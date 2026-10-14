import type { Metadata } from "next";
import "@fontsource/inter/700.css";
import "@fontsource/montserrat/400.css";
import "@fontsource/montserrat/500.css";
import "@fontsource/montserrat/600.css";
import "@fontsource/montserrat/700.css";
import "@fontsource/montserrat/800.css";
import "./globals.css";
import { OrderFlowProvider } from "@/components/order/OrderFlowProvider";
import { MotionProvider } from "@/components/ui/MotionProvider";

export const metadata: Metadata = {
  title: {
    default: "Regi-Tech Motorcycle Number Plates",
    template: "%s | Regi-Tech",
  },
  description: "Premium personalised motorcycle number plates from Regi-Tech.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html data-scroll-behavior="smooth" lang="en-GB">
      <body><MotionProvider><OrderFlowProvider>{children}</OrderFlowProvider></MotionProvider></body>
    </html>
  );
}
