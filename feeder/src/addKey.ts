import * as keystore from './keystore'
import * as promptly from 'promptly'

export async function addKey(args): Promise<void> {
  console.log(args)
  let password = process.env.PASSWORD || ''
  let mnemonic = process.env.MNEMONIC || ''

  if (password === '') {
    password = await promptly.password('Enter a passphrase to encrypt your key to disk:', {
      replace: '*',
    })

    if (password.length < 8) {
      throw Error('ERROR: password must be at least 8 characters')
    }

    const confirm = await promptly.password('Repeat the passphrase:', { replace: '*' })

    if (password !== confirm) {
      throw Error("ERROR: passphrases don't matchPassword confirm failed")
    }
  }

  if (mnemonic === '') {
    mnemonic = await promptly.prompt('Enter your bip39 mnemonic: ')
  }

  if (mnemonic.trim().split(' ').length !== 24) {
    throw Error('Error: Mnemonic is not valid.')
  }

  if (!args.prefix) {
    args.prefix = await promptly.prompt('\nEnter the address prefix: ')
  }

  await keystore.save(args, password, mnemonic)
  console.info('saved!')
}
