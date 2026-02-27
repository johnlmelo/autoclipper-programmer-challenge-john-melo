import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Acompanhamento de Render",
};

export default function WaitingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
