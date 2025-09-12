import { useState, useCallback, useEffect } from 'react'
import {
  Box,
  Flex,
  useColorMode,
  useColorModeValue,
  IconButton,
  Button,
  Text,
  ChakraProvider,
  useToast,
  Spinner,
} from '@chakra-ui/react'
import { keyframes } from '@emotion/react'
import { MoonIcon, SunIcon } from '@chakra-ui/icons'
import { ReactFlowProvider } from 'reactflow'
import 'reactflow/dist/style.css'

import Sidebar from './components/Sidebar'
import FlowCanvas from './components/FlowCanvas'
import NodeSettingsPanel from './components/NodeSettingsPanel'
import ProjectList from './components/ProjectList'
import { CustomNode, Project } from './types'
import { getCurrentProject, saveProject, updateProjectFlow, setCurrentProject as saveCurrentProject } from './services/localStorage'
import theme from './theme'

// 保存动画关键帧
const saveAnimation = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`

function AppContent() { 
  const { colorMode, toggleColorMode } = useColorMode()
  const [selectedNode, setSelectedNode] = useState<CustomNode | null>(null)
  const [currentProject, setCurrentProject] = useState<Project | null>(null)
  const [showProjectList, setShowProjectList] = useState(false)
  const [tags, setTags] = useState<{id: string, name: string, color: string}[]>([])
  const [showMiniMap, setShowMiniMap] = useState(true)
  const [nodes, setNodes] = useState<CustomNode[]>([])
  const [edges, setEdges] = useState<any[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const toast = useToast()
  
  // 预先调用所有useColorModeValue hooks
  const savingBg = useColorModeValue('white', 'gray.800')
  const savingBorderColor = useColorModeValue('gray.200', 'gray.600')
  const savingTextColor = useColorModeValue('gray.600', 'gray.400')
  const iconButtonBg = useColorModeValue('white', 'gray.800')
  const iconButtonBorderColor = useColorModeValue('gray.200', 'gray.600')

  // 初始化应用
  useEffect(() => {
    const project = getCurrentProject()
    if (project) {
      setCurrentProject(project)
      setTags(project.tags || [])
      setNodes(project.flowData?.nodes || [])
      setEdges(project.flowData?.edges || [])
    } else {
      // 如果没有当前项目，显示项目列表
      setShowProjectList(true)
    }
  }, [])

  // 选择项目
  const handleProjectSelect = useCallback((project: Project) => {
    setCurrentProject(project)
    setTags(project.tags || [])
    setNodes(project.flowData?.nodes || [])
    setEdges(project.flowData?.edges || [])
    setShowProjectList(false)
    // 保存当前项目到localStorage
    saveCurrentProject(project.id)
  }, [])

  // 显示项目列表
  const handleShowProjectList = useCallback(() => {
    setShowProjectList(true)
  }, [])

  // 节点选择处理
  const handleNodeSelect = useCallback((node: CustomNode | null) => {
    // 备注和注释节点只能选中，不能展开详情页
    if (node && (node.data.type === 'comment' || node.data.type === 'modification')) {
      setSelectedNode(null)
      return
    }
    setSelectedNode(node)
  }, [])

  // 关闭面板
  const handleClosePanel = useCallback(() => {
    setSelectedNode(null)
  }, [])

  // 切换迷你地图
  const handleMiniMapToggle = useCallback(() => {
    setShowMiniMap(prev => !prev)
  }, [])

  // 标签变化处理
  const handleTagsChange = useCallback((newTags: {id: string, name: string, color: string}[]) => {
    setTags(newTags)
    if (currentProject) {
      const updatedProject = { ...currentProject, tags: newTags }
      saveProject(updatedProject)
      setCurrentProject(updatedProject)
    }
  }, [currentProject])

  // 流程变化处理
  const handleFlowChange = useCallback((newNodes: CustomNode[], newEdges: any[]) => {
    setNodes(newNodes)
    setEdges(newEdges)
    if (currentProject) {
      setIsSaving(true)
      updateProjectFlow(currentProject.id, newNodes, newEdges)
      setTimeout(() => setIsSaving(false), 1000)
    }
  }, [currentProject])

  // 手动保存项目数据
  const manualSaveProject = useCallback(() => {
    if (currentProject) {
      const updatedProject = {
        ...currentProject,
        flowData: { nodes, edges },
        tags,
        updatedAt: new Date()
      }
      saveProject(updatedProject)
      setCurrentProject(updatedProject)
      toast({
        title: '项目已保存',
        description: `项目 "${currentProject.name}" 保存成功`,
        status: 'success',
        duration: 2000,
        isClosable: true,
      })
    }
  }, [currentProject, nodes, edges, tags, toast])

  // 键盘快捷键
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.key === 's') {
        event.preventDefault()
        manualSaveProject()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [manualSaveProject])

  // 如果显示项目列表
  if (showProjectList) {
    return (
        <ProjectList onProjectSelect={handleProjectSelect} />
    )
  }

  // 如果没有当前项目
  if (!currentProject) {
    return (
        <Box p={4}>
          <Text>请选择一个项目</Text>
          <Button onClick={handleShowProjectList} mt={4}>
            选择项目
          </Button>
        </Box>
    )
  }

  return (
      <ReactFlowProvider>
        <Box h="100vh" bg={colorMode === 'light' ? 'gray.50' : 'gray.900'} position="relative">


          {/* 右上角保存状态和主题切换 */}
          <Box
            position="fixed"
            top={4}
            right={4}
            zIndex={1000}
            display="flex"
            alignItems="center"
            gap={2}
          >
            {isSaving && (
              <Box
                display="flex"
                alignItems="center"
                gap={1}
                bg={savingBg}
                px={2}
                py={1}
                borderRadius="md"
                boxShadow="sm"
                border="1px"
                borderColor={savingBorderColor}
              >
                <Spinner
                  size="xs"
                  color="blue.500"
                  css={{
                    animation: `${saveAnimation} 1s linear infinite`
                  }}
                />
                <Text fontSize="xs" color={savingTextColor}>
                  保存中...
                </Text>
              </Box>
            )}
            <IconButton
              aria-label="切换主题"
              icon={colorMode === 'light' ? <MoonIcon /> : <SunIcon />}
              onClick={toggleColorMode}
              variant="ghost"
              size="sm"
              bg={iconButtonBg}
              boxShadow="sm"
              border="1px"
              borderColor={iconButtonBorderColor}
            />
          </Box>
          
          {/* 主要内容区域 */}
          <Box h="100%">
            <Flex h="100%">
              {/* 左侧功能栏 */}
              <Sidebar 
                tags={tags} 
                onTagsChange={handleTagsChange} 
                showMiniMap={showMiniMap}
                onMiniMapToggle={handleMiniMapToggle}
                onBackToProjectList={() => setShowProjectList(true)}
                onNodeSelect={handleNodeSelect}
              />
              
              {/* 中间画布区域 */}
              <Box flex={1} position="relative">
                <FlowCanvas 
                  onNodeSelect={handleNodeSelect} 
                  tags={tags} 
                  showMiniMap={showMiniMap}
                  initialNodes={nodes}
                  initialEdges={edges}
                  onFlowChange={handleFlowChange}
                />
              </Box>
            </Flex>
          </Box>
          
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

function App() {
  return (
    <ChakraProvider theme={theme}>
      <AppContent />
    </ChakraProvider>
  )
}

export default App