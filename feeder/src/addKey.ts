import * as keystore from './keystore'
import * as promptly from 'promptly'

export async function addKey(filePath: string, coinType: string, keyName: string, prefix: string): Promise<void> {
  let password = process.env.PASSWORD || ''
  let mnemonic = process.env.MNEMONIC || ''

  coinType = process.env.COIN_TYPE ? process.env.COIN_TYPE : coinType
  keyName = process.env.KEY_NAME ? process.env.KEY_NAME : keyName

  if (password === '') {
    password = await promptly.password(`Enter a passphrase to encrypt your key to disk:`, {
      replace: `*`,
    })
    const confirm = await promptly.password(`Repeat the passphrase:`, { replace: `*` })

    if (password !== confirm) {
      console.error(`ERROR: passphrases don't matchPassword confirm failed`)
      return
    }
  }

  if (password.length < 8) {
    console.error(`ERROR: password must be at least 8 characters`)
    return
  }

  if (mnemonic === '') {
    mnemonic = await promptly.prompt(`Enter your bip39 mnemonic: `)
  }

  if (mnemonic.trim().split(` `).length !== 24) {
    console.error(`Error: Mnemonic is not valid.`)
    return
  }

  await keystore.save(filePath, keyName, password, mnemonic, coinType, prefix)
  console.info(`saved!`)
}
