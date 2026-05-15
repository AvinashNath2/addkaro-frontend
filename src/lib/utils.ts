// utils.ts — shared helper functions used across the whole app

import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

// cn() = "class names" — a helper for combining Tailwind CSS classes conditionally.
//
// Problem it solves:
//   Tailwind classes can conflict. e.g. if you have "border-gray-300" as a base style
//   and conditionally add "border-red-400" for errors, you'd end up with BOTH applied
//   and the browser picks one arbitrarily.
//
// How it works:
//   - clsx() joins class strings together and handles conditionals like:
//       cn('base-class', isError && 'error-class', someVar ? 'a' : 'b')
//   - twMerge() then resolves Tailwind conflicts — if two classes control the
//     same CSS property, the LAST one wins (instead of browser guessing).
//
// Usage example from RegisterPage:
//   className={cn('input-field', errors.email && 'input-error')}
//   → if no error:  "input-field"
//   → if error:     "input-field input-error"  (border changes to red)
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
