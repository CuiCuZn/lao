import CryptoJS from 'crypto-js'

const generateRandomString = () => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''

  for (let index = 0; index < 32; index += 1) {
    result += characters.charAt(Math.floor(Math.random() * characters.length))
  }

  return result
}

export const generateAesKey = () => {
  return CryptoJS.enc.Utf8.parse(generateRandomString())
}

export const encryptBase64 = (value: CryptoJS.lib.WordArray) => {
  return CryptoJS.enc.Base64.stringify(value)
}

export const encryptWithAes = (message: string, aesKey: CryptoJS.lib.WordArray) => {
  return CryptoJS.AES.encrypt(message, aesKey, {
    mode: CryptoJS.mode.ECB,
    padding: CryptoJS.pad.Pkcs7
  }).toString()
}
