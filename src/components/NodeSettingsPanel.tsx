import React, { useState, useEffect, useRef } from 'react'
import {
  Box,
  VStack,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  // Select,
  Button,
  HStack,
  Text,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  useColorModeValue,
  // Alert,
  // AlertIcon,
  Card,
  CardHeader,
  CardBody,
  IconButton,
  useToast,
  Image,
  AspectRatio,
  // Flex,
  // Spacer,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalBody,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Tag as ChakraTag,
  TagLabel,
  TagCloseButton,
} from '@chakra-ui/react'
import { CloseIcon, CopyIcon, ViewIcon, ViewOffIcon, DownloadIcon } from '@chakra-ui/icons'
import { Upload, X, Maximize2, Paperclip } from 'lucide-react'
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
  // const [showPreview, setShowPreview] = useState(false)
  const [isExpanded] = useState(false)
  const [isFullscreenModalOpen, setIsFullscreenModalOpen] = useState(false)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [isImageModalOpen, setIsImageModalOpen] = useState(false)
  const [tabIndex, setTabIndex] = useState(0)
  const [files, setFiles] = useState<{ name: string; url: string }[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const attachmentInputRef = useRef<HTMLInputElement>(null)
  const autoSaveTimeoutRef = useRef<number | null>(null)
  const reactFlowInstance = useReactFlow()
  const toast = useToast()
  const bgColor = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.600')

  // 当选中节点变化时，更新表单数据
  useEffect(() => {
    if (selectedNode) {
      setFormData({
        name: selectedNode.data.name,
        content: selectedNode.data.content,
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

  // 添加粘贴事件监听器
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      // if (tabIndex !== 1) return; // 仅在“基本信息”选项卡生效

      // const items = e.clipboardData?.items;
      // if (items) {
      //   for (let i = 0; i < items.length; i++) {
      //     const item = items[i];
      //     if (item.type.indexOf('image') !== -1) {
      //       const file = item.getAsFile();
      //       if (file) {
      //         const reader = new FileReader();
      //         reader.onload = (event) => {
      //           const result = event.target?.result as string;
      //           setSelectedImage(result);
      //         };
      //         reader.readAsDataURL(file);
      //       }
      //       break;
      //     }
      //   }
      // }
    };

    document.addEventListener('paste', handlePaste);
    return () => {
      document.removeEventListener('paste', handlePaste);
    };
  }, [tabIndex])

  // 自动保存功能
  useEffect(() => {
    if (!selectedNode) return

    // 清除之前的定时器
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current)
    }

    // 设置新的定时器，1秒后自动保存
    autoSaveTimeoutRef.current = setTimeout(() => {
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

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result as string
        setFiles(prev => [...prev, { name: file.name, url: result }])
      }
      reader.readAsDataURL(file)
    }
  }

  const handleFileDownload = (file: { name: string; url: string }) => {
    const link = document.createElement('a')
    link.href = file.url
    link.download = file.name
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
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
          <Tabs size="sm" variant="enclosed">
            <TabList>
              <Tab>基本信息</Tab>
              <Tab>内容详情</Tab>
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
                          icon={<Text fontSize="lg">{
                            selectedNode.data.type === 'page' ? '💻' :
                            selectedNode.data.type === 'modal' ? '📰' :
                            selectedNode.data.type === 'overview' ? '🌍' :
                            selectedNode.data.type === 'requirement' ? '📝' : '💡'
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
                        value={formData.name}
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
                          placeholder="粘贴图片或点击右侧按钮上传"
                          onPaste={handleImagePaste}
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
                      value={formData.description}
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
                        value={formData.content}
                        onChange={(value) => handleInputChange('content', value)}
                        placeholder="支持 Markdown 格式和标签引用 {标签名}。输入 { 可触发标签自动补全"
                        tags={tags}
                      />
                    </Box>
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
              <MarkdownEditor
                value={formData.content || ''}
                onChange={(value) => handleInputChange('content', value)}
                placeholder="支持 Markdown 格式和标签引用 {标签名}。输入 { 可触发标签自动补全"
                tags={tags}
                height={window.innerHeight - 200}
                enableImagePaste={true} // 在PRD编辑器中启用图片粘贴
              />
            </Box>
          </Box>
        </ModalContent>
      </Modal>
    </>
  )
}

export default NodeSettingsPanel