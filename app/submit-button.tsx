"use client";

import { useFormStatus } from "react-dom";

// Botão de formulário com estado de carregamento. Reutilizado em todas as ações.
export default function SubmitButton({
  children,
  className = "",
  label,
}: {
  children: React.ReactNode;
  className?: string;
  label?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button className={className} disabled={pending} aria-label={label} aria-busy={pending}>
      {pending ? <span className="spin" aria-hidden /> : children}
    </button>
  );
}
