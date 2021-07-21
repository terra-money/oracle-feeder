import * as WebSocket from 'ws'
import { errorHandler } from 'lib/error'
import * as logger from 'lib/logger'
import Quoter, { QuoterOptions } from './Quoter'

export class WebSocketQuoter extends Quoter {
  protected ws: WebSocket
  protected wsUrl: string
  private sendedPingAt = 0

  constructor(options: QuoterOptions) {
    super(options)

    this.options.interval = 100
  }

  public async connect(wsUrl: string): Promise<void> {
    this.disconnect()

    this.ws = new WebSocket(wsUrl)
    this.wsUrl = wsUrl

    this.ws.on('open', () => this.onConnect())
    this.ws.on('close', (code, reason) => this.onDisconnect(code, reason))
    this.ws.on('error', (error) => this.onError(error))
    this.ws.on('message', (raw) => this.onRawData(raw))
    this.ws.on('ping', () => this.ws.pong())
    this.ws.on('pong', () => this.alive())
  }

  public disconnect(): void {
    this.ws && this.ws.terminate()
  }

  public async tick(now: number): Promise<boolean> {
    // ping every 10 seconds
    if (this.ws && this.ws.readyState === this.ws.OPEN && now - this.sendedPingAt > 10000) {
      this.ws.ping()

      this.sendedPingAt = now
    }

    return super.tick(now)
  }

  protected onConnect(): void {
    logger.info(`${this.constructor.name}: websocket connected to ${this.wsUrl}`)

    this.alive()
  }

  protected onDisconnect(code: number, reason: string): void {
    logger.info(`${this.constructor.name}: websocket disconnected (${code}: ${reason})`)

    // if disconnected, try connect again
    setTimeout(() => this.connect(this.wsUrl), 1000)
  }

  // eslint-disable-next-line
  protected onError(error): void {
    logger.error(`${this.constructor.name} websocket: `, error)
  }

  // eslint-disable-next-line
  protected onData(data: object): void {
    // do nothing
  }

  // eslint-disable-next-line
  protected onRawData(raw): void {
    let data

    try {
      data = JSON.parse(raw)
    } catch (error) {
      logger.error(`${this.constructor.name}: JSON parse error ${raw}`)
      return
    }

    try {
      this.onData(data)
    } catch (error) {
      errorHandler(error)
    }

    this.alive()
  }
}

export default WebSocketQuoter
