"use client";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { Heading } from "@/components/ui/heading";
import { Separator } from "@/components/ui/separator";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { columns } from "./columns";

interface ConnectionClientProps {
  data: Connection[];
}

export const ConnectionClient: React.FC<ConnectionClientProps> = ({ data }) => {
  const router = useRouter();

  return (
    <>
      <DataTable searchEnabled={false} columns={columns} data={data} searchKey={undefined} />
    </>
  );
};
