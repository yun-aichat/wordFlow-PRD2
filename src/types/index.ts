import { Node, Edge } from 'reactflow'

export interface NodeData {
  id: string
  name: string
  type: 'page' | 'modal' | 'comment'
  content: string
  description?: string
  customItems?: { id: string; name: string }[]
}

export interface CustomNode extends Node {
  data: NodeData
}

export interface FlowState {
  nodes: CustomNode[]
  edges: Edge[]
  selectedNode: CustomNode | null
}

export interface NodeFormData {
  name: string
  content: string
  description?: string
}