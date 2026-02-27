import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Novo Projeto",
};

export default function NovoLayout({ children }: { children: React.ReactNode }) {
  return children;
}
