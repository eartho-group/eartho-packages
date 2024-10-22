import BreadCrumb from "@/components/breadcrumb";
import { VirtualIdentityForm } from "@/components/forms/virtual-identity-form";
import { ScrollArea } from "@/components/ui/scroll-area";
import React from "react";

const breadcrumbItems = [
  { title: "Identities", link: "/identities" },
  { title: "Create", link: "/identities/create" },
];

export default function Page() {
  return (
    <ScrollArea className="h-full">
      <div className="flex-1 space-y-4 p-5">
        <BreadCrumb items={breadcrumbItems} />
        <VirtualIdentityForm
          initialData={null}
          key={null}
        />
      </div>
    </ScrollArea>
  );
}
