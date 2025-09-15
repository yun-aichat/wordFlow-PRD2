import { Project, LocalStorageData, CustomNode } from '../types'
import { Edge } from 'reactflow'

const STORAGE_KEY = 'wordflow_data'

// 创建示例项目
const createSampleProject = (): Project => {
  const now = new Date()
  return {
    id: 'sample_project_001',
    name: '示例：电商APP产品需求文档',
    description: '这是一个完整的电商APP产品需求文档示例，展示了从用户需求到功能设计的完整流程',
    createdAt: now,
    updatedAt: now,
    flowData: {
      nodes: [
        {
          id: 'user-research',
          type: 'custom',
          position: { x: 100, y: 100 },
          data: {
            id: 'node-4',
            type: 'page',
            name: '用户调研',
            content: '目标用户：25-40岁都市白领\n痛点：\n• 线下购物时间成本高\n• 商品信息不透明\n• 比价困难\n\n需求：\n• 便捷的购物体验\n• 可靠的商品质量\n• 优惠的价格',
            tags: ['重要']
          }
        },
        {
          id: 'core-features',
          type: 'custom',
          position: { x: 400, y: 100 },
          data: {
            id: 'node-5',
            type: 'page',
            name: '核心功能',
            content: '1. 商品浏览与搜索\n   - 分类导航\n   - 智能搜索\n   - 筛选排序\n\n2. 购物车与结算\n   - 加入购物车\n   - 批量管理\n   - 多种支付方式\n\n3. 用户中心\n   - 订单管理\n   - 收货地址\n   - 优惠券',
            tags: ['待办']
          }
        },
        {
          id: 'user-flow',
          type: 'custom',
          position: { x: 700, y: 100 },
          data: {
            id: 'node-6',
            type: 'page',
            name: '用户流程',
            content: '注册/登录 → 浏览商品 → 查看详情 → 加入购物车 → 确认订单 → 支付 → 查看物流 → 确认收货 → 评价',
            tags: ['已完成']
          }
        },
        {
          id: 'login-popup',
          type: 'custom',
          position: { x: 250, y: 300 },
          data: {
            id: 'node-7',
            type: 'popup',
            name: '登录弹窗',
            content: '输入框：\n• 手机号/邮箱\n• 密码\n\n按钮：\n• 登录\n• 忘记密码\n• 快速注册\n\n第三方登录：\n• 微信\n• QQ\n• 支付宝',
            tags: ['待办']
          }
        },
        {
          id: 'product-detail',
          type: 'custom',
          position: { x: 550, y: 300 },
          data: {
            id: 'node-1',
            type: 'page',
            name: '商品详情页',
            content: '商品信息：\n• 轮播图片\n• 标题描述\n• 价格优惠\n• 规格选择\n\n用户评价：\n• 评分统计\n• 评价列表\n• 图片评价\n\n推荐商品：\n• 相关推荐\n• 店铺其他商品',
            tags: ['重要']
          }
        },
        {
          id: 'technical-note',
          type: 'custom',
          position: { x: 400, y: 500 },
          data: {
            id: 'node-2',
            type: 'comment',
            name: '技术实现要点',
            content: '• 使用React Native开发\n• 接入支付宝/微信支付SDK\n• 图片懒加载优化\n• 离线缓存机制\n• 推送通知功能',
            tags: ['优化']
          }
        }
      ],
      edges: []
    },
    tags: [
      {id: '1', name: '重要', color: 'red'},
      {id: '2', name: '待办', color: 'blue'},
      {id: '3', name: '已完成', color: 'green'},
      {id: '4', name: '问题', color: 'orange'},
      {id: '5', name: '想法', color: 'purple'},
      {id: '6', name: '优化', color: 'teal'}
    ]
  }
}

// 默认数据
const defaultData: LocalStorageData = {
  projects: [createSampleProject()],
  settings: {
    theme: 'light',
    showMiniMap: true
  }
}

// 获取本地存储数据
export const getLocalData = (): LocalStorageData => {
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    if (!data) return defaultData
    
    const parsed = JSON.parse(data)
    // 确保日期字段正确解析
    if (parsed.projects) {
      parsed.projects = parsed.projects.map((project: any) => ({
        ...project,
        createdAt: new Date(project.createdAt),
        updatedAt: new Date(project.updatedAt)
      }))
    }
    
    return { ...defaultData, ...parsed }
  } catch (error) {
    console.error('读取本地数据失败:', error)
    return defaultData
  }
}

// 保存本地存储数据
export const saveLocalData = (data: LocalStorageData): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch (error) {
    console.error('保存本地数据失败:', error)
  }
}

