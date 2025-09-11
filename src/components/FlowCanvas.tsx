import React, { useCallback, useMemo, useEffect } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
  NodeTypes,
  useReactFlow,
} from 'reactflow'
import { useColorModeValue } from '@chakra-ui/react'
import CustomNode from './CustomNode'
import { CustomNode as CustomNodeType } from '../types'

interface FlowCanvasProps {
  onNodeSelect: (node: CustomNodeType | null) => void
  tags?: {name: string, color: string}[]
  showMiniMap?: boolean
  initialNodes?: CustomNodeType[]
  initialEdges?: Edge[]
  onFlowChange?: (nodes: CustomNodeType[], edges: Edge[]) => void
}

const FlowCanvas: React.FC<FlowCanvasProps> = ({ 
  onNodeSelect, 
  tags = [], 
  showMiniMap = true,
  initialNodes = [],
  initialEdges = [],
  onFlowChange
}) => {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)
  const reactFlowInstance = useReactFlow();

  const bgColor = useColorModeValue('#fafafa', '#1a1a1a')
  const lineColor = useColorModeValue('#e2e8f0', '#2d3748')
  const miniMapBg = useColorModeValue('#ffffff', '#2d3748')
  const miniMapNodeColor = useColorModeValue('#e2e8f0', '#4a5568')

  // 定义节点类型
  const nodeTypes: NodeTypes = useMemo(
    () => ({
      custom: (props: any) => <CustomNode {...props} tags={tags} />,
    }),
    [tags]
  )

  // 处理连接 - 允许手动连接
  const onConnect = useCallback(
    (params: Connection | Edge) => {
      // 允许手动拖拽连接
      setEdges((eds) => addEdge(params, eds));
    },
    [setEdges]
  )

  // 处理节点选择
  const onNodeClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      onNodeSelect(node as CustomNodeType)
    },
    [onNodeSelect]
  )

  // 处理画布点击（取消选择）
  const onPaneClick = useCallback(() => {
    onNodeSelect(null)
  }, [onNodeSelect])

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const reactFlowBounds = event.currentTarget.getBoundingClientRect();
      const draggedNode = JSON.parse(event.dataTransfer.getData('application/reactflow'));

      // check if the dropped element is valid
      if (typeof draggedNode === 'undefined' || !draggedNode) {
        return;
      }

      const position = reactFlowInstance.project({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      });

      const isNodePresent = nodes.some((n) => n.id === draggedNode.id);

      if (!isNodePresent) {
        // It's a new node from the sidebar, add it
        const newNode = {
          ...draggedNode,
          position,
        };
        setNodes((nds) => nds.concat(newNode));
      }
    },
    [reactFlowInstance, nodes, setNodes]
  );

  // 监听数据变化并通知父组件
  useEffect(() => {
    if (onFlowChange) {
      onFlowChange(nodes as CustomNodeType[], edges)
    }
  }, [nodes, edges, onFlowChange])

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      onNodeClick={onNodeClick}
      onPaneClick={onPaneClick}
      nodeTypes={nodeTypes}
      onDrop={onDrop}
      onDragOver={onDragOver}
      fitView
      attributionPosition="bottom-left"
      style={{
        backgroundColor: bgColor,
      }}
    >
      <Background
        color={lineColor}
        gap={20}
        size={1}
      />
      <Controls />
      {showMiniMap && (
        <MiniMap
          style={{
            backgroundColor: miniMapBg,
            left: 30,
            bottom: 10,
            right: 'auto',
            top: 'auto',
          }}
          nodeColor={miniMapNodeColor}
          nodeStrokeWidth={3}
          zoomable
          pannable
        />
      )}
    </ReactFlow>
  )
}

export default FlowCanvas