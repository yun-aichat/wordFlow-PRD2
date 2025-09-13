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
  Modal,
  ModalOverlay,
  ModalContent,
  ModalBody,
  ModalHeader,
  ModalCloseButton,
  Image,
} from '@chakra-ui/react'
import { keyframes } from '@emotion/react'
import { MoonIcon, SunIcon } from '@chakra-ui/icons'
import { X } from 'lucide-react'
import { ReactFlowProvider } from 'reactflow'
import 'reactflow/dist/style.css'
import MDEditor from '@uiw/react-md-editor'

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
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [isImageModalOpen, setIsImageModalOpen] = useState(false)
  const [selectedMdFile, setSelectedMdFile] = useState<{name: string, content: string} | null>(null)
  const [isMdModalOpen, setIsMdModalOpen] = useState(false)
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

  // 监听来自CustomNode的图片展开事件
  useEffect(() => {
    const handleOpenImageModal = (event: CustomEvent) => {
      const { image } = event.detail
      setSelectedImage(image)
      setIsImageModalOpen(true)
    }

    window.addEventListener('openImageModal', handleOpenImageModal as EventListener)
    return () => {
      window.removeEventListener('openImageModal', handleOpenImageModal as EventListener)
    }
  }, [])

  // 监听来自NodeSettingsPanel的MD文件展开事件
  useEffect(() => {
    const handleOpenMdModal = (event: CustomEvent) => {
      const { name, content } = event.detail
      setSelectedMdFile({ name, content })
      setIsMdModalOpen(true)
    }

    window.addEventListener('openMdModal', handleOpenMdModal as EventListener)
    return () => {
      window.removeEventListener('openMdModal', handleOpenMdModal as EventListener)
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
    // 所有节点都可以打开设置面板
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

          {/* 图片放大查看模态框 */}
          <Modal isOpen={isImageModalOpen} onClose={() => setIsImageModalOpen(false)} size="6xl" isCentered>
            <ModalOverlay />
            <ModalContent bg="transparent" boxShadow="none" display="flex" alignItems="center" justifyContent="center">
              <ModalBody p={0} position="relative" display="flex" alignItems="center" justifyContent="center">
                <IconButton
                  aria-label="关闭"
                  icon={<X size={20} />}
                  position="absolute"
                  top={4}
                  right={4}
                  zIndex={1}
                  colorScheme="whiteAlpha"
                  variant="solid"
                  onClick={() => setIsImageModalOpen(false)}
                />
                {selectedImage && (
                  <Image
                    src={selectedImage}
                    alt="放大查看"
                    maxH="90vh"
                    maxW="90vw"
                    objectFit="contain"
                    borderRadius="md"
                    crossOrigin="anonymous"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      console.warn('图片预览加载失败:', selectedImage)
                      const target = e.target as HTMLImageElement
                      target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjRjdGQUZDIiBzdHJva2U9IiNFMkU4RjAiIHN0cm9rZS13aWR0aD0iMiIvPgo8dGV4dCB4PSIyMDAiIHk9IjE1MCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0iIzlDQTNBRiIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjE2Ij7lm77niYfliqDovb3lpLHotKU8L3RleHQ+Cjx0ZXh0IHg9IjIwMCIgeT0iMTgwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjOUNBM0FGIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTIiPuWPr+iDveWtmOWcqOi3qOWfn+mZkOWItuaIluWbvueJh+acjeWKoeWZqOmXrumimDwvdGV4dD4KPC9zdmc+'
                      target.alt = '图片加载失败 - 可能存在跨域限制'
                      target.style.opacity = '0.7'
                    }}
                  />
                )}
              </ModalBody>
            </ModalContent>
          </Modal>

          {/* MD文件放大展示模态框 */}
          <Modal isOpen={isMdModalOpen} onClose={() => setIsMdModalOpen(false)} size="6xl" isCentered>
            <ModalOverlay />
            <ModalContent maxH="90vh">
              <ModalHeader>
                {selectedMdFile?.name || 'MD文件预览'}
              </ModalHeader>
              <ModalCloseButton />
              <ModalBody pb={6} overflow="auto">
                {selectedMdFile && (
                  <MDEditor
                    value={selectedMdFile.content}
                    onChange={() => {}} // 只读模式
                    preview="preview"
                    hideToolbar
                    visibleDragbar={false}
                    data-color-mode={useColorModeValue('light', 'dark')}
                    height={600}
                  />
                )}
              </ModalBody>
            </ModalContent>
          </Modal>
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