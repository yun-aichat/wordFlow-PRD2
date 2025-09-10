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
} from '@chakra-ui/react'
import { Plus, MessageSquare, List, Tag, Map } from 'lucide-react'
import { useReactFlow, useNodes } from 'reactflow'
import { v4 as uuidv4 } from 'uuid'
import { CustomNode } from '../types'

interface SidebarProps {
  tags: {name: string, color: string}[]
  onTagsChange: (tags: {name: string, color: string}[]) => void
  showMiniMap?: boolean
  onMiniMapToggle?: () => void
}

const Sidebar: React.FC<SidebarProps> = ({ tags, onTagsChange, showMiniMap = true, onMiniMapToggle }) => {
  const [isNodeListOpen, setIsNodeListOpen] = useState(false)
  const [isTagListOpen, setIsTagListOpen] = useState(false)
  
  // 互斥展开逻辑 - 直接切换
  const handleNodeListToggle = () => {
    if (isTagListOpen) setIsTagListOpen(false)
    setIsNodeListOpen(!isNodeListOpen)
  }

  const handleTagListToggle = () => {
    if (isNodeListOpen) setIsNodeListOpen(false)
    setIsTagListOpen(!isTagListOpen)
  }
  const [hoveredButton, setHoveredButton] = useState<string | null>(null)
  const [newTag, setNewTag] = useState('')
  const { isOpen: isAddNodeOpen, onOpen: onAddNodeOpen, onClose: onAddNodeClose } = useDisclosure()
  const reactFlowInstance = useReactFlow()
  const toast = useToast()
  
  const bgColor = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.600')
  const hoverBg = useColorModeValue('gray.50', 'gray.700')
  const iconColor = useColorModeValue('gray.600', 'gray.300')

  const addNode = (type: 'page' | 'modal') => {
    const newNode: CustomNode = {
      id: uuidv4(),
      type: 'custom',
      position: {
        x: Math.random() * 400 + 100,
        y: Math.random() * 400 + 100,
      },
      data: {
        id: uuidv4(),
        name: type === 'page' ? '新页面' : '新弹窗',
        type,
        content: '# 标题\n\n在这里编写内容...',
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
    const node = reactFlowInstance.getNode(nodeId)
    if (node) {
      reactFlowInstance.setCenter(node.position.x + 100, node.position.y + 50, { zoom: 1.2 })
    }
  }

  const addTag = () => {
    if (newTag.trim() && !tags.some(tag => tag.name === newTag.trim())) {
      const colors = ['red', 'blue', 'green', 'orange', 'purple', 'teal', 'pink', 'cyan']
      const randomColor = colors[Math.floor(Math.random() * colors.length)]
      onTagsChange([...tags, {name: newTag.trim(), color: randomColor}])
      setNewTag('')
      toast({
        title: '标签已添加',
        status: 'success',
        duration: 2000,
        isClosable: true,
      })
    }
  }

  const removeTag = (tagToRemove: string) => {
    onTagsChange(tags.filter(tag => tag.name !== tagToRemove))
    toast({
      title: '标签已删除',
      status: 'info',
      duration: 2000,
      isClosable: true,
    })
  }

  const allNodes = reactFlowInstance.getNodes() as CustomNode[]

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
          <Text fontSize="md" fontWeight="bold" mb={3}>
            节点列表 ({allNodes.length})
          </Text>
          <VStack spacing={2} align="stretch" maxH="calc(100vh - 80px)" overflowY="auto">
            {allNodes.map((node) => (
              <Card
                key={node.id}
                size="sm"
                variant="outline"
                cursor="pointer"
                onClick={() => handleNodeClick(node.id)}
                _hover={{ shadow: 'md', borderColor: 'blue.300' }}
              >
                <CardBody p={3}>
                  <HStack spacing={2}>
                    <Text fontSize="lg">
                       {node.data.type === 'page' ? '💻' : 
                        node.data.type === 'modal' ? '📰' : '💡'}
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
            {allNodes.length === 0 && (
              <Text fontSize="sm" color="gray.500" textAlign="center" py={8}>
                暂无节点
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
          <Text fontSize="md" fontWeight="bold" mb={3}>
            标签列表 ({tags.length})
          </Text>
          
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
            {tags.map((tag, index) => (
              <HStack key={index} justify="space-between" p={2} bg={hoverBg} borderRadius="md">
                <Badge colorScheme={tag.color} variant="subtle">
                  {tag.name}
                </Badge>
                <Button
                  size="xs"
                  variant="ghost"
                  colorScheme="red"
                  onClick={() => removeTag(tag.name)}
                >
                  删除
                </Button>
              </HStack>
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
              {/* Logo 区域 */}
              <Text fontSize="xs" fontWeight="bold" color={iconColor} py={1}>
                PRD
              </Text>
              
              <Divider />
              
              {/* 添加节点功能 */}
              <Popover isOpen={isAddNodeOpen} onClose={onAddNodeClose}>
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
                        onClick={onAddNodeOpen}
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
            </VStack>
          </CardBody>
        </Card>
      </Box>
      

    </Flex>
  )
}

export default Sidebar