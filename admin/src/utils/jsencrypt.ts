import JSEncrypt from 'jsencrypt'

/**
 * 接口加密传输 RSA 公钥
 * 从环境变量读取，需与后端解密私钥对应
 */
const publicKey = import.meta.env.VITE_APP_RSA_PUBLIC_KEY || ''

/**
 * 前端 RSA 加密
 * @param {string} txt - 待加密文本 (通常为 AES 密钥)
 * @returns {string | false} - 返回加密后的密文
 */
export const encrypt = (txt: string) => {
  const encryptor = new JSEncrypt()
  encryptor.setPublicKey(publicKey)
  return encryptor.encrypt(txt)
}

/**
 * 前端 RSA 解密 (通常仅用于调试，生产不建议在前端存私钥)
 * @param {string} txt - 密文
 * @param {string} privateKey - 私钥
 * @returns {string | false}
 */
export const decrypt = (txt: string, privateKey: string) => {
  const encryptor = new JSEncrypt()
  encryptor.setPrivateKey(privateKey)
  return encryptor.decrypt(txt)
}
