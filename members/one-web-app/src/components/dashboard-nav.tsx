"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { Icons } from "@/components/icons";
import { cn } from "@/lib/utils";
import { NavItem } from "@/types";
import { Dispatch, SetStateAction } from "react";
import { Button } from "./ui/button";
import { useRouter } from "next/navigation";

interface DashboardNavProps {
  items: NavItem[];
  setOpen?: Dispatch<SetStateAction<boolean>>;
}

export function DashboardNav({ items, setOpen }: DashboardNavProps) {
  const path = usePathname();
  const router = useRouter()

  if (!items?.length) {
    return null;
  }

  return (
    <nav className="grid items-start gap-1">
      {items.map((item, index) => {
        const Icon = Icons[item.icon || "arrowRight"];
        return (
          item.href && (
            <Button variant={path === item.href ? "default" : "ghost"} className="w-full justify-start h-10"
              key={index}
              // href={item.disabled ? "/" : item.href}
              onClick={() => {
                router.push(item.href + "")
                if (setOpen) setOpen(false);
              }}
            >
              <Icon className="mr-2 h-4 w-4" />
              {item.title}
            </Button>
          )
        );
      })}
    </nav>
  );
}
