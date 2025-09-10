import React, { useState, useCallback } from 'react'
import {
  Box,
  Flex,
  useColorMode,
  IconButton,
} from '@chakra-ui/react'
import { MoonIcon, SunIcon } from '@chakra-ui/icons'
import { ReactFlowProvider } from 'reactflow'
import 'reactflow/dist/style.css'

import Sidebar from './components/Sidebar'
import FlowCanvas from './components/FlowCanvas'
import NodeSettingsPanel from './components/NodeSettingsPanel'
import { CustomNode } from './types'

function App() {
  const { colorMode, toggleColorMode } = useColorMode()
  const [selectedNode, setSelectedNode] = useState<CustomNode | null>(null)
  const [tags, setTags] = useState<{name: string, color: string}[]>([
    {name: '重要', color: 'red'},
    {name: '待办', color: 'blue'},
    {name: '已完成', color: 'green'},
    {name: '问题', color: 'orange'},
    {name: '想法', color: 'purple'},
    {name: '优化', color: 'teal'}
  ])
  const [showMiniMap, setShowMiniMap] = useState(true)

  const handleNodeSelect = useCallback((node: CustomNode | null) => {
    // 备注节点不展开设置面板，直接在节点上编辑
    if (node && node.data.type === 'comment') {
      return
    }
    setSelectedNode(node)
  }, [])

  const handleClosePanel = useCallback(() => {
    setSelectedNode(null)
  }, [])

  const handleMiniMapToggle = useCallback(() => {
    setShowMiniMap(prev => !prev)
  }, [])

  return (
    <ReactFlowProvider>
      <Box h="100vh" w="100vw" position="relative">
        {/* 主题切换按钮 */}
        <IconButton
          aria-label="切换主题"
          icon={colorMode === 'light' ? <MoonIcon /> : <SunIcon />}
          onClick={toggleColorMode}
          position="absolute"
          top={4}
          right={4}
          zIndex={1000}
          size="sm"
        />
        
        <Flex h="100%">
          {/* 左侧功能栏 */}
          <Sidebar 
            tags={tags} 
            onTagsChange={setTags} 
            showMiniMap={showMiniMap}
            onMiniMapToggle={handleMiniMapToggle}
          />
          
          {/* 中间画布区域 */}
          <Box flex={1} position="relative">
            <FlowCanvas onNodeSelect={handleNodeSelect} tags={tags} showMiniMap={showMiniMap} />
          </Box>
        </Flex>
        
        {/* 右侧节点设置面板 */}
        {selectedNode && (
          <NodeSettingsPanel
            selectedNode={selectedNode}
            onNodeUpdate={setSelectedNode}
            onClose={handleClosePanel}
            tags={tags}
          />
        )}
      </Box>
    </ReactFlowProvider>
  )
}

export default App