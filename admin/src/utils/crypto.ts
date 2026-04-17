import CryptoJS from 'crypto-js'

/**
 * 随机生成32位的字符串
 * @returns {string}
 */
const generateRandomString = () => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  const charactersLength = characters.length
  for (let i = 0; i < 32; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength))
  }
  return result
}

/**
 * 随机生成 AES 密钥
 * @returns {CryptoJS.lib.WordArray}
 */
export const generateAesKey = () => {
  return CryptoJS.enc.Utf8.parse(generateRandomString())
}

/**
 * 加密 Base64
 * @param {CryptoJS.lib.WordArray} str
 * @returns {string}
 */
export const encryptBase64 = (str: CryptoJS.lib.WordArray) => {
  return CryptoJS.enc.Base64.stringify(str)
}

/**
 * 解密 Base64
 * @param {string} str
 * @returns {CryptoJS.lib.WordArray}
 */
export const decryptBase64 = (str: string) => {
  return CryptoJS.enc.Base64.parse(str)
}

/**
 * 使用 AES 密钥对数据进行加密 (ECB 模式, Pkcs7 填充)
 * @param {string} message - 待加密内容
 * @param {CryptoJS.lib.WordArray} aesKey - AES 密钥
 * @returns {string}
 */
export const encryptWithAes = (message: string, aesKey: CryptoJS.lib.WordArray) => {
  const encrypted = CryptoJS.AES.encrypt(message, aesKey, {
    mode: CryptoJS.mode.ECB,
    padding: CryptoJS.pad.Pkcs7
  })
  return encrypted.toString()
}

/**
 * 使用 AES 密钥对数据进行解密
 * @param {string} message - 密文
 * @param {CryptoJS.lib.WordArray} aesKey - AES 密钥
 * @returns {string}
 */
export const decryptWithAes = (message: string, aesKey: CryptoJS.lib.WordArray) => {
  const decrypted = CryptoJS.AES.decrypt(message, aesKey, {
    mode: CryptoJS.mode.ECB,
    padding: CryptoJS.pad.Pkcs7
  })
  return decrypted.toString(CryptoJS.enc.Utf8)
}
