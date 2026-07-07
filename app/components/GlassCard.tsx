export default function GlassCard({ children, className = "", onClick }: { children: React.ReactNode; className?: string; onClick?: () => void }) {
  return (
    <div 
      className={`relative overflow-hidden rounded-2xl border border-black/5 bg-surface/70 shadow-[0_1px_2px_rgba(29,30,38,0.04),0_12px_32px_-18px_rgba(29,30,38,0.22)] p-6 backdrop-blur-lg backdrop-filter transition-all hover:border-black/10 hover:shadow-lg ${onClick ? 'cursor-pointer' : ''} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
}
