import React, { useState, useEffect, useCallback, useRef } from 'react'
import {
  Box,
  VStack,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  Button,
  HStack,
  Text,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  useColorModeValue,
  Card,
  CardHeader,
  CardBody,
  IconButton,
  useToast,
  Image,
  AspectRatio,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalBody,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Switch,
  Badge,
  Divider,
  Flex,
  Spacer,
  Spinner,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  useDisclosure,
  ModalHeader,
  ModalFooter,
  ModalCloseButton,
  Tooltip,
  Link
} from '@chakra-ui/react'
// FIX: 修复图标导入，添加缺失的图标
import { CloseIcon, CopyIcon, ViewIcon, ViewOffIcon, DownloadIcon, AttachmentIcon, DeleteIcon } from '@chakra-ui/icons'
import { Upload, X, Maximize2, FileText, Trash2, Paperclip, Image as ImageIcon, MapPin } from 'lucide-react'
import MDEditor from '@uiw/react-md-editor'
import { useReactFlow } from 'reactflow'
import { CustomNode, NodeFormData } from '../types'
// import TagInput from './TagInput'
import MarkdownEditor from './MarkdownEditor'

interface NodeSettingsPanelProps {
  selectedNode: CustomNode | null
  onNodeUpdate: (node: CustomNode | null) => void
  onClose: () => void
  tags: {id: string, name: string, color: string}[]
}

