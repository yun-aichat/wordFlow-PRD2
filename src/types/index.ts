import { Node, Edge } from 'reactflow'

export interface NodeData {
  id: string
  name: string
  type: 'page' | 'modal' | 'comment' | 'overview' | 'requirement' | 'modification' | 'popup' | 'markdown-file'
  content?: string
  description?: string
  customItems?: { id: string; name: string }[]
  image?: string
  disabled?: boolean
  tags?: string[]
  files?: { name: string; url: string; size?: number; type?: string }[]
  processed?: boolean
  markdownFile?: { name: string; content: string; size: number } // MD文件信息，移除url字段，添加size
}

export interface CustomNode extends Node {
  data: {
    id: string;
    name: string;
    type: 'page' | 'modal' | 'comment' | 'overview' | 'requirement' | 'modification' | 'popup' | 'markdown-file';
    content?: string;
    description?: string;
    customItems?: { id: string; name: string }[];
    tags?: string[];
    image?: string;
    disabled?: boolean;
    files?: { name: string; url: string; size?: number; type?: string }[]; // 新增文件列表
    processed?: boolean; // 是否已处理
    markdownFile?: { name: string; content: string; size: number }; // MD文件信息，移除url字段，添加size
  };
}

export interface Tag {
  id: string
  name: string
  color: string
  description?: string // 名词解释
}

// FIX: 添加缺失的NodeFormData类型定义
export interface NodeFormData {
  name: string
  content: string
  description: string
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