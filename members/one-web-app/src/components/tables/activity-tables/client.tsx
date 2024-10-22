"use client";
import { DataTable } from "@/components/ui/data-table";
import { useRouter } from "next/navigation";
import { columns } from "./columns";

interface ProductsClientProps {
  data: UserActivity[];
  hideHeader: boolean
}

export const ActivityHistoryClient: React.FC<ProductsClientProps> = ({ data, hideHeader }) => {
  const router = useRouter();

  return (
    <>
      {!hideHeader && (<div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight">
            Activity history
          </h2>
          <p className="text-sm text-muted-foreground">
            Track your access history and events online with Eartho.
          </p>
        </div>
      </div>)}
      <DataTable searchKey="" columns={columns} data={data} searchEnabled={undefined} />
    </>
  );
};
