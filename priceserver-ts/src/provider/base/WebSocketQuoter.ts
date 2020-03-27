import * as WebSocket from 'ws';
import { errorHandler } from 'lib/error';
import * as logger from 'lib/logger';
import Quoter from './Quoter';

export class WebSocketQuoter extends Quoter {
  protected ws: WebSocket;
  protected wsUrl: string;
  private sendedPingAt: number = 0;

  public connect(wsUrl: string) {
    this.disconnect();

    this.ws = new WebSocket(wsUrl);
    this.wsUrl = wsUrl;

    this.ws.on('open', () => this.onConnect());
    this.ws.on('close', (code, reason) => this.onDisconnect(code, reason));
    this.ws.on('error', error => this.onError(error));
    this.ws.on('message', raw => this.onRawData(raw));
    this.ws.on('ping', () => this.ws.pong());
    this.ws.on('pong', () => this.alive());
  }

  public disconnect() {
    this.ws && this.ws.terminate();
  }

  public async tick(now: number): Promise<boolean> {
    // ping every 10 seconds
    if (this.ws && this.ws.readyState === this.ws.OPEN && now - this.sendedPingAt > 10000) {
      this.ws.ping();

      this.sendedPingAt = now;
    }

    return super.tick(now);
  }

  protected onConnect() {
    logger.info(`${this.constructor.name}: websocket connected to ${this.wsUrl}`);

    this.alive();
  }

  protected onDisconnect(code: number, reason: string) {
    logger.info(`${this.constructor.name}: websocket disconnected (${code}: ${reason})`);

    // if disconnected, try connect again
    setTimeout(() => this.connect(this.wsUrl), 1000);
  }

  protected onError(error) {
    logger.error(`${this.constructor.name} websocket: `, error);
  }

  protected onData(data: object) {}

  private onRawData(raw) {
    let data;

    try {
      data = JSON.parse(raw);
    } catch (error) {
      logger.error(`${this.constructor.name}: JSON parse error ${raw}`);
      return;
    }

    try {
      this.onData(data);
    } catch (error) {
      errorHandler(error);
    }

    this.alive();
  }
}

export default WebSocketQuoter;
