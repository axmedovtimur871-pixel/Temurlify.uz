"use client";

import Link from "next/link";
import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ComponentProps, ReactNode } from "react";

const base =
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[10px] font-medium transition-[background,color,box-shadow,transform] duration-150 active:translate-y-px disabled:pointer-events-none disabled:opacity-50 select-none";

const variants = {
  primary: "bg-brand text-brand-ink hover:bg-brand-hover shadow-[inset_0_-1px_0_rgb(0_0_0/0.15)]",
  secondary: "bg-surface text-ink border border-line-strong hover:bg-surface-2 shadow-[var(--shadow-sm)]",
  ghost: "text-ink-2 hover:bg-sunken hover:text-ink",
  soft: "bg-brand-soft text-brand hover:bg-brand-soft/70",
  danger: "bg-danger text-white hover:opacity-90",
  ink: "bg-ink text-paper hover:opacity-90",
};
const sizes = {
  sm: "h-8 px-3 text-[13px]",
  md: "h-10 px-4 text-sm",
  lg: "h-12 px-5 text-[15px]",
  icon: "size-9",
};

export type ButtonVariant = keyof typeof variants;
type Common = { variant?: ButtonVariant; size?: keyof typeof sizes; className?: string };

export const buttonClass = ({ variant = "primary", size = "md", className }: Common = {}) =>
  cn(base, variants[variant], sizes[size], className);

export function Button({ variant, size, className, ...props }: Common & ComponentProps<"button">) {
  return <button className={buttonClass({ variant, size, className })} {...props} />;
}

export function LinkButton({ variant, size, className, ...props }: Common & ComponentProps<typeof Link>) {
  return <Link className={buttonClass({ variant, size, className })} {...props} />;
}

/** Submit button that shows a spinner while its parent form action runs. */
export function SubmitButton({
  children, pendingText, variant, size, className, ...props
}: Common & ComponentProps<"button"> & { pendingText?: ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending || props.disabled} className={buttonClass({ variant, size, className })} {...props}>
      {pending && <Loader2 className="size-4 animate-spin" />}
      {pending && pendingText ? pendingText : children}
    </button>
  );
}
