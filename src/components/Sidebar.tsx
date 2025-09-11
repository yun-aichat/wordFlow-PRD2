import React, { useState } from 'react'
import {
  Box,
  VStack,
  IconButton,
  Text,
  Collapse,
  useColorModeValue,
  Tooltip,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverBody,
  Button,
  HStack,
  Badge,
  useDisclosure,
  Flex,
  Card,
  CardBody,
  Divider,
  Input,
  useToast,
  Textarea,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  FormControl,
  FormLabel,
} from '@chakra-ui/react'
import { Plus, MessageSquare, List, Tag, Map, ArrowLeft, Search, ListChevronsDownUp, ListChevronsUpDown, Edit, Container, GripVertical, Download } from 'lucide-react'
import { useReactFlow } from 'reactflow'
import { v4 as uuidv4 } from 'uuid'
import { CustomNode, Tag as TagType } from '../types'

interface SidebarProps {
  tags: TagType[]
  onTagsChange: (tags: TagType[]) => void
  showMiniMap?: boolean
  onMiniMapToggle?: () => void
  onBackToProjectList?: () => void
  onNodeSelect?: (node: CustomNode) => void
  onExport?: () => void
}

const Sidebar: React.FC<SidebarProps> = ({ tags, onTagsChange, showMiniMap = true, onMiniMapToggle, onBackToProjectList, onNodeSelect }) => {
  const [isNodeListOpen, setIsNodeListOpen] = useState(false)
  const [isTagListOpen, setIsTagListOpen] = useState(false)
  const [expandedTags, setExpandedTags] = useState<Set<string>>(new Set())
  const [allTagsExpanded, setAllTagsExpanded] = useState(false)
  const [editingTag, setEditingTag] = useState<TagType | null>(null)
  
  // 互斥展开逻辑 - 直接切换
  const handleNodeListToggle = () => {
    if (isTagListOpen) setIsTagListOpen(false)
    setIsNodeListOpen(!isNodeListOpen)
  }

  const handleTagListToggle = () => {
    if (isNodeListOpen) setIsNodeListOpen(false)
    setIsTagListOpen(!isTagListOpen)
  }
  // const [hoveredButton, setHoveredButton] = useState<string | null>(null)
  const [newTag, setNewTag] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const { isOpen: isAddNodeOpen, onOpen: onAddNodeOpen, onClose: onAddNodeClose } = useDisclosure()
  const { isOpen: isEditTagOpen, onOpen: onEditTagOpen, onClose: onEditTagClose } = useDisclosure()
  const { isOpen: isExportOpen, onOpen: onExportOpen, onClose: onExportClose } = useDisclosure()
  const reactFlowInstance = useReactFlow()
  const toast = useToast()
  
  const bgColor = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.600')
  const hoverBg = useColorModeValue('gray.50', 'gray.700')
  const iconColor = useColorModeValue('gray.600', 'gray.300')

  const addNode = (type: 'page' | 'modal' | 'overview' | 'requirement') => {
    let name = ''
    let content = '# 标题\n\n在这里编写内容...'
    switch (type) {
      case 'page':
        name = '新页面'
        break
      case 'modal':
        name = '新弹窗'
        break
      case 'overview':
        name = '全局概览'
        content = '# 全局概览\n\n描述项目的整体架构、核心流程和关键组件...'
        break
      case 'requirement':
        name = '需求描述'
        content = '# 需求描述\n\n详细描述功能需求、用户故事和验收标准...'
        break
    }

    const newNode: CustomNode = {
      id: uuidv4(),
      type: 'custom',
      position: {
        x: Math.random() * 400 + 100,
        y: Math.random() * 400 + 100,
      },
      data: {
        id: uuidv4(),
        name,
        type,
        content,
        description: '',
      },
    }

    reactFlowInstance.addNodes([newNode])
    onAddNodeClose()
  }

  const addComment = () => {
    const newComment: CustomNode = {
      id: uuidv4(),
      type: 'custom',
      position: {
        x: Math.random() * 400 + 100,
        y: Math.random() * 400 + 100,
      },
      data: {
        id: uuidv4(),
        name: '备注',
        type: 'comment' as any,
        content: '在这里编写备注内容......',
        description: '',
        customItems: [
          { id: uuidv4(), name: '功能1' },
          { id: uuidv4(), name: '功能2' }
        ],
      },
    }

    reactFlowInstance.addNodes([newComment])
  }

  const handleNodeClick = (nodeId: string) => {
    const node = reactFlowInstance.getNode(nodeId) as CustomNode
    if (node) {
      // 定位到节点
      reactFlowInstance.setCenter(node.position.x + 100, node.position.y + 50, { zoom: 1.2 })
      // 触发节点选择，显示节点设置面板
      if (onNodeSelect) {
        onNodeSelect(node)
      }
    }
  }

  const addTag = () => {
    if (newTag.trim() && !tags.some(tag => tag.name === newTag.trim())) {
      const colors = ['red', 'blue', 'green', 'orange', 'purple', 'teal', 'pink', 'cyan']
      const randomColor = colors[Math.floor(Math.random() * colors.length)]
      const newTagObj: TagType = {
        id: uuidv4(),
        name: newTag.trim(),
        color: randomColor,
        description: ''
      }
      onTagsChange([...tags, newTagObj])
      setNewTag('')
      toast({
        title: '标签已添加',
        status: 'success',
        duration: 2000,
        isClosable: true,
      })
    }
  }

  const removeTag = (tagId: string) => {
    onTagsChange(tags.filter(tag => tag.id !== tagId))
    toast({
      title: '标签已删除',
      status: 'info',
      duration: 2000,
      isClosable: true,
    })
  }

  // const toggleTagExpansion = (tagId: string) => {
  //   const newExpanded = new Set(expandedTags)
  //   if (newExpanded.has(tagId)) {
  //     newExpanded.delete(tagId)
  //   } else {
  //     newExpanded.add(tagId)
  //   }
  //   setExpandedTags(newExpanded)
  // }

  const toggleAllTags = () => {
    if (allTagsExpanded) {
      setExpandedTags(new Set())
    } else {
      setExpandedTags(new Set(tags.map(tag => tag.id)))
    }
    setAllTagsExpanded(!allTagsExpanded)
  }

  const handleEditTag = (tag: TagType) => {
    setEditingTag({...tag}) // 使用深拷贝避免直接修改原对象
    onEditTagOpen()
  }

  const saveTagEdit = (updatedTag: TagType) => {
    onTagsChange(tags.map(tag => tag.id === updatedTag.id ? updatedTag : tag))
    setEditingTag(null)
    onEditTagClose()
    toast({
      title: '标签已更新',
      status: 'success',
      duration: 2000,
      isClosable: true,
    })
  }

  const allNodes = reactFlowInstance.getNodes() as CustomNode[]
  const filteredNodes = allNodes.filter(node => 
    node.data.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    node.data.description?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <Flex h="100%" position="relative">
      {/* 节点列表展开面板 - 最左侧 */}
      {isNodeListOpen && (
        <Box
          w="220px"
          h="100%"
          bg={bgColor}
          borderRight="1px"
          borderColor={borderColor}
          p={3}
        >
          <VStack spacing={3} align="stretch">
            <Text fontSize="md" fontWeight="bold">
              节点列表 ({filteredNodes.length})
            </Text>
            
            {/* 搜索输入框 */}
            <Input
              size="sm"
              placeholder="搜索节点名称..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              variant="filled"
            />
          </VStack>
          
          <VStack spacing={2} align="stretch" maxH="calc(100vh - 140px)" overflowY="auto" mt={3}>
            {filteredNodes.map((node) => (
              <Card
                key={node.id}
                size="sm"
                variant="outline"
                cursor="pointer"
                onClick={() => handleNodeClick(node.id)}
                _hover={{ shadow: 'md', borderColor: 'blue.300' }}
                draggable
                onDragStart={(event) => {
                  event.dataTransfer.setData('application/reactflow', JSON.stringify(node));
                  event.dataTransfer.effectAllowed = 'move';
                }}
              >
                <CardBody p={3}>
                  <HStack spacing={2}>
                    <GripVertical size={16} color="gray.400" />
                    <Text fontSize="lg">
                       {node.data.type === 'page' ? '💻' : 
                        node.data.type === 'modal' ? '📰' : 
                        node.data.type === 'overview' ? '🌍' :
                        node.data.type === 'requirement' ? '📝' : '💡'}
                     </Text>
                    <VStack align="start" spacing={0} flex={1}>
                      <Text fontSize="sm" fontWeight="medium" noOfLines={1}>
                        {node.data.name}
                      </Text>
                    </VStack>
                  </HStack>
                </CardBody>
              </Card>
            ))}
            {filteredNodes.length === 0 && (
              <Text fontSize="sm" color="gray.500" textAlign="center" py={8}>
                {searchQuery ? '未找到匹配的节点' : '暂无节点'}
              </Text>
            )}
          </VStack>
        </Box>
      )}

      {/* 标签管理展开面板 */}
      {isTagListOpen && (
        <Box
          w="220px"
          h="100%"
          bg={bgColor}
          borderRight="1px"
          borderColor={borderColor}
          p={3}
        >
          <HStack justify="space-between" mb={3}>
            <Text fontSize="md" fontWeight="bold">
              标签列表 ({tags.length})
            </Text>
            <IconButton
              aria-label={allTagsExpanded ? "收缩全部" : "展开全部"}
              icon={allTagsExpanded ? <ListChevronsUpDown size={16} /> : <ListChevronsDownUp size={16} />}
              size="sm"
              variant="ghost"
              onClick={toggleAllTags}
            />
          </HStack>
          
          {/* 添加新标签 */}
          <HStack mb={3}>
            <Input
              placeholder="输入新标签"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addTag()}
              size="sm"
            />
            <Button size="sm" colorScheme="green" onClick={addTag}>
              添加
            </Button>
          </HStack>
          
          {/* 标签列表 */}
          <VStack spacing={2} align="stretch" maxH="calc(100vh - 200px)" overflowY="auto">
            {tags.map((tag) => (
              <Box key={tag.id}>
                <HStack justify="space-between" p={2} bg={hoverBg} borderRadius="md">
                  <Badge colorScheme={tag.color} variant="subtle">
                    {tag.name}
                  </Badge>
                  <HStack spacing={1}>
                    <IconButton
                      aria-label="编辑标签"
                      icon={<Edit size={12} />}
                      size="xs"
                      variant="ghost"
                      onClick={() => handleEditTag(tag)}
                    />
                    <Button
                      size="xs"
                      variant="ghost"
                      colorScheme="red"
                      onClick={() => removeTag(tag.id)}
                    >
                      删除
                    </Button>
                  </HStack>
                </HStack>
                
                {/* 展开的描述区域 */}
                <Collapse in={expandedTags.has(tag.id)}>
                  <Box pl={6} pr={2} pb={2}>
                    <Text fontSize="xs" color="gray.600">
                      {tag.description || '暂无描述'}
                    </Text>
                  </Box>
                </Collapse>
              </Box>
            ))}
          </VStack>
          
          <Divider my={3} />
          <Text fontSize="xs" color="gray.500">
            在节点描述中使用 {'{标签名}'} 来引用标签
          </Text>
        </Box>
      )}

      {/* 悬浮功能卡片 */}
      <Box
        position="absolute"
        left={isNodeListOpen || isTagListOpen ? "230px" : "20px"}
        top="20px"
        zIndex={1000}
      >
        <Card
          bg={bgColor}
          shadow="lg"
          borderRadius="xl"
          border="1px"
          borderColor={borderColor}
        >
          <CardBody p={2}>
            <VStack spacing={2}>
              {/* 返回按钮 */}
              {onBackToProjectList && (
                <>
                  <Tooltip label="返回项目列表" placement="right">
                    <IconButton
                      aria-label="返回项目列表"
                      icon={<ArrowLeft size={16} />}
                      size="sm"
                      variant="ghost"
                      color={iconColor}
                      _hover={{ bg: hoverBg, color: 'blue.500' }}
                      onClick={onBackToProjectList}
                    />
                  </Tooltip>
                  <Divider />
                </>
              )}
              
              {/* 添加节点功能 */}
              <Popover isOpen={isAddNodeOpen} onOpen={onAddNodeOpen} onClose={onAddNodeClose}>
                <PopoverTrigger>
                  <Box>
                    <Tooltip label="添加节点" placement="right">
                      <IconButton
                        aria-label="添加节点"
                        icon={<Plus size={16} />}
                        size="sm"
                        variant="ghost"
                        color={iconColor}
                        _hover={{ bg: hoverBg, color: 'blue.500' }}
                      />
                    </Tooltip>
                  </Box>
                </PopoverTrigger>
                <PopoverContent w="160px" ml={2}>
                  <PopoverBody p={2}>
                    <VStack spacing={2}>
                      <Button
                        size="sm"
                        w="100%"
                        leftIcon={<Text>💻</Text>}
                        colorScheme="blue"
                        variant="outline"
                        onClick={() => addNode('page')}
                      >
                        页面
                      </Button>
                      <Button
                        size="sm"
                        w="100%"
                        leftIcon={<Text>📰</Text>}
                        colorScheme="purple"
                        variant="outline"
                        onClick={() => addNode('modal')}
                      >
                        弹窗
                      </Button>
                      <Button
                        size="sm"
                        w="100%"
                        leftIcon={<Text>🌍</Text>}
                        colorScheme="green"
                        variant="outline"
                        onClick={() => addNode('overview')}
                      >
                        全局概览
                      </Button>
                      <Button
                        size="sm"
                        w="100%"
                        leftIcon={<Text>📝</Text>}
                        colorScheme="yellow"
                        variant="outline"
                        onClick={() => addNode('requirement')}
                      >
                        需求描述
                      </Button>
                    </VStack>
                  </PopoverBody>
                </PopoverContent>
              </Popover>
              
              {/* 添加注释功能 */}
              <Tooltip label="添加注释" placement="right">
                <IconButton
                  aria-label="添加注释"
                  icon={<MessageSquare size={16} />}
                  size="sm"
                  variant="ghost"
                  color={iconColor}
                  _hover={{ bg: hoverBg, color: 'orange.500' }}
                  onClick={addComment}
                />
              </Tooltip>
              
              <Divider />
              
              {/* 节点列表功能 */}
               <Tooltip label="节点列表" placement="right">
                 <IconButton
                   aria-label="节点列表"
                   icon={<List size={16} />}
                   size="sm"
                   variant="ghost"
                   color={isNodeListOpen ? 'green.500' : iconColor}
                   _hover={{ bg: hoverBg, color: 'green.500' }}
                   onClick={handleNodeListToggle}
                 />
               </Tooltip>
               
               {/* 标签管理功能 */}
               <Tooltip label="标签列表" placement="right">
                 <IconButton
                   aria-label="标签列表"
                   icon={<Tag size={16} />}
                   size="sm"
                   variant="ghost"
                   color={isTagListOpen ? 'purple.500' : iconColor}
                   _hover={{ bg: hoverBg, color: 'purple.500' }}
                   onClick={handleTagListToggle}
                 />
               </Tooltip>
               
               <Divider />
               
               {/* 缩略图控制功能 */}
               <Tooltip label={showMiniMap ? "隐藏缩略图" : "显示缩略图"} placement="right">
                 <IconButton
                   aria-label="缩略图控制"
                   icon={<Map size={16} />}
                   size="sm"
                   variant="ghost"
                   color={showMiniMap ? 'teal.500' : iconColor}
                   _hover={{ bg: hoverBg, color: 'teal.500' }}
                   onClick={onMiniMapToggle}
                 />
               </Tooltip>
               
               {/* 导出功能 */}
               <Tooltip label="导出项目" placement="right">
                 <IconButton
                   aria-label="导出项目"
                   icon={<Download size={16} />}
                   size="sm"
                   variant="ghost"
                   color={iconColor}
                   _hover={{ bg: hoverBg, color: 'blue.500' }}
                   onClick={onExportOpen}
                 />
               </Tooltip>
            </VStack>
          </CardBody>
        </Card>
      </Box>
      
      {/* 标签编辑弹窗 */}
      <Modal isOpen={isEditTagOpen} onClose={onEditTagClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>编辑标签</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {editingTag && (
              <VStack spacing={4}>
                <FormControl>
                  <FormLabel>标签名称</FormLabel>
                  <Input
                    value={editingTag.name}
                    onChange={(e) => setEditingTag({...editingTag, name: e.target.value})}
                  />
                </FormControl>
                <FormControl>
                  <FormLabel>名词解释</FormLabel>
                  <Textarea
                    value={editingTag.description}
                    onChange={(e) => setEditingTag({...editingTag, description: e.target.value})}
                    placeholder="输入标签的名词解释..."
                    rows={4}
                  />
                </FormControl>
              </VStack>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onEditTagClose}>
              取消
            </Button>
            <Button colorScheme="blue" onClick={() => editingTag && saveTagEdit(editingTag)}>
              保存
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* 导出项目弹窗 */}
      <Modal isOpen={isExportOpen} onClose={onExportClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>导出项目</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} align="stretch">
              <Text>选择导出格式：</Text>
              
              <Button 
                leftIcon={<Download size={16} />} 
                colorScheme="blue" 
                onClick={() => {
                  // 获取所有节点数据
                  const allNodes = reactFlowInstance.getNodes() as CustomNode[];
                  const allEdges = reactFlowInstance.getEdges();
                  
                  // 创建HTML内容
                  let htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>PRD导出文档</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; max-width: 800px; margin: 0 auto; padding: 20px; }
    h1 { color: #2c5282; border-bottom: 1px solid #e2e8f0; padding-bottom: 10px; }
    h2 { color: #2d3748; margin-top: 30px; }
    img { max-width: 100%; border: 1px solid #e2e8f0; border-radius: 4px; }
    .node { margin-bottom: 40px; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px; }
    .node-title { display: flex; align-items: center; margin-bottom: 15px; }
    .node-icon { margin-right: 10px; font-size: 24px; }
    .node-name { font-size: 20px; font-weight: bold; }
    .node-description { color: #4a5568; margin-bottom: 15px; }
    .node-content { background-color: #f7fafc; padding: 15px; border-radius: 4px; }
  </style>
</head>
<body>
  <h1>PRD文档</h1>
`;
                  
                  // 添加节点内容
                  allNodes.forEach(node => {
                    if (node.data.type !== 'comment') {
                      const nodeIcon = 
                        node.data.type === 'page' ? '💻' : 
                        node.data.type === 'modal' ? '📰' : 
                        node.data.type === 'overview' ? '🌍' :
                        node.data.type === 'requirement' ? '📝' : '📄';
                      
                      htmlContent += `
  <div class="node">
    <div class="node-title">
      <span class="node-icon">${nodeIcon}</span>
      <span class="node-name">${node.data.name}</span>
    </div>
`;
                      
                      if (node.data.description) {
                        htmlContent += `    <div class="node-description">${node.data.description}</div>
`;
                      }
                      
                      if (node.data.content) {
                        // 将Markdown内容转换为HTML (简单处理)
                        const contentHtml = node.data.content
                          .replace(/\n\n/g, '<br><br>')
                          .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                          .replace(/\*(.*?)\*/g, '<em>$1</em>')
                          .replace(/\#\# (.*?)\n/g, '<h2>$1</h2>')
                          .replace(/\# (.*?)\n/g, '<h1>$1</h1>')
                          .replace(/\!\[\]\((.*?)\)/g, '<img src="$1" alt="" />');
                          
                        htmlContent += `    <div class="node-content">${contentHtml}</div>
`;
                      }
                      
                      htmlContent += `  </div>
`;
                    }
                  });
                  
                  htmlContent += `</body>
</html>`;
                  
                  // 创建下载链接
                  const blob = new Blob([htmlContent], { type: 'text/html' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = 'prd-export.html';
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  URL.revokeObjectURL(url);
                  
                  toast({
                    title: '导出成功',
                    description: 'PRD文档已成功导出为HTML文件',
                    status: 'success',
                    duration: 3000,
                    isClosable: true,
                  });
                  
                  onExportClose();
                }}
              >
                导出为HTML文档
              </Button>
              
              <Button 
                leftIcon={<Download size={16} />} 
                colorScheme="teal"
                onClick={() => {
                  // 获取React Flow实例的视图
                  const dataUrl = reactFlowInstance.toObject();
                  
                  toast({
                    title: '功能开发中',
                    description: '导出为图片功能正在开发中，敬请期待',
                    status: 'info',
                    duration: 3000,
                    isClosable: true,
                  });
                }}
              >
                导出为图片 (开发中)
              </Button>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" onClick={onExportClose}>
              取消
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

    </Flex>
  )
}

export default Sidebar