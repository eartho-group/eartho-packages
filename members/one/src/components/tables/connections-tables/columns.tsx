"use client";
import { ColumnDef } from "@tanstack/react-table";
import { CellAction } from "./cell-action";
import { Checkbox } from "@/components/ui/checkbox";
import { toTitleCase } from "@/lib/extension/string";


export const columns: ColumnDef<Connection>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected()}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "displayName",
    accessorFn: info => info.account.displayName,
    header: "NAME",
  },
  {
    accessorKey: "entity.title",
    header: "ENTITY",
  },
  {
    accessorKey: "role",
    accessorFn: info => toTitleCase(info.role),
    header: "ROLE",
  },
  {
    accessorKey: "status",
    accessorFn: info => toTitleCase(info.status),
    header: "STATUS",
  },
  {
    id: "actions",
    cell: ({ row }) => <CellAction data={row.original} />,
  },
];
