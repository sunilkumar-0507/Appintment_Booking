import { Star } from 'lucide-react';
import { cn } from '@/utils/cn';

export interface RatingProps {
  value: number;
  max?: number;
  size?: 'sm' | 'md';
  showValue?: boolean;
  reviewCount?: number;
  className?: string;
}

export function Rating({
  value,
  max = 5,
  size = 'sm',
  showValue = true,
  reviewCount,
  className,
}: RatingProps) {
  const starSize = size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4';

  return (
    <div className={cn('flex items-center gap-1.5', className)}>
      <div
        className="flex items-center gap-0.5"
        role="img"
        aria-label={`${value.toFixed(1)} out of ${max} stars`}
      >
        {Array.from({ length: max }).map((_, index) => (
          <Star
            key={index}
            className={cn(
              starSize,
              index < Math.round(value)
                ? 'fill-gold-400 text-gold-400'
                : 'fill-ink-200 text-ink-200 dark:fill-white/10 dark:text-white/10',
            )}
            aria-hidden
          />
        ))}
      </div>
      {showValue && (
        <span className="text-[13px] font-medium text-ink-700 dark:text-ink-200">{value.toFixed(1)}</span>
      )}
      {typeof reviewCount === 'number' && (
        <span className="text-[13px] text-ink-400 dark:text-ink-500">({reviewCount})</span>
      )}
    </div>
  );
}
