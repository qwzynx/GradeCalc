export default function NeonButton({ children, onClick, type = "button", className = "", disabled = false }: { children: React.ReactNode; onClick?: () => void; type?: "button" | "submit" | "reset"; className?: string; disabled?: boolean }) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`relative inline-flex items-center justify-center overflow-hidden rounded-xl bg-primary px-5 py-2.5 sm:px-6 sm:py-3 min-h-[44px] font-orbitron font-medium tracking-wider text-white shadow-md transition-all hover:bg-primary/90 hover:shadow-lg active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    >
      {children}
    </button>
  );
}
