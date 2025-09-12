import React, { useState, useCallback, useEffect } from 'react'
import {
  Box,
  Text,
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
import { CustomNode as CustomNodeType } from '../types'
import TagInput from './TagInput'
import TaggedText from './TaggedText'
import MarkdownFileNode from './MarkdownFileNode'
import { v4 as uuidv4 } from 'uuid'

interface CustomNodeProps extends NodeProps {
  data: CustomNodeType['data']
  tags?: {name: string, color: string}[]
  onUpdate?: () => void
}

const CustomNode: React.FC<CustomNodeProps> = ({ data, selected, tags = [], onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false)
  const [editName, setEditName] = useState(data.name || '')
  const [editContent, setEditContent] = useState(data.content || '')
  const [editingItemId, setEditingItemId] = useState<string | null>(null)
  const [editingItemName, setEditingItemName] = useState('')
  // 添加状态来跟踪节点的处理状态
  const [isProcessed, setIsProcessed] = useState(data.processed || false)

  // 检查是否有任何编辑状态激活
  const hasActiveEditing = isEditing || editingItemId !== null
  
  // 同步React状态和节点数据
  useEffect(() => {
    // 当节点数据的processed状态变化时，更新React状态
    if (data.processed !== isProcessed) {
      setIsProcessed(data.processed || false);
    }
  }, [data.processed, isProcessed]);
  
  // 当React状态变化时，更新节点数据
  useEffect(() => {
    data.processed = isProcessed;
  }, [isProcessed, data]);

  const handleDoubleClick = useCallback(() => {
    if (data.type === 'comment' || data.type === 'modification') {
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

  const borderColor = useColorModeValue('gray.200', 'gray.600')
  const selectedBorderColor = useColorModeValue('blue.400', 'blue.300')
  const textColor = useColorModeValue('gray.800', 'white')
  const subtextColor = useColorModeValue('gray.600', 'gray.300')

  // 根据节点类型设置不同的颜色
  const pageNodeColor = useColorModeValue('blue.50', 'blue.700')
  const modalNodeColor = useColorModeValue('purple.50', 'purple.700')
  const commentNodeColor = useColorModeValue('gray.100', 'gray.600') // 修改为不那么亮眼的颜色
  const defaultNodeColor = useColorModeValue('gray.100', 'gray.600')
  const overviewNodeColor = useColorModeValue('green.50', 'green.700')
  const requirementNodeColor = useColorModeValue('yellow.50', 'yellow.700')
  const modificationNodeColor = useColorModeValue('pink.50', 'pink.700')
  const markdownFileNodeColor = useColorModeValue('teal.50', 'teal.700')

  const pageBorderColor = useColorModeValue('blue.400', 'blue.300')
  const modalBorderColor = useColorModeValue('purple.400', 'purple.300')
  const commentBorderColor = useColorModeValue('gray.300', 'gray.500') // 修改为不那么亮眼的颜色
  const overviewBorderColor = useColorModeValue('green.400', 'green.300')
  const requirementBorderColor = useColorModeValue('yellow.400', 'yellow.300')
  const modificationBorderColor = useColorModeValue('pink.400', 'pink.300')
  const markdownFileBorderColor = useColorModeValue('teal.400', 'teal.300')
  const defaultBorderColor = useColorModeValue('gray.300', 'gray.400')

  const pageIconColor = useColorModeValue('blue.600', 'blue.200')
  const modalIconColor = useColorModeValue('purple.600', 'purple.200')
  const commentIconColor = useColorModeValue('gray.600', 'gray.300') // 修改为不那么亮眼的颜色
  const overviewIconColor = useColorModeValue('green.600', 'green.200')
  const requirementIconColor = useColorModeValue('yellow.600', 'yellow.200')
  const modificationIconColor = useColorModeValue('pink.600', 'pink.200')
  const markdownFileIconColor = useColorModeValue('teal.600', 'teal.200')
  const defaultIconColor = useColorModeValue('gray.600', 'gray.300')

  // 列表项悬浮颜色
  const itemHoverBgColor = useColorModeValue('gray.50', 'gray.600')
  const textHoverBgColor = useColorModeValue('gray.100', 'gray.500')

  const getNodeColor = () => {
    switch (data.type) {
      case 'page': return pageNodeColor
      case 'modal': return modalNodeColor
      case 'comment': return commentNodeColor
      case 'overview': return overviewNodeColor
      case 'requirement': return requirementNodeColor
      case 'modification': return modificationNodeColor
      case 'markdown-file': return markdownFileNodeColor
      case 'popup': return modalNodeColor // 处理popup类型
      default: return defaultNodeColor
    }
  }

  const getBorderColor = () => {
    switch (data.type) {
      case 'page': return pageBorderColor
      case 'modal': return modalBorderColor
      case 'comment': return commentBorderColor
      case 'overview': return overviewBorderColor
      case 'requirement': return requirementBorderColor
      case 'modification': return modificationBorderColor
      case 'markdown-file': return markdownFileBorderColor
      case 'popup': return modalBorderColor // 处理popup类型
      default: return defaultBorderColor
    }
  }

  const getIconColor = () => {
    switch (data.type) {
      case 'page': return pageIconColor
      case 'modal': return modalIconColor
      case 'comment': return commentIconColor
      case 'overview': return overviewIconColor
      case 'requirement': return requirementIconColor
      case 'modification': return modificationIconColor
      case 'markdown-file': return markdownFileIconColor
      case 'popup': return modalIconColor // 处理popup类型
      default: return defaultIconColor
    }
  }

  const getNodeIcon = (type: CustomNodeType['data']['type']) => {
    switch (type) {
      case 'page': return '💻'
      case 'modal': return '📰'
      case 'comment': return '💡'
      case 'overview': return '🌍'
      case 'requirement': return '📝'
      case 'modification': return '📌'
      case 'markdown-file': return '📄'
      case 'popup': return '📰' // 处理popup类型，使用与modal相同的图标
      default: return '💻'
    }
  }



  // MD文件节点的特殊渲染
  if (data.type === 'markdown-file') {
    return (
      <MarkdownFileNode
        data={data}
        selected={selected}
        nodeColor={getNodeColor()}
        borderColor={selected ? selectedBorderColor : getBorderColor()}
        iconColor={getIconColor()}
        textColor={textColor}
        onUpdate={onUpdate}
      />
    )
  }

  // 备注节点的简约样式
  if (data.type === 'comment' || data.type === 'modification') {
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
        _hover={{
          shadow: 'md',
          transform: 'translateY(-1px)',
        }}
        onDoubleClick={handleDoubleClick}
        // 允许点击事件冒泡，以便DELETE键可以删除节点
        cursor="default"
        opacity={data.disabled ? 0.5 : ((data.type === 'modification' || data.type === 'comment') && isProcessed ? 0.6 : 1)}
        filter={data.disabled ? 'grayscale(50%)' : ((data.type === 'modification' || data.type === 'comment') && isProcessed ? 'grayscale(30%)' : 'none')}
        transition="all 0.2s ease-in-out, opacity 0.3s ease, filter 0.3s ease"
        className={hasActiveEditing ? 'nodrag' : ''}
      >
        <VStack spacing={2} align="start" width="100%">
          <HStack spacing={2} width="100%" justifyContent="space-between">
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
                 />
              ) : (
                <TaggedText 
                   text={data.name || (data.type === 'modification' ? '批注' : '备注')} 
                   fontSize="xs" 
                   fontWeight="bold" 
                   color={textColor} 
                   flex={1}
                   tags={tags}
                 />
              )}
            </HStack>
            
            {/* 修改节点的处理状态开关 */}
            {data.type === 'modification' && (
              <Box 
                as="span" 
                bg={isProcessed ? 'green.100' : 'red.100'}
                color={isProcessed ? 'green.700' : 'red.700'}
                fontSize="xs"
                px={2}
                py={0.5}
                borderRadius="full"
                fontWeight="medium"
                cursor="pointer"
                display="flex"
                alignItems="center"
                justifyContent="center"
                onClick={(e: React.MouseEvent) => {
                    e.stopPropagation();
                    // 更新React状态
                    setIsProcessed(!isProcessed);
                    // 同时更新节点数据
                    data.processed = !data.processed;
                    // 触发自定义事件通知状态变化
                    const event = new CustomEvent('nodeProcessedChange', { detail: { nodeId: data.id, processed: data.processed } });
                    document.dispatchEvent(event);
                  }}
                _hover={{
                  bg: isProcessed ? 'green.200' : 'red.200',
                }}
                transition="all 0.2s"
              >
                <Box 
                  as="span" 
                  w="8px" 
                  h="8px" 
                  borderRadius="full" 
                  bg={isProcessed ? 'green.500' : 'red.500'} 
                  mr="1"
                />
                {isProcessed ? '已处理' : '待处理'}
              </Box>
            )}
          </HStack>
          
          {isEditing ? (
            <Textarea
              value={editContent}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setEditContent(e.target.value)}
              onBlur={handleSave}
              onKeyDown={handleKeyDown}
              onMouseDown={(e: React.MouseEvent) => e.stopPropagation()}
              onMouseMove={(e: React.MouseEvent) => e.stopPropagation()}
              fontSize="xs"
              color={subtextColor}
              size="sm"
              variant="unstyled"
              placeholder={data.type === 'modification' ? '批注内容' : '备注内容'}
              resize="none"
              rows={3}
              className="nodrag"
              width="100%"
            />
          ) : (
            <TaggedText 
               text={data.content || data.description || (data.type === 'modification' ? '在这里编写批注内容......' : '在这里编写备注内容......')} 
               fontSize="xs" 
               color={subtextColor} 
               noOfLines={4}
               tags={tags}
               width="100%"
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
      _hover={{
        shadow: 'lg',
        transform: 'translateY(-2px)',
        borderColor: selected ? selectedBorderColor : getBorderColor(),
      }}
      position="relative"
      role="group"
      opacity={data.disabled ? 0.5 : ((data.type === 'modification' || data.type === 'comment') && isProcessed ? 0.6 : 1)}
      filter={data.disabled ? 'grayscale(50%)' : ((data.type === 'modification' || data.type === 'comment') && isProcessed ? 'grayscale(30%)' : 'none')}
      transition="all 0.2s ease-in-out, opacity 0.3s ease, filter 0.3s ease"
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
                onClick={(e: React.MouseEvent) => {
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
                       onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditingItemName(e.target.value)}
                       onKeyDown={handleItemKeyDown}
                       onBlur={handleItemSave}
                       onMouseDown={(e: React.MouseEvent) => e.stopPropagation()}
                       onMouseMove={(e: React.MouseEvent) => e.stopPropagation()}
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