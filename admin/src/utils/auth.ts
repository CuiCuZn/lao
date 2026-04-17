import Cookies from 'js-cookie'

/**
 * 令牌名称常量
 * @constant TokenKey
 */
const TokenKey = 'Admin-Token'

/**
 * 获取 Token
 * @method getToken
 * @returns {string | undefined}
 */
export const getToken = () => Cookies.get(TokenKey)

/**
 * 设置 Token
 * @method setToken
 * @param {string} token
 */
export const setToken = (token: string) => Cookies.set(TokenKey, token)

/**
 * 移除 Token
 * @method removeToken
 */
export const removeToken = () => Cookies.remove(TokenKey)
