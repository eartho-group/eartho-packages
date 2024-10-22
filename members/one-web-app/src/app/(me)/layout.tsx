import { auth, protectAuth } from "@/auth";
import { Header } from "@/components/layout/header";
import Sidebar from "@/components/layout/sidebar";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Eartho | Manage My Access Online",
  description: "",
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await protectAuth();
  const session = await auth();

  if (!session?.user) return null;

  return (
    <>
      <Header session={session} />
      <div className="flex h-screen overflow-hidden">
        <Sidebar />
        <main className="w-full pt-16 overflow-y-auto">
          {children}
        </main>
      </div>
    </>
  );
}
