import * as FormData from 'form-data'
import { Agent as HttpAgent } from 'http'
import { Agent as HttpsAgent } from 'https'
import nodeFetch, { RequestInit, Response } from 'node-fetch'
export * from 'node-fetch'

const httpAgent = new HttpAgent({
  keepAlive: true,
})

const httpsAgent = new HttpsAgent({
  keepAlive: true,
  rejectUnauthorized: false,
})

const options = {
  agent: function (_parsedURL) {
    if (_parsedURL.protocol == 'http:') {
      return httpAgent
    } else {
      return httpsAgent
    }
  },
}

export default function fetch(url: string, init?: RequestInit): Promise<Response> {
  return nodeFetch(url, { ...init, ...options })
}

export function toFormData(object: Record<string, unknown>): FormData {
  const formData = new FormData()
  for (const key of Object.keys(object)) {
    formData.append(key, object[key])
  }
  return formData
}

export function toQueryString(object: Record<string, unknown>): string {
  return Object.keys(object)
    .map((key) => `${key}=${object[key]}`)
    .join('&')
}
