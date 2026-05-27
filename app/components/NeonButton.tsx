export default function NeonButton({ children, onClick, type = "button", className = "", disabled = false }: { children: React.ReactNode; onClick?: () => void; type?: "button" | "submit" | "reset"; className?: string; disabled?: boolean }) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`relative inline-flex items-center justify-center overflow-hidden rounded-xl bg-primary px-6 py-3 font-orbitron font-medium tracking-wider text-white shadow-md transition-all hover:bg-primary/90 hover:shadow-lg hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    >
      {children}
    </button>
  );
}
