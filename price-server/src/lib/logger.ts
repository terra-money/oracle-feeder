import { format } from 'date-fns'

type Primitives = string | number | boolean | Date | Error | Record<string, unknown>

export function info(...args: Primitives[]): void {
  console.info(format(new Date(), 'yyyy-MM-dd HH:mm:ss'), ...args)
}

export function warn(...args: Primitives[]): void {
  console.warn(format(new Date(), 'yyyy-MM-dd HH:mm:ss'), ...args)
}

export function error(...args: Primitives[]): void {
  console.error(format(new Date(), 'yyyy-MM-dd HH:mm:ss'), ...args)
}
