export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse bg-line/70 ${className}`} />
}