import { format } from 'date-fns'

export function info(...args) {
  console.info(format(new Date(), 'yyyy-MM-dd HH:mm:ss'), ...args)
}

export function warn(...args) {
  console.warn(format(new Date(), 'yyyy-MM-dd HH:mm:ss'), ...args)
}

export function error(...args) {
  console.error(format(new Date(), 'yyyy-MM-dd HH:mm:ss'), ...args)
}
