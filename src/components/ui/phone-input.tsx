"use client";

import type { ComponentPropsWithoutRef } from "react";
import { useState } from "react";
import { Input } from "@/components/ui/form-controls";
import { formatUsPhone } from "@/lib/phone-us";
import { cn } from "@/lib/utils";

type PhoneInputProps = Omit<ComponentPropsWithoutRef<"input">, "type" | "onChange" | "value"> & {
  defaultValue?: string;
};

export function PhoneInput({
  className,
  defaultValue = "",
  name,
  ...props
}: PhoneInputProps) {
  const [value, setValue] = useState(formatUsPhone(defaultValue));

  return (
    <Input
      {...props}
      name={name}
      type="tel"
      inputMode="tel"
      autoComplete="tel"
      placeholder="+1 (000) 000-0000"
      value={value}
      className={cn(className)}
      onChange={(event) => {
        setValue(formatUsPhone(event.target.value));
      }}
    />
  );
}
