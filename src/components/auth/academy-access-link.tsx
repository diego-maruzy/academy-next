"use client";

import { cn } from "@/lib/utils";

type AcademyAccessLinkProps = {
  className?: string;
  label?: string;
  href?: string;
};

export function AcademyAccessLink({
  className,
  label = "Acessar Academy",
  href = "/login",
}: AcademyAccessLinkProps) {
  return (
    <a href={href} className={cn(className)}>
      {label}
    </a>
  );
}

export function navigateToAcademy(href = "/login") {
  window.location.href = href;
}
