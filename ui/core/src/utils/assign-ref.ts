import { MutableRef } from './types';

/**
 * Utility to assign a value to a React ref regardless of its type (callback or object ref)
 * @param ref The React ref to assign to
 * @param value The value to assign to the ref
 */
export function assignRef<T>(ref: MutableRef<T> | null | undefined, value: T): void {
  if (ref) {
    if (typeof ref === 'function') {
      ref(value);
    } else {
      ref.current = value;
    }
  }
}
