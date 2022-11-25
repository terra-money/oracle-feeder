export function info(...args: any[]): void {
  console.info(`[INFO][${new Date().toUTCString()}]`, ...args)
}

export function warn(...args: any[]): void {
  console.warn(`[WARN][${new Date().toUTCString()}]`, ...args)
}

export function error(...args: any[]): void {
  console.error(`[ERROR][${new Date().toUTCString()}]`, ...args)
}
