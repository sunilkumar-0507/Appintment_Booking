import { Scissors } from 'lucide-react';
import { cn } from '@/utils/cn';
import { APP_NAME } from '@/constants/config';

export interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showWordmark?: boolean;
  className?: string;
  /** Light wordmark for dark surfaces such as the auth split panel. */
  inverted?: boolean;
}

const MARK_SIZES = {
  sm: 'h-8 w-8 rounded-lg',
  md: 'h-9 w-9 rounded-xl',
  lg: 'h-12 w-12 rounded-2xl',
};

const ICON_SIZES = { sm: 'h-4 w-4', md: 'h-[18px] w-[18px]', lg: 'h-6 w-6' };
const TEXT_SIZES = { sm: 'text-base', md: 'text-lg', lg: 'text-2xl' };

export function Logo({ size = 'md', showWordmark = true, className, inverted }: LogoProps) {
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <span
        className={cn(
          'flex items-center justify-center bg-ink-900 text-gold-400 shadow-card',
          'dark:bg-white/[0.08]',
          MARK_SIZES[size],
        )}
      >
        <Scissors className={ICON_SIZES[size]} aria-hidden />
      </span>
      {showWordmark && (
        <span
          className={cn(
            'font-display font-extrabold tracking-[-0.03em]',
            TEXT_SIZES[size],
            inverted ? 'text-white' : 'text-ink-900 dark:text-white',
          )}
        >
          {APP_NAME}
        </span>
      )}
    </span>
  );
}
