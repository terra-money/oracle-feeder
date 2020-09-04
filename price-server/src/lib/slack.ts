import nodeFetch, { Response } from 'node-fetch'
import * as config from 'config'

export function sendSlack(message: string): Promise<Response> {
  if (!config?.slack?.url || !config?.slack?.channel) {
    return
  }

  return nodeFetch(config.get('slack.url'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      channel: config.get('slack.channel'),
      username: 'Oracle PriceServer',
      text: message,
    }),
  })
}
