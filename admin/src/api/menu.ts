import request from '@/utils/request'

/**
 * 菜单树节点（适配 RuoYi /system/menu/treeselect 接口）
 */
export interface MenuTreeNode {
  id: string | number
  /** 菜单名称（对应 el-tree 的 label） */
  label: string
  /** 父节点 id，根节点可能为 0 */
  parentId?: string | number
  children?: MenuTreeNode[]
  [key: string]: any
}

/**
 * 获取路由数据
 * @returns {Promise<any>}
 */
export const getRouters = () => {
  return request.get('/system/menu/getRouters')
}

/**
 * 获取菜单下拉树（用于角色权限分配）
 * GET /system/menu/treeselect
 */
export const listMenuTreeSelect = (): Promise<{ code: number; data: MenuTreeNode[]; msg?: string }> => {
  return request.get('/system/menu/treeselect')
}

/**
 * 角色关联菜单树 + 已选菜单 id 列表
 * GET /system/menu/roleMenuTreeselect/{roleId}
 */
export interface RoleMenuTreeResult {
  /** 该角色已勾选的菜单 id 列表 */
  checkedKeys: Array<string | number>
  /** 全量菜单树（结构同 treeselect） */
  menus: MenuTreeNode[]
}

export const roleMenuTreeselect = (roleId: string | number): Promise<{ code: number; data: RoleMenuTreeResult; msg?: string }> => {
  return request.get(`/system/menu/roleMenuTreeselect/${roleId}`)
}
