import { Node, Edge } from 'reactflow'

export interface NodeData {
  id: string
  name: string
  type: 'page' | 'modal' | 'comment' | 'popup'
  content: string
  description?: string
  customItems?: { id: string; name: string }[]
  image?: string
  disabled?: boolean
  tags?: string[]
}

export interface CustomNode extends Node {
  data: {
    id: string;
    name: string;
    type: 'page' | 'modal' | 'comment' | 'overview' | 'requirement';
    content?: string;
    description?: string;
    customItems?: { id: string; name: string }[];
    tags?: string[];
    image?: string;
    disabled?: boolean;
    files?: { name: string; url: string }[]; // 新增文件列表
  };
}

export interface Tag {
  id: string
  name: string
  color: string
  description?: string // 名词解释
}

// 项目相关类型定义
export interface Project {
  id: string
  name: string
  description: string
  thumbnail?: string
  createdAt: Date
  updatedAt: Date
  flowData: {
    nodes: CustomNode[]
    edges: Edge[]
  }
  tags: Tag[]
}

// 本地存储接口
export interface LocalStorageData {
  projects: Project[]
  currentProjectId?: string
  settings: {
    theme: 'light' | 'dark'
    showMiniMap: boolean
  }
}