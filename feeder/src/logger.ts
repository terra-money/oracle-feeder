export function info(...args: any[]): void {
  console.info(`[${new Date().toUTCString()}]`, ...args)
}

export function warn(...args: any[]): void {
  console.warn(`[${new Date().toUTCString()}]`, ...args)
}

export function error(...args: any[]): void {
  console.error(`[${new Date().toUTCString()}]`, ...args)
}
