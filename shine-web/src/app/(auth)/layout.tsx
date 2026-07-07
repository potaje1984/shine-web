import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Authentication | Shine",
  description: "Log in or sign up for Shine",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="flex min-h-dvh items-center justify-center px-4 py-8 sm:py-12">
      <div className="w-full max-w-md">{children}</div>
    </main>
  );
}