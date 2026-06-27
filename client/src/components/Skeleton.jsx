export function CardSkeleton({ count = 3 }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-paper-card border border-line rounded-md p-5 animate-pulse">
          <div className="h-3 bg-line rounded-sm w-1/4 mb-3" />
          <div className="h-4 bg-line/70 rounded-sm w-1/3 mb-4" />
          <div className="h-3 bg-line/50 rounded-sm w-full mb-1" />
          <div className="h-3 bg-line/50 rounded-sm w-5/6" />
        </div>
      ))}
    </div>
  );
}