const NodeSettingsPanel: React.FC<NodeSettingsPanelProps> = ({
  selectedNode,
  onNodeUpdate,
  onClose,
  tags,
}) => {
  const [formData, setFormData] = useState<NodeFormData>({
    name: '',
    content: '',
    description: '',
  })
  // FIX: 删除未使用的变量
  const [isExpanded] = useState(false)
  const [isFullscreenModalOpen, setIsFullscreenModalOpen] = useState(false)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [isImageModalOpen, setIsImageModalOpen] = useState(false)
  // FIX: 删除未使用的tabIndex变量
  const [files, setFiles] = useState<{ name: string; url: string; size?: number; type?: string }[]>([])
  const [mdFileContent, setMdFileContent] = useState<string | null>(null)
  const [activeTabIndex, setActiveTabIndex] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const attachmentInputRef = useRef<HTMLInputElement>(null) // FIX: 恢复attachmentInputRef，因为代码中有使用
  const autoSaveTimeoutRef = useRef<number | null>(null)
  const mdContentBoxRef = useRef<HTMLDivElement>(null)
  const reactFlowInstance = useReactFlow()
  const toast = useToast()
  const bgColor = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.600')

  // 当选中节点变化时，更新表单数据
  useEffect(() => {
    if (selectedNode) {
      setFormData({
        name: selectedNode.data.name,
        content: selectedNode.data.content || '', // FIX: 修复类型错误，添加默认值
        description: selectedNode.data.description || '',
      })
      setSelectedImage(selectedNode.data.image || null)
      setFiles(selectedNode.data.files || [])
    }
  }, [selectedNode])

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

  // 获取项目中的MD文件内容
  useEffect(() => {
    const allNodes = reactFlowInstance.getNodes() as CustomNode[]
    const markdownNode = allNodes.find(node => node.data.type === 'markdown-file')
    
    if (markdownNode && markdownNode.data.markdownFile?.content) {
      setMdFileContent(markdownNode.data.markdownFile.content)
    } else {
      setMdFileContent(null)
    }
  }, [reactFlowInstance])

  // 监听节点变化，实时更新MD文件内容
  useEffect(() => {
    const handleNodesChange = () => {
      const allNodes = reactFlowInstance.getNodes() as CustomNode[]
      const markdownNode = allNodes.find(node => node.data.type === 'markdown-file')
      
      if (markdownNode && markdownNode.data.markdownFile?.content) {
        setMdFileContent(markdownNode.data.markdownFile.content)
      } else {
        setMdFileContent(null)
      }
    }

    // 监听节点变化事件
    const unsubscribe = reactFlowInstance.onNodesChange?.(handleNodesChange)
    
    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe()
      }
    }
  }, [reactFlowInstance])

  // 定位到MD文件中的标题
  const handleLocateInMD = useCallback((nodeName: string) => {
    if (!mdFileContent || !nodeName.trim()) {
      toast({
        title: '定位失败',
        description: '节点名称为空或未找到MD文件',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      })
      return
    }

    // 搜索所有级别的标题 (h1-h6)
    const headingRegex = new RegExp(`^#{1,6}\\s+.*${nodeName.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&')}.*$`, 'mi')
    const match = mdFileContent.match(headingRegex)
    
    if (match) {
      // 找到匹配的标题，滚动到对应位置
      const lines = mdFileContent.split('\\n')
      const lineIndex = lines.findIndex(line => headingRegex.test(line))
      
      if (lineIndex !== -1) {
        // 创建一个临时的标记来高亮显示找到的标题
        // 使用唯一ID避免多次定位时的冲突
        const uniqueId = `located-heading-${Date.now()}`
        const highlightedContent = mdFileContent.replace(
          headingRegex,
          (match) => `<mark id="${uniqueId}" style="background-color: yellow; padding: 2px 4px; border-radius: 3px;">${match}</mark>`
        )
        setMdFileContent(highlightedContent)
        
        // 滚动到定位的内容
        setTimeout(() => {
          if (mdContentBoxRef.current) {
            const locatedElement = mdContentBoxRef.current.querySelector(`#${uniqueId}`)
            if (locatedElement) {
              locatedElement.scrollIntoView({ behavior: 'smooth', block: 'start' })
            }
          }
          
          // 3秒后恢复原始内容，但保持滚动位置
          setTimeout(() => {
            setMdFileContent(mdFileContent)
          }, 3000)
        }, 100) // 短暂延迟确保DOM已更新
        
        toast({
          title: '定位成功',
          description: `已找到标题"${match[0].replace(/^#+\\s*/, '')}"`,
          status: 'success',
          duration: 3000,
          isClosable: true,
        })
      }
    } else {
      toast({
        title: '定位失败',
        description: `未找到包含"${nodeName}"的标题`,
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
    }
  }, [mdFileContent, toast])

   // 当切换到PRD查看页面时自动定位（仅首次进入时执行一次）
   const firstTabChangeRef = useRef(true);
   useEffect(() => {
     if (activeTabIndex === 2 && formData.name && mdFileContent && firstTabChangeRef.current) { // PRD查看是第3个tab (index=2)
       // 延迟执行定位，确保页面已渲染
       const timer = setTimeout(() => {
         handleLocateInMD(formData.name)
         firstTabChangeRef.current = false; // 标记已执行过定位，不再重复执行
       }, 100)
       
       return () => clearTimeout(timer)
     }
   }, [activeTabIndex, formData.name, mdFileContent, handleLocateInMD])
 
   // FIX: 删除未使用的粘贴事件监听器代码

  // 自动保存功能
  useEffect(() => {
    if (!selectedNode) return

    // 清除之前的定时器
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current)
    }

    // 设置新的定时器，1秒后自动保存
    autoSaveTimeoutRef.current = window.setTimeout(() => { // FIX: 修复setTimeout类型错误
      const updatedNode: CustomNode = {
        ...selectedNode,
        data: {
          ...selectedNode.data,
          name: formData.name,
          content: formData.content,
          description: formData.description,
          image: selectedImage || undefined,
          files: files,
        },
      }

      // 更新 React Flow 中的节点
      reactFlowInstance.setNodes((nodes) =>
        nodes.map((node) =>
          node.id === selectedNode.id ? updatedNode : node
        )
      )

      onNodeUpdate(updatedNode)
    }, 1000)

    // 清理函数
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current)
      }
    }
  }, [formData, selectedImage, files, selectedNode, reactFlowInstance, onNodeUpdate])

  const handleInputChange = (field: keyof NodeFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleImageFile = async (file: File) => {
    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await fetch('/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Image upload failed');
      }

      const data = await response.json();
      setSelectedImage(data.imageUrl);
      toast({
        title: '图片上传成功',
        status: 'success',
        duration: 2000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: '图片上传失败',
        description: '请检查后端服务是否正常运行。',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleImagePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const items = e.clipboardData?.items;
    if (items) {
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.indexOf('image') !== -1) {
          const file = item.getAsFile();
          if (file) {
            handleImageFile(file);
          }
          break;
        }
      }
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleImageFile(file);
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      try {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('originalName', file.name)
        
        toast({
          title: '正在上传文件',
          description: `${file.name}`,
          status: 'loading',
          duration: 2000,
          isClosable: true,
        })
        
        const response = await fetch('/upload-file', {
          method: 'POST',
          body: formData,
        })
        
        if (!response.ok) {
          throw new Error('文件上传失败')
        }
        
        const data = await response.json()
        setFiles(prev => [...prev, { 
          name: data.fileName, 
          url: data.fileUrl,
          size: data.fileSize,
          type: data.fileType
        }])
        
        toast({
          title: '文件上传成功',
          description: `${file.name}`,
          status: 'success',
          duration: 2000,
          isClosable: true,
        })
      } catch (error) {
        console.error('Error uploading file:', error)
        toast({
          title: '文件上传失败',
          description: '请检查后端服务是否正常运行',
          status: 'error',
          duration: 3000,
          isClosable: true,
        })
      }
    }
  }

  const handleFileDownload = (file: { name: string; url: string }) => {
    // 如果是服务器上的文件，使用完整URL
    const fileUrl = file.url.startsWith('http') ? file.url : `http://localhost:3001${file.url}`
    
    // 创建下载链接
    const link = document.createElement('a')
    link.href = fileUrl
    link.download = file.name
    link.target = '_blank'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    toast({
      title: '文件下载中',
      description: `${file.name}`,
      status: 'info',
      duration: 2000,
      isClosable: true,
    })
  }

  const handleFileDelete = (fileName: string) => {
    setFiles(prev => prev.filter(f => f.name !== fileName))
  }

  const handleToggleDisabled = () => {
    if (!selectedNode) return

    const updatedNode: CustomNode = {
      ...selectedNode,
      data: {
        ...selectedNode.data,
        disabled: !selectedNode.data.disabled,
      },
    }

    reactFlowInstance.setNodes((nodes) =>
      nodes.map((node) =>
        node.id === selectedNode.id ? updatedNode : node
      )
    )

    onNodeUpdate(updatedNode)
  }

  const handleSave = () => {
    if (!selectedNode) return

    const updatedNode: CustomNode = {
      ...selectedNode,
      data: {
        ...selectedNode.data,
        name: formData.name,
        content: formData.content,
        description: formData.description,
        image: selectedImage || undefined,
      },
    }

    // 更新 React Flow 中的节点
    reactFlowInstance.setNodes((nodes) =>
      nodes.map((node) =>
        node.id === selectedNode.id ? updatedNode : node
      )
    )

    onNodeUpdate(updatedNode)
    
    toast({
      title: '保存成功',
      description: '节点信息已更新',
      status: 'success',
      duration: 2000,
      isClosable: true,
    })
  }

  const handleDelete = () => {
    if (!selectedNode) return

    // 删除节点和相关连线
    reactFlowInstance.deleteElements({
      nodes: [{ id: selectedNode.id }],
      edges: [],
    })

    onClose()
    
    toast({
      title: '删除成功',
      description: '节点已删除',
      status: 'info',
      duration: 2000,
      isClosable: true,
    })
  }

  const handleTypeChange = (newType: 'page' | 'modal' | 'overview' | 'requirement') => {
    if (!selectedNode) return

    const updatedNode: CustomNode = {
      ...selectedNode,
      data: {
        ...selectedNode.data,
        type: newType,
      },
    }

    reactFlowInstance.setNodes((nodes) =>
      nodes.map((node) =>
        node.id === selectedNode.id ? updatedNode : node
      )
    )

    onNodeUpdate(updatedNode)
  }

  if (!selectedNode) {
    return null
  }

  // MD文件节点的特殊设置界面
  if (selectedNode.data.type === 'markdown-file') {
    return (
      <Card
        position="fixed"
        top={4}
        right={4}
        bottom={4}
        width="400px"
        maxHeight="calc(100vh - 32px)"
        bg={bgColor}
        border="1"
        borderColor={borderColor}
        shadow="lg"
        zIndex={1000}
        display="flex"
        flexDirection="column"
      >
        <CardHeader pb={2}>
          <HStack justify="space-between" align="center">
            <Text fontSize="lg" fontWeight="bold">
              MD文件设置
            </Text>
            <IconButton
              aria-label="关闭"
              icon={<CloseIcon />}
              size="sm"
              variant="ghost"
              onClick={onClose}
            />
          </HStack>
        </CardHeader>

        <CardBody pt={0} flex={1} overflowY="auto" pb={0}>
          <VStack spacing={4} align="stretch" h="100%">
            {/* 名称设置 */}
              <FormControl size="sm">
                <FormLabel fontSize="sm" mb={2}>
                   <HStack spacing={2}>
                     <Text fontSize="sm">📄</Text>
                     <Text>文档名称</Text>
                   </HStack>
                 </FormLabel>
                <Input
                  size="sm"
                  value={formData.name || ''}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="输入MD文件节点名称"
                  borderRadius="md"
                />
              </FormControl>

            {/* MD文件上传和预览区域 */}
            <FormControl size="sm" flex={1}>
              <FormLabel fontSize="sm">MD文件</FormLabel>
              <Box
                border="1px"
                borderColor={borderColor}
                borderRadius="md"
                p={4}
                h="calc(100vh - 200px)"
                display="flex"
                flexDirection="column"
              >
                {selectedNode.data.markdownFile ? (
                  <VStack spacing={3} align="stretch" h="100%">
                    <HStack justify="space-between">
                      <Text fontSize="sm" fontWeight="medium">
                        {selectedNode.data.markdownFile.name}
                      </Text>
                      <HStack>
                        <Button
                          size="xs"
                          leftIcon={<DownloadIcon />}
                          onClick={() => {
                            const blob = new Blob([selectedNode.data.markdownFile.content], { type: 'text/markdown' })
                            const url = URL.createObjectURL(blob)
                            const a = document.createElement('a')
                            a.href = url
                            a.download = selectedNode.data.markdownFile.name
                            a.click()
                            URL.revokeObjectURL(url)
                          }}
                        >
                          下载
                        </Button>
                        <Button
                          size="xs"
                          colorScheme="blue"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          替换
                        </Button>
                      </HStack>
                    </HStack>
                    
                    {/* MD文件预览 */}
                    <Box
                      flex={1}
                      border="1px"
                      borderColor={borderColor}
                      borderRadius="md"
                      overflow="hidden"
                    >
                      <MDEditor
                        value={selectedNode.data.markdownFile.content}
                        onChange={() => {}} // 只读模式
                        preview="preview"
                        hideToolbar
                        visibleDragBar={false}
                        data-color-mode={useColorModeValue('light', 'dark')}
                      />
                    </Box>
                  </VStack>
                ) : (
                  <VStack
                    spacing={4}
                    align="center"
                    justify="center"
                    h="100%"
                    border="2px"
                    borderStyle="dashed"
                    borderColor={borderColor}
                    borderRadius="md"
                    bg={useColorModeValue('gray.50', 'gray.700')}
                  >
                    <Upload size={48} opacity={0.5} />
                    <VStack spacing={2}>
                      <Text fontSize="sm" color="gray.500">
                        点击上传MD文件
                      </Text>
                      <Button
                        size="sm"
                        colorScheme="blue"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        选择文件
                      </Button>
                    </VStack>
                  </VStack>
                )}
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".md,.markdown"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                     if (file) {
                       // 检查文件类型
                       if (!file.name.toLowerCase().endsWith('.md')) {
                         toast({
                           title: '文件类型错误',
                           description: '请选择 .md 格式的文件',
                           status: 'error',
                           duration: 3000,
                           isClosable: true,
                         })
                         return
                       }
                       
                       const reader = new FileReader()
                       reader.onload = (event) => {
                         const content = event.target?.result as string
                         // 获取不带扩展名的文件名作为节点名称
                         const fileNameWithoutExt = file.name.replace(/\.[^/.]+$/, "")
                         
                         const updatedNode: CustomNode = {
                           ...selectedNode,
                           data: {
                             ...selectedNode.data,
                             name: fileNameWithoutExt, // 自动设置节点名称为文件名
                             markdownFile: {
                               name: file.name,
                               content: content,
                               size: file.size
                             }
                           }
                         }
                         reactFlowInstance.setNodes((nodes) =>
                           nodes.map((node) =>
                             node.id === selectedNode.id ? updatedNode : node
                           )
                         )
                         onNodeUpdate(updatedNode)
                         toast({
                           title: 'MD文件上传成功',
                           description: `文件 ${file.name} 已加载`,
                           status: 'success',
                           duration: 2000,
                           isClosable: true,
                         })
                       }
                       reader.readAsText(file)
                     }
                  }}
                />
              </Box>
            </FormControl>
          </VStack>
        </CardBody>
        
        {/* 底部按键区域 */}
        <Box p={4} borderTop="1px" borderColor={borderColor}>
          <HStack spacing={2}>
            <Button size="sm" colorScheme="blue" flex={1} onClick={handleSave}>
              保存
            </Button>
            <Button size="sm" colorScheme="red" variant="outline" flex={1} onClick={handleDelete}>
              删除
            </Button>
          </HStack>
        </Box>
      </Card>
    )
  }

  return (
    <>
      <Card
        position="fixed"
        top={4}
        right={4}
        bottom={4}
        width="400px"
        maxHeight="calc(100vh - 32px)"
        bg={bgColor}
        border="1"
        borderColor={borderColor}
        shadow="lg"
        zIndex={1000}
        display="flex"
        flexDirection="column"
      >
      <CardHeader pb={2}>
        <HStack justify="space-between" align="center">
          <Text fontSize="lg" fontWeight="bold">
            节点设置
          </Text>
          <HStack spacing={1}>
            <IconButton
              aria-label={selectedNode?.data.disabled ? "启用节点" : "禁用节点"}
              icon={selectedNode?.data.disabled ? <ViewOffIcon /> : <ViewIcon />}
              size="sm"
              variant="ghost"
              color={selectedNode?.data.disabled ? "gray.400" : "gray.600"}
              onClick={handleToggleDisabled}
            />
            <IconButton
              aria-label="关闭"
              icon={<CloseIcon />}
              size="sm"
              variant="ghost"
              onClick={onClose}
            />
          </HStack>
        </HStack>
        </CardHeader>

      <CardBody pt={0} flex={1} overflowY="auto" pb={0}>
          <Tabs size="sm" variant="enclosed" index={activeTabIndex} onChange={setActiveTabIndex}>
            <TabList>
                <Tab>基本信息</Tab>
                <Tab>内容详情</Tab>
                <Tab>PRD查看</Tab>
                <Tab>附件</Tab>
              </TabList>

            <TabPanels>
              <TabPanel px={0} py={3}>
                <VStack spacing={3} align="stretch" h="100%">
                  {/* 名称 */}
                  <FormControl size="sm">
                    <FormLabel fontSize="sm">名称</FormLabel>
                    <HStack spacing={0}>
                      <Menu>
                        <MenuButton
                          as={IconButton}
                          aria-label="选择类型"
                          icon={<Text fontSize="lg">{selectedNode.data.type === 'page' ? '💻' :
                            selectedNode.data.type === 'modal' ? '📰' :
                            selectedNode.data.type === 'overview' ? '🌍' :
                            selectedNode.data.type === 'requirement' ? '📝' :
                            selectedNode.data.type === 'markdown-file' ? '📄' : '💡'
                          }</Text>}
                          size="sm"
                          variant="ghost"
                          borderRadius="md 0 0 md"
                          borderRight="1px"
                          borderColor="gray.200"
                          _hover={{ bg: "gray.50" }}
                        />
                        <MenuList>
                          <MenuItem onClick={() => handleTypeChange('page')}>
                            <HStack spacing={2}>
                              <Text>💻</Text>
                              <Text>页面</Text>
                            </HStack>
                          </MenuItem>
                          <MenuItem onClick={() => handleTypeChange('modal')}>
                            <HStack spacing={2}>
                              <Text>📰</Text>
                              <Text>弹窗</Text>
                            </HStack>
                          </MenuItem>
                          <MenuItem onClick={() => handleTypeChange('overview')}>
                            <HStack spacing={2}>
                              <Text>🌍</Text>
                              <Text>全局概览</Text>
                            </HStack>
                          </MenuItem>
                          <MenuItem onClick={() => handleTypeChange('requirement')}>
                            <HStack spacing={2}>
                              <Text>📝</Text>
                              <Text>需求描述</Text>
                            </HStack>
                          </MenuItem>

                        </MenuList>
                      </Menu>
                      <Input
                        size="sm"
                        value={formData.name || ''} // FIX: 修复受控组件警告，确保value始终为字符串
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        placeholder="输入节点名称"
                        borderRadius="0 md md 0"
                        borderLeft="none"
                        flex={1}
                      />
                    </HStack>
                  </FormControl>

                  {/* 图片上传 */}
                  <FormControl size="sm">
                    <FormLabel fontSize="sm">图片</FormLabel>
                    <VStack spacing={2} align="stretch">
                      {selectedImage && (
                        <Box position="relative" maxW="200px" role="group">
                          <AspectRatio ratio={16/9}>
                            <Image
                              src={selectedImage}
                              alt="节点图片"
                              borderRadius="md"
                              objectFit="cover"
                              cursor="pointer"
                              onClick={() => setIsImageModalOpen(true)}
                            />
                          </AspectRatio>
                          <IconButton
                             aria-label="删除图片"
                             icon={<X size={12} />}
                             size="xs"
                             position="absolute"
                             top={1}
                             right={1}
                             bg="rgba(0, 0, 0, 0.5)"
                             color="white"
                             variant="solid"
                             borderRadius="full"
                             opacity={0}
                             _groupHover={{ opacity: 1 }}
                             _hover={{ bg: "rgba(0, 0, 0, 0.7)" }}
                             transition="opacity 0.2s"
                             onClick={() => setSelectedImage(null)}
                           />
                        </Box>
                      )}
                      <HStack>
                        <Input
                          size="sm"
                          value="" // FIX: 修复受控组件警告，添加空字符串value
                          placeholder="粘贴图片或点击右侧按钮上传"
                          onPaste={handleImagePaste}
                          readOnly // FIX: 设置为只读，因为只用于粘贴功能
                          flex={1}
                        />
                        <IconButton
                          aria-label="上传图片"
                          icon={<Upload size={14} />}
                          size="sm"
                          variant="outline"
                          onClick={() => fileInputRef.current?.click()}
                        />
                      </HStack>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={handleImageUpload}
                      />
                    </VStack>
                  </FormControl>

                  {/* 描述 */}
                  <FormControl size="sm" flex={1}>
                    <FormLabel fontSize="sm">描述</FormLabel>
                    <Textarea
                      size="sm"
                      value={formData.description || ''} // FIX: 修复受控组件警告，确保value始终为字符串
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      placeholder="输入节点描述（可选）"
                      rows={3}
                      resize="vertical"
                    />
                  </FormControl>
                </VStack>
              </TabPanel>

              <TabPanel px={0} py={3}>
                <VStack spacing={3} align="stretch">
                  <FormControl size="sm">
                    <HStack justify="space-between" align="center" mb={2}>
                      <FormLabel fontSize="sm" mb={0}>PRD内容</FormLabel>
                      <HStack spacing={1}>
                        <IconButton
                          aria-label="全屏预览"
                          icon={<Maximize2 size={14} />}
                          size="xs"
                          variant="ghost"
                          onClick={() => setIsFullscreenModalOpen(true)}
                        />
                      </HStack>
                    </HStack>
                    
                    <Box height={isExpanded ? "500px" : "300px"}>
                      <MarkdownEditor
                        value={formData.content || ''} // FIX: 修复受控组件警告，确保value始终为字符串
                        onChange={(value) => handleInputChange('content', value)}
                        placeholder="支持 Markdown 格式和标签引用 {标签名}。输入 { 可触发标签自动补全"
                        tags={tags}
                      />
                    </Box>
                  </FormControl>
                </VStack>
              </TabPanel>
              
              {/* PRD查看面板 */}
              <TabPanel px={0} py={3}>
                <VStack spacing={3} align="stretch">
                  {/* 节点名称编辑 */}
                  <FormControl size="sm">
                    <FormLabel fontSize="sm">节点名称</FormLabel>
                    <HStack spacing={2}>
                      <Input
                        size="sm"
                        value={formData.name || ''}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        placeholder="输入节点名称"
                        flex={1}
                      />
                      <IconButton
                        aria-label="定位到MD文件中的标题"
                        icon={<MapPin size={16} />}
                        size="sm"
                        variant="outline"
                        onClick={() => handleLocateInMD(formData.name || '')}
                      />
                    </HStack>
                  </FormControl>
                  
                  {/* MD文件内容显示 */}
                  <FormControl size="sm">
                    <FormLabel fontSize="sm">连接的MD文件</FormLabel>
                    <Box 
                      ref={mdContentBoxRef}
                      borderWidth="1px" 
                      borderRadius="md" 
                      p={3}
                      maxH="400px"
                      overflowY="auto"
                      bg={useColorModeValue('gray.50', 'gray.700')}
                    >
                      {mdFileContent ? (
                        <MDEditor.Markdown 
                          source={mdFileContent} 
                          style={{ 
                            backgroundColor: 'transparent',
                            color: useColorModeValue('black', 'white')
                          }}
                        />
                      ) : (
                        <Text fontSize="sm" color="gray.500" textAlign="center">
                          暂无连接的MD文件
                        </Text>
                      )}
                    </Box>
                  </FormControl>
                </VStack>
              </TabPanel>
              
              {/* 附件面板 */}
              <TabPanel px={0} py={3}>
                <VStack spacing={3} align="stretch">
                  <FormControl size="sm">
                    <FormLabel fontSize="sm">文件附件</FormLabel>
                    <VStack spacing={2} align="stretch">
                      {files.length > 0 ? (
                        <Box borderWidth="1px" borderRadius="md" p={2}>
                          <VStack spacing={2} align="stretch">
                            {files.map((file, index) => (
                              <HStack key={index} justify="space-between" p={2} borderRadius="md" bg={useColorModeValue('gray.50', 'gray.700')}>
                                <HStack spacing={2}>
                                  <FileText size={16} />
                                  <Text fontSize="sm" noOfLines={1} maxW="150px">
                                    {file.name}
                                  </Text>
                                  {file.size && (
                                    <Text fontSize="xs" color="gray.500">
                                      {(file.size / 1024).toFixed(1)} KB
                                    </Text>
                                  )}
                                </HStack>
                                <HStack>
                                  <IconButton
                                    aria-label="下载文件"
                                    icon={<DownloadIcon />}
                                    size="xs"
                                    variant="ghost"
                                    onClick={() => handleFileDownload(file)}
                                  />
                                  <IconButton
                                    aria-label="删除文件"
                                    icon={<Trash2 size={14} />}
                                    size="xs"
                                    variant="ghost"
                                    colorScheme="red"
                                    onClick={() => handleFileDelete(file.name)}
                                  />
                                </HStack>
                              </HStack>
                            ))}
                          </VStack>
                        </Box>
                      ) : (
                        <Box 
                          borderWidth="1px" 
                          borderRadius="md" 
                          borderStyle="dashed" 
                          p={4} 
                          textAlign="center"
                          bg={useColorModeValue('gray.50', 'gray.700')}
                        >
                          <VStack spacing={2}>
                            <Paperclip size={24} opacity={0.5} />
                            <Text fontSize="sm" color="gray.500">暂无附件</Text>
                          </VStack>
                        </Box>
                      )}
                      
                      <Button
                        leftIcon={<AttachmentIcon />}
                        size="sm"
                        onClick={() => attachmentInputRef.current?.click()}
                      >
                        上传附件
                      </Button>
                      <input
                        ref={attachmentInputRef}
                        type="file"
                        style={{ display: 'none' }}
                        onChange={handleFileSelect}
                      />
                    </VStack>
                  </FormControl>
                </VStack>
              </TabPanel>
            </TabPanels>
          </Tabs>
        </CardBody>
        
        {/* 底部按键区域 */}
        <Box p={4} borderTop="1px" borderColor={borderColor}>
          <HStack spacing={2}>
            <Button size="sm" colorScheme="blue" flex={1} onClick={handleSave}>
              保存
            </Button>
            <Button size="sm" colorScheme="red" variant="outline" flex={1} onClick={handleDelete}>
              删除
            </Button>
          </HStack>
        </Box>
      </Card>
      
      {/* 图片展开查看Modal */}
      <Modal isOpen={isImageModalOpen} onClose={() => setIsImageModalOpen(false)} size="full">
        <ModalOverlay bg="rgba(0, 0, 0, 0.8)" />
        <ModalContent bg="transparent" boxShadow="none">
          <ModalBody p={0} display="flex" alignItems="center" justifyContent="center" position="relative">
            <Image
              src={selectedImage || ''}
              alt="展开图片"
              maxH="90vh"
              maxW="90vw"
              objectFit="contain"
            />
            <IconButton
              aria-label="关闭图片预览"
              icon={<X size={20} />}
              position="absolute"
              top={4}
              right={4}
              bg="rgba(0, 0, 0, 0.5)"
              color="white"
              variant="solid"
              borderRadius="full"
              _hover={{ bg: "rgba(0, 0, 0, 0.7)" }}
              onClick={() => setIsImageModalOpen(false)}
            />
          </ModalBody>
        </ModalContent>
      </Modal>
      
      {/* PRD内容全屏预览Modal */}
      <Modal isOpen={isFullscreenModalOpen} onClose={() => setIsFullscreenModalOpen(false)} size="full">
        <ModalOverlay bg="rgba(0, 0, 0, 0.8)" />
        <ModalContent bg={bgColor} m={4} borderRadius="lg">
          <Box p={6} h="100%" display="flex" flexDirection="column">
            {/* 头部 */}
            <HStack justify="space-between" align="center" mb={4}>
              <Text fontSize="xl" fontWeight="bold">
                PRD内容 - {selectedNode?.data.name || '未命名节点'}
              </Text>
              <HStack spacing={2}>
                <Button
                  size="sm"
                  leftIcon={<CopyIcon />}
                  variant="outline"
                  onClick={() => {
                    navigator.clipboard.writeText(formData.content || '')
                    toast({
                      title: '复制成功',
                      description: 'PRD内容已复制到剪贴板',
                      status: 'success',
                      duration: 2000,
                      isClosable: true,
                    })
                  }}
                >
                  复制内容
                </Button>
                <IconButton
                  aria-label="关闭"
                  icon={<CloseIcon />}
                  size="sm"
                  variant="ghost"
                  onClick={() => setIsFullscreenModalOpen(false)}
                />
              </HStack>
            </HStack>
            
            {/* 内容区域 */}
            <Box flex={1}>
              {/* FIX: 删除不存在的enableImagePaste属性 */}
              <MarkdownEditor
                value={formData.content || ''}
                onChange={(value) => handleInputChange('content', value)}
                placeholder="支持 Markdown 格式和标签引用 {标签名}。输入 { 可触发标签自动补全"
                tags={tags}
                height={window.innerHeight - 200}
              />
            </Box>
          </Box>
        </ModalContent>
      </Modal>
    </>
  )
}

export default NodeSettingsPanel