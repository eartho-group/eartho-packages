"use client";
import { ColumnDef } from "@tanstack/react-table";
import { CellAction } from "./cell-action";
import { Checkbox } from "@/components/ui/checkbox";
import { toTitleCase } from "@/lib/extension/string";


export const columns: ColumnDef<UserActivity>[] = [
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
    accessorFn: (row) => toTitleCase(row.type),
    id: "type",
    header: "Type",
  },
  {
    accessorFn: (row) => row.data.entity?.title,
    id: "entityTitle",
    header: "Where",
  },
  // {
  //   accessorFn: (row) => row.data.access.metadata?.title,
  //   id: "accessId",
  //   header: "Access ID",
  // },
  {
    accessorFn: (row) => toTitleCase(row.data.status),
    id: "status",
    header: "Status",
  },
  {
    accessorFn: (row) => new Date(row.data.startTime).toLocaleString(),
    id: "startTime",
    header: "Start Time",
  },
  {
    id: "actions",
    cell: ({ row }) => <CellAction data={row.original} />,
  },
];
