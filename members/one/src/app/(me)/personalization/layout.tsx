import { Metadata } from "next";
import Image from "next/image";

import { Separator } from "@/components/ui/separator";
import { SidebarNav } from "./components/sidebar-nav";

const sidebarNavItems = [
  {
    title: "Appearance",
    href: "/personalization",
  },
  {
    title: "Notifications",
    href: "/personalization/notifications",
  },
];

interface SettingsLayoutProps {
  children: React.ReactNode;
}

export default function SettingsLayout({ children }: SettingsLayoutProps) {
  return (
    <>
      <div className="h-screen space-y-6 p-10 pb-0">
       

        <div className="text-center mb-12">
          <h1 className="text-3xl font-semibold mb-2">Personalization</h1>
          <p className="text-gray-500">
            Adjust these settings to help apps provide more personalized and relevant experiences, such as customized themes, notifications, and more.
            Eartho will use this information to ensure a seamless experience across connected apps and services.
          </p>
        </div>

        <div className="flex flex-col space-y-8 lg:flex-row lg:space-x-12 lg:space-y-0 ">
          <aside className="-mx-4 lg:w-1/5">
            <SidebarNav items={sidebarNavItems} />
          </aside>
          <div className="flex-1 lg:max-w-2xl lg:h-[calc(100vh-200px)] p-2 pb-[100px] overflow-y-auto">
            {children}
          </div>
        </div>
      </div>
    </>
  );
}
