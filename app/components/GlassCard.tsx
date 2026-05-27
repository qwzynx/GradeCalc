export default function GlassCard({ children, className = "", onClick }: { children: React.ReactNode; className?: string; onClick?: () => void }) {
  return (
    <div 
      className={`relative overflow-hidden rounded-2xl border border-surface bg-surface/70 shadow-sm p-6 backdrop-blur-lg backdrop-filter transition-all hover:border-black/10 hover:shadow-lg ${onClick ? 'cursor-pointer' : ''} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
}
