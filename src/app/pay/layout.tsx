import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Checkout | Checkmate Property",
  description: "Ative sua conta Checkmate Property",
};

export default function PayLayout({ children }: { children: React.ReactNode }) {
  return children;
}
