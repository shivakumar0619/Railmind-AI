import { DISCLAIMER_TEXT } from "../../lib/utils";

export function Footer() {
  return (
    <footer className="flex shrink-0 items-center justify-center border-t border-border-primary bg-bg-surface px-4 py-1.5">
      <p className="text-center text-[10px] leading-tight text-text-muted">
        {DISCLAIMER_TEXT}
      </p>
    </footer>
  );
}
