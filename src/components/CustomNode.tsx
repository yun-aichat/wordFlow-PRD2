import React, { useState, useCallback } from 'react'
import {
  Box,
  Text,
  // Badge,
  useColorModeValue,
  VStack,
  HStack,
  Input,
  Textarea,
  IconButton,
  Image,
} from '@chakra-ui/react'
import { Plus, X } from 'lucide-react'
import { Handle, Position, NodeProps } from 'reactflow'
import { NodeData } from '../types'
import TagInput from './TagInput'
import TaggedText from './TaggedText'
import { v4 as uuidv4 } from 'uuid'

interface CustomNodeProps extends NodeProps {
  data: NodeData
  tags?: {name: string, color: string}[]
}

const CustomNode: React.FC<CustomNodeProps> = ({ data, selected, tags = [] }) => {
  const [isEditing, setIsEditing] = useState(false)
  const [editName, setEditName] = useState(data.name || '')
  const [editContent, setEditContent] = useState(data.content || '')
  const [editingItemId, setEditingItemId] = useState<string | null>(null)
  const [editingItemName, setEditingItemName] = useState('')

  // 检查是否有任何编辑状态激活
  const hasActiveEditing = isEditing || editingItemId !== null

  const handleDoubleClick = useCallback(() => {
    if (data.type === 'comment') {
      setIsEditing(true)
    }
  }, [data.type])

  const handleSave = useCallback(() => {
    // 更新节点数据
    data.name = editName
    data.content = editContent
    setIsEditing(false)
  }, [editName, editContent, data])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      handleSave()
    } else if (e.key === 'Escape') {
      setEditName(data.name || '')
      setEditContent(data.content || '')
      setIsEditing(false)
    }
  }, [handleSave, data.name, data.content])

  const handleItemDoubleClick = useCallback((item: { id: string; name: string }) => {
    setEditingItemId(item.id)
    setEditingItemName(item.name)
  }, [])

  const handleItemSave = useCallback(() => {
    if (editingItemId && data.customItems) {
      const itemIndex = data.customItems.findIndex(item => item.id === editingItemId)
      if (itemIndex !== -1) {
        data.customItems[itemIndex].name = editingItemName
      }
    }
    setEditingItemId(null)
    setEditingItemName('')
  }, [editingItemId, editingItemName, data.customItems])

  const handleItemKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleItemSave()
    } else if (e.key === 'Escape') {
      setEditingItemId(null)
      setEditingItemName('')
    }
  }, [handleItemSave])
  // const bgColor = useColorModeValue('white', 'gray.700')
  const borderColor = useColorModeValue('gray.200', 'gray.600')
  const selectedBorderColor = useColorModeValue('blue.400', 'blue.300')
  const textColor = useColorModeValue('gray.800', 'white')
  const subtextColor = useColorModeValue('gray.600', 'gray.300')

  // 根据节点类型设置不同的颜色
  const pageNodeColor = useColorModeValue('blue.50', 'blue.700')
  const modalNodeColor = useColorModeValue('purple.50', 'purple.700')
  const commentNodeColor = useColorModeValue('orange.50', 'orange.700')
  const defaultNodeColor = useColorModeValue('gray.100', 'gray.600')

  const pageBorderColor = useColorModeValue('blue.400', 'blue.300')
  const modalBorderColor = useColorModeValue('purple.400', 'purple.300')
  const commentBorderColor = useColorModeValue('orange.400', 'orange.300')
  const defaultBorderColor = useColorModeValue('gray.300', 'gray.400')

  const pageIconColor = useColorModeValue('blue.600', 'blue.200')
  const modalIconColor = useColorModeValue('purple.600', 'purple.200')
  const commentIconColor = useColorModeValue('orange.600', 'orange.200')
  const defaultIconColor = useColorModeValue('gray.600', 'gray.300')

  // 列表项悬浮颜色
  const itemHoverBgColor = useColorModeValue('gray.50', 'gray.600')
  const textHoverBgColor = useColorModeValue('gray.100', 'gray.500')

  const getNodeColor = () => {
    switch (data.type) {
      case 'page': return pageNodeColor
      case 'modal': return modalNodeColor
      case 'comment': return commentNodeColor
      default: return defaultNodeColor
    }
  }

  const getBorderColor = () => {
    switch (data.type) {
      case 'page': return pageBorderColor
      case 'modal': return modalBorderColor
      case 'comment': return commentBorderColor
      default: return defaultBorderColor
    }
  }

  const getIconColor = () => {
    switch (data.type) {
      case 'page': return pageIconColor
      case 'modal': return modalIconColor
      case 'comment': return commentIconColor
      default: return defaultIconColor
    }
  }

  const getNodeIcon = (type: string) => {
    switch (type) {
      case 'page': return '💻'
      case 'modal': return '📰'
      case 'comment': return '💡'
      default: return '💻'
    }
  }

  // const getBadgeColor = (type: string) => {
  //   switch (type) {
  //     case 'page': return 'blue'
  //     case 'modal': return 'purple'
  //     case 'comment': return 'orange'
  //     default: return 'gray'
  //   }
  // }

  // 备注节点的简约样式
  if (data.type === 'comment') {
    return (
      <Box
        bg={getNodeColor()}
        border="1px"
        borderColor={selected ? selectedBorderColor : getBorderColor()}
        borderRadius="md"
        p={3}
        minW="150px"
        maxW="250px"
        shadow="sm"
        transition="all 0.2s ease-in-out"
        _hover={{
          shadow: 'md',
          transform: 'translateY(-1px)',
        }}
        onDoubleClick={handleDoubleClick}
        cursor={isEditing ? 'default' : 'pointer'}
        opacity={data.disabled ? 0.5 : 1}
        filter={data.disabled ? 'grayscale(50%)' : 'none'}
        className={hasActiveEditing ? 'nodrag' : ''}
      >
        <VStack spacing={2} align="start">
          <HStack spacing={2}>
            <Text fontSize="xs" color={getIconColor()}>{getNodeIcon(data.type)}</Text>
            {isEditing ? (
              <TagInput
                 value={editName}
                 onChange={setEditName}
                 tags={tags}
                 size="sm"
                 placeholder="输入内容，键入 { 来引用标签"
                 onBlur={handleSave}
                 onKeyDown={handleKeyDown}
                 // className="nodrag"
               />
            ) : (
              <TaggedText 
                 text={data.name || '备注'} 
                 fontSize="xs" 
                 fontWeight="bold" 
                 color={textColor} 
                 flex={1}
                 tags={tags}
               />
            )}
          </HStack>
          
          {isEditing ? (
            <Textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              onBlur={handleSave}
              onKeyDown={handleKeyDown}
              onMouseDown={(e) => e.stopPropagation()}
              onMouseMove={(e) => e.stopPropagation()}
              fontSize="xs"
              color={subtextColor}
              size="sm"
              variant="unstyled"
              placeholder="备注内容"
              resize="none"
              rows={3}
              className="nodrag"
            />
          ) : (
            <TaggedText 
               text={data.content || data.description || '在这里编写备注内容......'} 
               fontSize="xs" 
               color={subtextColor} 
               noOfLines={4}
               tags={tags}
             />
          )}
        </VStack>
      </Box>
    )
  }

  // 页面和弹窗节点的标准样式
  return (
    <Box
      bg={getNodeColor()}
      border="2px"
      borderColor={selected ? selectedBorderColor : getBorderColor()}
      borderRadius="lg"
      p={0}
      minW="200px"
      maxW="250px"
      shadow={selected ? 'xl' : 'sm'}
      transition="all 0.2s ease-in-out"
      _hover={{
        shadow: 'lg',
        transform: 'translateY(-2px)',
        borderColor: selected ? selectedBorderColor : getBorderColor(),
      }}
      position="relative"
      role="group"
      opacity={data.disabled ? 0.5 : 1}
      filter={data.disabled ? 'grayscale(50%)' : 'none'}
      className={hasActiveEditing ? 'nodrag' : ''}
    >
      {/* 标题区域的左侧接入柄 */}
      <Handle
        type="target"
        position={Position.Left}
        style={{
          background: '#555',
          width: 12,
          height: 12,
          top: '20px',
          left: '-6px'
        }}
      />
      
      {/* 标题和基本信息区域 */}
      <Box p={4} pb={2}>
        <VStack spacing={2} align="start">
          {/* 图片显示 */}
          {data.image && (
            <Box w="100%" mb={2}>
              <Image
                src={data.image}
                alt={data.name || '节点图片'}
                borderRadius="md"
                w="100%"
                h="auto"
                maxH="120px"
                objectFit="contain"
                cursor="pointer"
                _hover={{ opacity: 0.8 }}
                transition="opacity 0.2s"
                onClick={(e) => {
                  e.stopPropagation()
                  // 触发图片展开事件
                  const event = new CustomEvent('openImageModal', { detail: { image: data.image } })
                  window.dispatchEvent(event)
                }}
              />
            </Box>
          )}
          
          {/* Icon + 名称 */}
          <HStack spacing={2} w="100%">
            <Text fontSize="lg" color={getIconColor()}>{getNodeIcon(data.type)}</Text>
            <TaggedText
               text={data.name || '未命名节点'}
               fontSize="md"
               fontWeight="bold"
               color={textColor}
               noOfLines={2}
               flex={1}
               tags={tags}
             />
          </HStack>
          
          {data.description && (
            <TaggedText
               text={data.description}
               fontSize="sm"
               color={subtextColor}
               noOfLines={3}
               w="100%"
               tags={tags}
             />
          )}
        </VStack>
      </Box>
      
      {/* 自定义列表项区域 */}
        <Box borderTop="1px" borderColor={borderColor}>
          {data.customItems && data.customItems.length > 0 && (
            data.customItems.map((item, _index) => (
               <Box
                 key={item.id}
                 position="relative"
                 px={3}
                 py={1.5}
                 borderBottom="1px"
                 borderColor={borderColor}
                 _hover={{ bg: itemHoverBgColor }}
                 role="group"
               >
                 <HStack spacing={2} w="100%">
                   {editingItemId === item.id ? (
                     <Input
                       value={editingItemName}
                       onChange={(e) => setEditingItemName(e.target.value)}
                       onKeyDown={handleItemKeyDown}
                       onBlur={handleItemSave}
                       onMouseDown={(e) => e.stopPropagation()}
                       onMouseMove={(e) => e.stopPropagation()}
                       fontSize="sm"
                       size="sm"
                       autoFocus
                       flex={1}
                       className="nodrag"
                     />
                   ) : (
                     <Text 
                       fontSize="sm" 
                       color={textColor} 
                       flex={1}
                       onDoubleClick={() => handleItemDoubleClick(item)}
                       cursor="pointer"
                       _hover={{ bg: textHoverBgColor }}
                       p={1}
                       borderRadius="sm"
                     >
                       {item.name}
                     </Text>
                   )}
                   
                   <IconButton
                     aria-label="删除项目"
                     icon={<X size={12} />}
                     size="xs"
                     variant="ghost"
                     colorScheme="red"
                     opacity={0}
                     transition="opacity 0.2s"
                     _groupHover={{ opacity: 1 }}
                     onClick={() => {
                       if (data.customItems) {
                         data.customItems = data.customItems.filter(i => i.id !== item.id)
                       }
                     }}
                   />
                 </HStack>
                
                {/* 每个列表项右侧的连接柄 */}
                <Handle
                  type="source"
                  position={Position.Right}
                  id={`${data.id}-${item.id}`}
                  style={{
                    background: '#555',
                    width: 12,
                    height: 12,
                    right: '-6px',
                    top: '50%',
                    transform: 'translateY(-50%)'
                  }}
                />
              </Box>
            ))
          )}
          
          {/* 添加新项目按钮 */}
           {selected && (
           <Box 
             p={2}
           >
             <IconButton
               aria-label="添加项目"
               icon={<Plus size={14} />}
               size="sm"
               variant="ghost"
               w="100%"
               onClick={() => {
                 if (!data.customItems) {
                   data.customItems = []
                 }
                 const newItem = { id: uuidv4(), name: `功能${data.customItems.length + 1}` }
                 data.customItems.push(newItem)
                 setEditingItemId(newItem.id)
                 setEditingItemName(newItem.name)
               }}
             >
               添加项目
             </IconButton>
           </Box>
           )}
        </Box>
     </Box>
  )
}

export default CustomNode