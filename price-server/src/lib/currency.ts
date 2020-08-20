export function getBaseCurrency(symbol: string): string {
  return symbol.split('/')[0]
}

export function getQuoteCurrency(symbol: string): string {
  return symbol.split('/')[1]
}
