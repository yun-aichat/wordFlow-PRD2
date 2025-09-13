import React, { useCallback, useMemo, useEffect, useRef } from 'react'
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
  NodeChange,
  EdgeChange,
  useReactFlow,
  applyNodeChanges,
  applyEdgeChanges,
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
  const [nodes, setNodes] = useNodesState(initialNodes)
  const [edges, setEdges] = useEdgesState(initialEdges)
  const reactFlowInstance = useReactFlow()
  

  
  // 自定义节点变化处理，只在拖拽结束时保存历史记录
  const onNodesChange = useCallback((changes: NodeChange[]) => {
    // 只在拖拽结束时保存历史记录
    const { past } = historyRef.current;
    if (changes.length > 0 && changes[0].type === 'position' && changes[0].dragging === false) {
      // 只保留最新的20次操作
      const newPast = [...past, { nodes: JSON.parse(JSON.stringify(nodes)), edges: JSON.parse(JSON.stringify(edges)) }];
      const limitedPast = newPast.length > 20 ? newPast.slice(-20) : newPast;
      
      historyRef.current = {
        past: limitedPast,
        future: []
      };
    }
    setNodes((nds) => applyNodeChanges(changes, nds));
  }, [nodes, edges, setNodes]);
  
  // 自定义边变化处理，只在操作完成时保存历史记录
  const onEdgesChange = useCallback((changes: EdgeChange[]) => {
    // 只在边删除或操作完成时保存历史记录
    const { past } = historyRef.current;
    if (changes.length > 0 && (changes[0].type === 'remove')) {
      // 只保留最新的20次操作
      const newPast = [...past, { nodes: JSON.parse(JSON.stringify(nodes)), edges: JSON.parse(JSON.stringify(edges)) }];
      const limitedPast = newPast.length > 20 ? newPast.slice(-20) : newPast;
      
      historyRef.current = {
        past: limitedPast,
        future: []
      };
    }
    setEdges((eds) => applyEdgeChanges(changes, eds));
  }, [nodes, edges, setEdges]);
  // const reactFlowInstance = useReactFlow();
  // FIX: 删除未使用的变量 reactFlowWrapper
  
  // 历史记录管理
  const historyRef = useRef<{past: {nodes: Node[], edges: Edge[]}[], future: {nodes: Node[], edges: Edge[]}[]}>({past: [], future: []});
  const selectedNodeId = useRef<string | null>(null)
  const selectedEdgeId = useRef<string | null>(null)
  const copiedNode = useRef<CustomNodeType | null>(null);

  const bgColor = useColorModeValue('#fafafa', '#1a1a1a')
  const lineColor = useColorModeValue('#e2e8f0', '#2d3748')
  const miniMapBg = useColorModeValue('#ffffff', '#2d3748')
  const miniMapNodeColor = useColorModeValue('#e2e8f0', '#4a5568')

  // 强制更新节点的回调函数
  const handleNodeUpdate = useCallback(() => {
    setNodes((nds) => [...nds]);
  }, [setNodes]);

  // 定义节点类型
  const nodeTypes: NodeTypes = useMemo(
    () => ({
      custom: (props: any) => <CustomNode {...props} tags={tags} onUpdate={handleNodeUpdate} />,
    }),
    [tags, handleNodeUpdate]
  )

  // 处理连接 - 允许手动连接
  const onConnect = useCallback(
    (params: Connection | Edge) => {
      // 保存当前状态到历史记录
      const { past } = historyRef.current;
      // 只保留最新的20次操作
      const newPast = [...past, { nodes: JSON.parse(JSON.stringify(nodes)), edges: JSON.parse(JSON.stringify(edges)) }];
      const limitedPast = newPast.length > 20 ? newPast.slice(-20) : newPast;
      
      historyRef.current = {
        past: limitedPast,
        future: []
      };
      
      // 允许手动拖拽连接
      setEdges((eds) => addEdge(params, eds));
    },
    [nodes, edges, setEdges]
  )

  // 处理节点选择
  const onNodeClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      const customNode = node as CustomNodeType;
      // 批注和备注节点点击时不打开设置面板，只选中以便删除
      if (customNode.data.type === 'comment' || customNode.data.type === 'modification') {
        selectedNodeId.current = node.id;
        onNodeSelect(null); // 不打开设置面板
      } else {
        onNodeSelect(customNode);
        selectedNodeId.current = node.id;
      }
    },
    [onNodeSelect]
  )

  // 处理连线点击
  const onEdgeClick = useCallback(
    (_event: React.MouseEvent, edge: Edge) => {
      selectedEdgeId.current = edge.id;
      selectedNodeId.current = null;
      onNodeSelect(null);
    },
    [onNodeSelect]
  )

  // 处理画布点击（取消选择）
  const onPaneClick = useCallback(() => {
    onNodeSelect(null);
    selectedNodeId.current = null;
    selectedEdgeId.current = null;
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
        // 保存当前状态到历史记录
        const { past } = historyRef.current;
        // 只保留最新的20次操作
        const newPast = [...past, { nodes: JSON.parse(JSON.stringify(nodes)), edges: JSON.parse(JSON.stringify(edges)) }];
        const limitedPast = newPast.length > 20 ? newPast.slice(-20) : newPast;
        
        historyRef.current = {
          past: limitedPast,
          future: []
        };
        
        // It's a new node from the sidebar, add it
        const newNode = {
          ...draggedNode,
          position,
        };
        setNodes((nds) => nds.concat(newNode));
      }
    },
    [reactFlowInstance, nodes, edges, setNodes]
  );

  // 保存当前状态到历史记录
  // const saveToHistory = useCallback(() => {
  //   const { past } = historyRef.current;
  //   // 只保留最新的20次操作
  //   const newPast = [...past, { nodes: JSON.parse(JSON.stringify(nodes)), edges: JSON.parse(JSON.stringify(edges)) }];
  //   const limitedPast = newPast.length > 20 ? newPast.slice(-20) : newPast;
  //   
  //   historyRef.current = {
  //     past: limitedPast,
  //     future: []
  //   };
  // }, [nodes, edges]);

  // 撤销操作
  const undo = useCallback(() => {
    const { past, future } = historyRef.current;
    if (past.length === 0) return;

    const newPast = [...past];
    const present = newPast.pop();
    if (!present) return;

    historyRef.current = {
      past: newPast,
      future: [{ nodes, edges }, ...future]
    };

    setNodes(present.nodes);
    setEdges(present.edges);
  }, [nodes, edges, setNodes, setEdges]);

  // 删除选中的节点
  const deleteSelectedNode = useCallback(() => {
    if (selectedNodeId.current) {
      // 保存当前状态到历史记录
      const { past } = historyRef.current;
      // 只保留最新的20次操作
      const newPast = [...past, { nodes: JSON.parse(JSON.stringify(nodes)), edges: JSON.parse(JSON.stringify(edges)) }];
      const limitedPast = newPast.length > 20 ? newPast.slice(-20) : newPast;
      
      historyRef.current = {
        past: limitedPast,
        future: []
      };
      
      setNodes((nds) => nds.filter((node) => node.id !== selectedNodeId.current));
      setEdges((eds) => eds.filter(
        (edge) => edge.source !== selectedNodeId.current && edge.target !== selectedNodeId.current
      ));
      selectedNodeId.current = null;
      onNodeSelect(null);
    }
  }, [nodes, edges, setNodes, setEdges, onNodeSelect]);

  // 删除选中的连线
  const deleteSelectedEdge = useCallback(() => {
    if (selectedEdgeId.current) {
      // 保存当前状态到历史记录
      const { past } = historyRef.current;
      // 只保留最新的20次操作
      const newPast = [...past, { nodes: JSON.parse(JSON.stringify(nodes)), edges: JSON.parse(JSON.stringify(edges)) }];
      const limitedPast = newPast.length > 20 ? newPast.slice(-20) : newPast;
      
      historyRef.current = {
        past: limitedPast,
        future: []
      };
      
      setEdges((eds) => eds.filter((edge) => edge.id !== selectedEdgeId.current));
      selectedEdgeId.current = null;
    }
  }, [nodes, edges, setEdges]);

  // 键盘事件处理
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl+Z 撤销
      if (event.ctrlKey && event.key === 'z') {
        event.preventDefault();
        undo();
      }
      
      // Ctrl+C 复制节点
      if (event.ctrlKey && event.key === 'c' && selectedNodeId.current) {
        event.preventDefault();
        const selectedNode = nodes.find(node => node.id === selectedNodeId.current) as CustomNodeType;
        if (selectedNode && selectedNode.data.type !== 'markdown-file') {
          // MD文件节点不可复制以保证唯一性
          copiedNode.current = selectedNode;
        }
      }
      
      // Ctrl+V 粘贴节点
      if (event.ctrlKey && event.key === 'v' && copiedNode.current) {
        event.preventDefault();
        
        // 保存当前状态到历史记录
        const { past } = historyRef.current;
        const newPast = [...past, { nodes: JSON.parse(JSON.stringify(nodes)), edges: JSON.parse(JSON.stringify(edges)) }];
        const limitedPast = newPast.length > 20 ? newPast.slice(-20) : newPast;
        
        historyRef.current = {
          past: limitedPast,
          future: []
        };
        
        // 创建新节点，位置稍微偏移
        const newNodeId = `${copiedNode.current.id}_copy_${Date.now()}`;
        const newNode: CustomNodeType = {
          ...copiedNode.current,
          id: newNodeId,
          position: {
            x: copiedNode.current.position.x + 50,
            y: copiedNode.current.position.y + 50,
          },
        };
        
        setNodes((nds) => [...nds, newNode]);
      }
      
      // Delete 删除选中节点或连线
      if (event.key === 'Delete') {
        event.preventDefault();
        if (selectedNodeId.current) {
          deleteSelectedNode();
        } else if (selectedEdgeId.current) {
          deleteSelectedEdge();
        }
      }
    };
    
    // 处理节点状态变化事件
    const handleNodeProcessedChange = (_event: Event) => {
      // 强制重新渲染节点
      setNodes((nds) => [...nds]);
    };
    
    // 处理强制更新节点事件
    const handleForceNodeUpdate = () => {
      // 强制重新渲染所有节点
      setNodes((nds) => [...nds]);
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('nodeProcessedChange', handleNodeProcessedChange);
    document.addEventListener('forceNodeUpdate', handleForceNodeUpdate);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('nodeProcessedChange', handleNodeProcessedChange);
      document.removeEventListener('forceNodeUpdate', handleForceNodeUpdate);
    };
  }, [undo, deleteSelectedNode, deleteSelectedEdge, nodes, edges, setNodes]);

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
      onEdgeClick={onEdgeClick}
      onPaneClick={onPaneClick}
      nodeTypes={nodeTypes}
      onDrop={onDrop}
      onDragOver={onDragOver}
      fitView
      attributionPosition="bottom-left"
      multiSelectionKeyCode={null}
      selectionKeyCode={null}
      deleteKeyCode={null}
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