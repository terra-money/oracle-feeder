import * as keystore from './keystore'
import * as promptly from 'promptly'

export async function updateKey(filePath: string): Promise<void> {
  let password = process.env['PASSPHRASE'] || ''
  let mnemonic = process.env['MNEMONIC'] || ''

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

  await keystore.save(filePath, 'voter', password, mnemonic)
  console.info(`saved!`)
}
