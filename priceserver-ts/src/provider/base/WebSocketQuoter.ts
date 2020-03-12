import * as WebSocket from 'ws';
import * as logger from 'lib/logger';
import Quoter from './Quoter';

export class WebSocketQuoter extends Quoter {
  protected ws: WebSocket;
  protected wsUrl: string;

  public connect(wsUrl: string) {
    this.ws = new WebSocket(wsUrl);
    this.wsUrl = wsUrl;

    this.ws.on('open', () => this.onConnect());
    this.ws.on('close', () => this.onDisconnect());
    this.ws.on('disconnect', () => this.onDisconnect());
    this.ws.on('error', error => this.onError(error));
    this.ws.on('message', raw => this.onData(raw));
  }

  public disconnect() {
    this.ws && this.ws.terminate();
  }

  protected onConnect() {
    logger.info(`${this.constructor.name}: websocket connected to ${this.wsUrl}`);
  }

  protected onDisconnect() {
    logger.info(`${this.constructor.name}: websocket disconnected, reconnect to ${this.wsUrl}`);

    // if disconnected, try connect again
    setTimeout(() => this.connect(this.wsUrl), 1000);
  }

  protected onError(error) {
    logger.error(`${this.constructor.name}:`, error);
  }

  protected onData(raw) {}
}

export default WebSocketQuoter;
