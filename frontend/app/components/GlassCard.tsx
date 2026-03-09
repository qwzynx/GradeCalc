export default function GlassCard({ children, className = "", onClick }: { children: React.ReactNode; className?: string; onClick?: () => void }) {
  return (
    <div 
      className={`relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-lg backdrop-filter transition-all hover:border-prHighlight hover:bg-white/10 hover:shadow-[0_0_20px_rgba(48,39,56,0.5)] ${onClick ? 'cursor-pointer' : ''} ${className}`}
      onClick={onClick}
    >
      {/* Decorative pseudo-neon glow lines (top and left) */}
      <div className="absolute top-0 left-0 h-px w-full bg-linear-to-r from-transparent via-prHighlight to-transparent opacity-50"></div>
      <div className="absolute top-0 left-0 h-full w-px bg-linear-to-b from-transparent via-prHighlight to-transparent opacity-50"></div>
      
      {children}
    </div>
  );
}
