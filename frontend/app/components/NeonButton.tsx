export default function NeonButton({ children, onClick, type = "button", className = "", disabled = false }: { children: React.ReactNode; onClick?: () => void; type?: "button" | "submit" | "reset"; className?: string; disabled?: boolean }) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`group relative inline-flex items-center justify-center overflow-hidden rounded-md border border-prHighlight bg-primary px-6 py-3 font-orbitron font-medium tracking-wider text-secondary transition-all hover:bg-prHighlight hover:text-white disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    >
      <span className="absolute left-0 top-0 h-[2px] w-0 bg-secondary transition-all duration-300 group-hover:w-full"></span>
      <span className="absolute bottom-0 right-0 h-[2px] w-0 bg-secondary transition-all duration-300 group-hover:w-full"></span>
      {children}
      {/* Glow effect on hover */}
      <div className="absolute inset-0 z-[-1] bg-prHighlight opacity-0 blur-md transition-opacity duration-300 group-hover:opacity-50"></div>
    </button>
  );
}
