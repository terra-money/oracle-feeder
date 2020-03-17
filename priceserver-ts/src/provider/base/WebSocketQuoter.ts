import * as WebSocket from 'ws';
import { errorHandler } from 'lib/error';
import * as logger from 'lib/logger';
import Quoter from './Quoter';

export class WebSocketQuoter extends Quoter {
  protected ws: WebSocket;
  protected wsUrl: string;
  private lastPingAt: number = 0;

  public connect(wsUrl: string) {
    this.disconnect();

    this.ws = new WebSocket(wsUrl);
    this.wsUrl = wsUrl;

    this.ws.on('open', () => this.onConnect());
    this.ws.on('close', (code, reason) => this.onDisconnect(code, reason));
    this.ws.on('error', error => this.onError(error));
    this.ws.on('message', raw => this.onData(raw));
    this.ws.on('ping', () => this.ws.pong());
  }

  public disconnect() {
    this.ws && this.ws.terminate();
  }

  public async tick(now: number): Promise<boolean> {
    // ping every 10 seconds
    if (this.ws && this.ws.readyState === this.ws.OPEN && now - this.lastPingAt > 10000) {
      this.ws.ping();

      this.lastPingAt = now;
    }

    return super.tick(now);
  }

  protected onConnect() {
    logger.info(`${this.constructor.name}: websocket connected to ${this.wsUrl}`);
  }

  protected onDisconnect(code: number, reason: string) {
    logger.info(`${this.constructor.name}: websocket disconnected (${code}: ${reason})`);

    // if disconnected, try connect again
    setTimeout(() => this.connect(this.wsUrl), 500);
  }

  protected onError(error) {
    errorHandler(error);
  }

  protected onData(raw) {}
}

export default WebSocketQuoter;