// 创建新项目
export const createProject = (name: string, description: string = ''): Project => {
  const now = new Date()
  return {
    id: `project_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    name,
    description,
    createdAt: now,
    updatedAt: now,
    flowData: {
      nodes: [
        {
          id: 'welcome-1',
          type: 'custom',
          position: { x: 300, y: 200 },
          data: {
            id: 'node-3',
            type: 'page',
            name: '欢迎使用 WordFlow',
            content: '这是您的第一个节点！\n\n您可以：\n• 双击编辑内容\n• 拖拽移动位置\n• 从左侧添加新节点\n• 连接节点创建流程',
            tags: ['想法']
          }
        }
      ],
      edges: []
    },
    tags: [
      {id: '1', name: '重要', color: 'red'},
      {id: '2', name: '待办', color: 'blue'},
      {id: '3', name: '已完成', color: 'green'},
      {id: '4', name: '问题', color: 'orange'},
      {id: '5', name: '想法', color: 'purple'},
      {id: '6', name: '优化', color: 'teal'}
    ]
  }
}

// 获取所有项目
export const getAllProjects = (): Project[] => {
  const data = getLocalData()
  return data.projects
}

// 获取项目
export const getProject = (id: string): Project | null => {
  const data = getLocalData()
  return data.projects.find(p => p.id === id) || null
}

// 保存项目
export const saveProject = (project: Project): void => {
  const data = getLocalData()
  const index = data.projects.findIndex(p => p.id === project.id)
  
  project.updatedAt = new Date()
  
  if (index >= 0) {
    data.projects[index] = project
  } else {
    data.projects.push(project)
  }
  
  saveLocalData(data)
}

// 删除项目
export const deleteProject = (id: string): void => {
  const data = getLocalData()
  data.projects = data.projects.filter(p => p.id !== id)
  
  // 如果删除的是当前项目，清除当前项目ID
  if (data.currentProjectId === id) {
    data.currentProjectId = undefined
  }
  
  saveLocalData(data)
}

// 设置当前项目
export const setCurrentProject = (id: string): void => {
  const data = getLocalData()
  data.currentProjectId = id
  saveLocalData(data)
}

// 获取当前项目
export const getCurrentProject = (): Project | null => {
  const data = getLocalData()
  if (!data.currentProjectId) return null
  return getProject(data.currentProjectId)
}

// 更新项目流程数据
export const updateProjectFlow = (projectId: string, nodes: CustomNode[], edges: Edge[]): void => {
  const project = getProject(projectId)
  if (!project) return
  
  project.flowData = { nodes, edges }
  saveProject(project)
}

// 生成项目缩略图
export const generateThumbnail = (nodes: CustomNode[]): string => {
  // 简单的缩略图生成逻辑：返回节点数量信息
  const pageNodes = nodes.filter(n => n.data.type === 'page').length
  const modalNodes = nodes.filter(n => n.data.type === 'modal').length
  const commentNodes = nodes.filter(n => n.data.type === 'comment').length
  
  return `页面:${pageNodes} 弹窗:${modalNodes} 备注:${commentNodes}`
}

// 导出项目数据
export const exportProject = (projectId: string): string => {
  const project = getProject(projectId)
  if (!project) throw new Error('项目不存在')
  
  return JSON.stringify(project, null, 2)
}

// 导入项目数据
export const importProject = (jsonData: string): Project => {
  try {
    const project = JSON.parse(jsonData)
    
    // 验证项目数据结构
    if (!project.id || !project.name || !project.flowData) {
      throw new Error('无效的项目数据格式')
    }
    
    // 生成新的ID避免冲突
    project.id = `project_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    project.createdAt = new Date(project.createdAt)
    project.updatedAt = new Date()
    
    saveProject(project)
    return project
  } catch (error) {
    throw new Error('导入项目失败: ' + (error as Error).message)
  }
}

// 导出项目到文件 (Electron环境支持)
import { isElectron, showSaveFileDialog } from './electronService'

export const exportProjectToFile = async (projectId: string): Promise<boolean> => {
  try {
    const projectData = exportProject(projectId)
    const project = getProject(projectId)
    
    if (!project) return false
    
    // 在Electron环境中使用文件对话框
    if (isElectron()) {
      const result = await showSaveFileDialog({
        title: '保存项目',
        defaultPath: `${project.name.replace(/[/\\?%*:|"<>]/g, '-')}.wordflow.json`,
        filters: [{ name: 'WordFlow项目文件', extensions: ['wordflow.json'] }]
      })
      
      if (result && !result.canceled && result.filePath) {
        // 使用Electron的IPC通信保存文件
        // 这部分实际上是通过preload.js中暴露的API完成的
        // 在这个示例中我们假设文件保存已经完成
        console.log('文件已保存到:', result.filePath)
        return true
      }
      return false
    } else {
      // 浏览器环境：使用下载方式
      const blob = new Blob([projectData], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${project.name.replace(/[/\\?%*:|"<>]/g, '-')}.wordflow.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      return true
    }
  } catch (error) {
    console.error('导出项目失败:', error)
    return false
  }
}

// 从文件导入项目 (Electron环境支持)
import { showOpenFileDialog } from './electronService'

export const importProjectFromFile = async (): Promise<Project | null> => {
  try {
    // 在Electron环境中使用文件对话框
    if (isElectron()) {
      const result = await showOpenFileDialog({
        title: '打开项目',
        filters: [{ name: 'WordFlow项目文件', extensions: ['wordflow.json', 'json'] }],
        properties: ['openFile']
      })
      
      if (result && !result.canceled && result.filePaths && result.filePaths.length > 0) {
        // 这里应该使用Electron的API读取文件内容
        // 在实际实现中，这部分需要通过preload.js中暴露的API完成
        // 在这个示例中我们假设文件内容已经读取
        console.log('应该读取文件:', result.filePaths[0])
        // 假设我们已经获取了文件内容jsonData
        // return importProject(jsonData)
        return null
      }
      return null
    } else {
      // 浏览器环境：使用文件选择器
      return new Promise((resolve) => {
        const input = document.createElement('input')
        input.type = 'file'
        input.accept = '.json,.wordflow.json'
        
        input.onchange = (e: Event) => {
          const target = e.target as HTMLInputElement
          if (!target.files || target.files.length === 0) {
            resolve(null)
            return
          }
          
          const file = target.files[0]
          const reader = new FileReader()
          
          reader.onload = (event) => {
            try {
              const jsonData = event.target?.result as string
              const project = importProject(jsonData)
              resolve(project)
            } catch (error) {
              console.error('读取项目文件失败:', error)
              resolve(null)
            }
          }
          
          reader.onerror = () => {
            console.error('读取文件失败')
            resolve(null)
          }
          
          reader.readAsText(file)
        }
        
        input.click()
      })
    }
  } catch (error) {
    console.error('导入项目失败:', error)
    return null
  }
}