export interface VoteServiceConfig {
    lcdUrl: string
    rpcUrl: string
    chainID: string
    validators: string[]
    dataSourceUrls: string[]
    password: string
    addrPrefix: string,
    keyPath: string
    keyName: string
}