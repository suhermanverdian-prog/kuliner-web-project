/* src/utils/cn.js */
/**
 * Simple classnames utility – merges multiple class strings, filters falsy values.
 * Usage: cn('a', condition && 'b', 'c') => 'a b c' (if condition true).
 */
export function cn(...args) {
  return args.filter(Boolean).join(' ');
}
