import {
  GeneratedType,
  OfflineSigner,
  EncodeObject,
  Registry,
} from "@cosmjs/proto-signing";
import { LcdClientBaseOptions } from '@cosmjs/launchpad/build/lcdapi/lcdclient'
import { StdFee, LcdClient } from "@cosmjs/launchpad";
import { SigningStargateClient, DeliverTxResponse} from "@cosmjs/stargate";
import { UnionToIntersection, Return, Constructor } from "./helpers";
import { Module } from "./modules";
import { EventEmitter } from "events";

const defaultFee = {
  amount: [],
  gas: "200000",
};

interface ClientConfig extends LcdClientBaseOptions{
  rpcUrl: string
}

export class IgniteClient extends EventEmitter {
  static plugins: Module[] = [];
  readonly lcd: LcdClient;
  registry: Array<[string, GeneratedType]> = [];

  constructor(
    readonly config: ClientConfig,
    readonly signer: OfflineSigner
  ) {
    super();
    this.setMaxListeners(0);
    this.lcd = LcdClient.withExtensions(config);

    const classConstructor = this.constructor as typeof IgniteClient;
    classConstructor.plugins.forEach(plugin => {
      const pluginInstance = plugin(this);
      Object.assign(this, pluginInstance.module)
      if (this.registry) {
        this.registry = this.registry.concat(pluginInstance.registry)
      }
    });
  }

  static plugin<T extends Module | Module[]>(plugin: T) {
    const currentPlugins = this.plugins;

    class AugmentedClient extends this {
      static plugins = currentPlugins.concat(plugin);
    }

    if (Array.isArray(plugin)) {
      type Extension = UnionToIntersection<Return<T>['module']>
      return AugmentedClient as typeof AugmentedClient & Constructor<Extension>;
    }

    type Extension = Return<T>['module']
    return AugmentedClient as typeof AugmentedClient & Constructor<Extension>;
  }

  async signAndBroadcast(msgs: EncodeObject[], fee?: StdFee, memo?: string): Promise<DeliverTxResponse> {
    const options = { registry: new Registry(this.registry), prefix: "adr" };
    const { address } = (await this.signer.getAccounts())[0];
    const signingClient = await SigningStargateClient.connectWithSigner(this.config.apiUrl, this.signer, options);
    return await signingClient.signAndBroadcast(address, msgs, fee ? fee : defaultFee, memo)
  }
}