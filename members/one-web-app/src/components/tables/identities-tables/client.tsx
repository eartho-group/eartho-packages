"use client";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { Heading } from "@/components/ui/heading";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { columns } from "./columns";

interface IdentityClientProps {
  data: VirtualIdentity[];
}

export const IdentityClient: React.FC<IdentityClientProps> = ({ data }) => {
  const router = useRouter();

  return (
    <>
      <div className="flex items-start justify-between">
        <Heading
          title=""
          description=""
        />
        <Button
          className="text-xs md:text-sm"
          onClick={() => router.push(`/identities/virtual/new`)}
        >
          <Plus className="mr-2 h-4 w-4" /> Add New
        </Button>
      </div>
      <div className="mt-4 mb-4" />
      <DataTable searchKey="" columns={columns} data={data} searchEnabled={true} />
    </>
  );
};
