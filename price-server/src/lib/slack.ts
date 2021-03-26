import fetch, { Response } from 'lib/fetch'
import * as config from 'config'

export function sendSlack(message: string): Promise<Response | void> {
  if (!config?.slack?.url || !config?.slack?.channel) {
    return Promise.resolve()
  }

  return fetch(config.get('slack.url'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      channel: config.get('slack.channel'),
      username: 'Oracle PriceServer',
      text: message,
    }),
  })
}
