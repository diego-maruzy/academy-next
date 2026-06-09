"use client";

import { getAcademyOidcLoginUrl } from "@/lib/auth/academy-entry-url";
import { cn } from "@/lib/utils";

type AcademyAccessLinkProps = {
  className?: string;
  label?: string;
  href?: string;
};

export function AcademyAccessLink({
  className,
  label = "Acessar Academy",
  href = getAcademyOidcLoginUrl(),
}: AcademyAccessLinkProps) {
  return (
    <a href={href} className={cn(className)}>
      {label}
    </a>
  );
}

export function navigateToAcademy(href = getAcademyOidcLoginUrl()) {
  window.location.href = href;
}
