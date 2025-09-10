import React, { useState, useRef, useCallback } from 'react'
import {
  Input,
  Textarea,
  Box,
  List,
  ListItem,
  useDisclosure,
  Popover,
  PopoverTrigger,
  PopoverContent,
  Text,
  VStack,
  InputGroup,
  InputLeftElement,
  Badge,
} from '@chakra-ui/react'
import { Search } from 'lucide-react'

interface TagInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  tags: {name: string, color: string}[]
  size?: 'sm' | 'md' | 'lg'
  onBlur?: () => void
  onKeyDown?: (e: React.KeyboardEvent) => void
  minH?: string
  fontFamily?: string
  fontSize?: string
  multiline?: boolean
}

const TagInput: React.FC<TagInputProps> = ({ 
  value, 
  onChange, 
  placeholder = "输入内容，键入 { 来引用标签", 
  tags,
  size = 'sm',
  onBlur,
  onKeyDown,
  minH,
  fontFamily,
  fontSize,
  multiline = false
}) => {
  const [cursor, setCursor] = useState(0)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null)
  const { isOpen, onOpen, onClose } = useDisclosure()

  const filteredTags = tags.filter(tag => 
    tag.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // 重置选中索引当过滤结果改变时
  React.useEffect(() => {
    setSelectedIndex(0)
  }, [filteredTags.length])

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const val = e.target.value
    const pos = e.target.selectionStart || 0
    onChange(val)
    setCursor(pos)

    // 检测输入 {
    if (val[pos - 1] === '{') {
      const newVal = val.slice(0, pos) + '}' + val.slice(pos)
      onChange(newVal)
      setSearchTerm('')

      // 光标移到 {} 中间
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.setSelectionRange(pos, pos)
        }
      }, 0)

      onOpen() // 打开标签弹窗
    }
  }, [onChange, onOpen])

  const handleSelectTag = useCallback((tagName: string) => {
    // 找到光标前最近的 { 位置
    const beforeCursor = value.slice(0, cursor)
    const lastBraceIndex = beforeCursor.lastIndexOf('{')
    
    if (lastBraceIndex !== -1) {
      // 找到对应的 } 位置
      const afterCursor = value.slice(cursor)
      const nextBraceIndex = afterCursor.indexOf('}')
      
      if (nextBraceIndex !== -1) {
        const newVal = 
          value.slice(0, lastBraceIndex + 1) + 
          tagName + 
          value.slice(cursor + nextBraceIndex)
        onChange(newVal)
        
        // 将光标移到标签后面
        setTimeout(() => {
          if (inputRef.current) {
            const newCursorPos = lastBraceIndex + 1 + tagName.length + 1
            inputRef.current.setSelectionRange(newCursorPos, newCursorPos)
          }
        }, 0)
      }
    }
    
    onClose()
  }, [value, cursor, onChange, onClose])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (isOpen) {
      if (e.key === 'Escape') {
        onClose()
        return
      }
      
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex(prev => 
          prev < filteredTags.length - 1 ? prev + 1 : 0
        )
        return
      }
      
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : filteredTags.length - 1
        )
        return
      }
      
      if (e.key === 'Enter' && filteredTags.length > 0) {
        e.preventDefault()
        handleSelectTag(filteredTags[selectedIndex].name)
        return
      }
    }
    
    // 调用外部传入的onKeyDown事件
    if (onKeyDown) {
      onKeyDown(e)
    }
  }, [isOpen, onClose, onKeyDown, filteredTags, selectedIndex, handleSelectTag])

  // 渲染带有高亮标签的内容
  // const renderValueWithTags = (text: string) => {
  //   const parts = text.split(/({[^}]*})/g)
  //   return parts.map((part, index) => {
  //     if (part.match(/^{.*}$/)) {
  //       const tagName = part.slice(1, -1)
  //       return (
  //         <Badge 
  //           key={index} 
  //           colorScheme="purple" 
  //           variant="subtle" 
  //           mx={1}
  //           fontSize="xs"
  //         >
  //           {tagName}
  //         </Badge>
  //       )
  //     }
  //     return part
  //   })
  // }

  return (
    <Box position="relative">
      <Popover isOpen={isOpen} placement="bottom-start" onClose={onClose}>
        <PopoverTrigger>
          {multiline ? (
            <Textarea
              ref={inputRef as React.RefObject<HTMLTextAreaElement>}
              value={value}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              onBlur={onBlur}
              placeholder={placeholder}
              size={size}
              minH={minH}
              fontFamily={fontFamily}
              fontSize={fontSize}
              resize="vertical"
            />
          ) : (
            <Input
              ref={inputRef as React.RefObject<HTMLInputElement>}
              value={value}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              onBlur={onBlur}
              placeholder={placeholder}
              size={size}
            />
          )}
        </PopoverTrigger>
        <PopoverContent w="250px" p={2}>
          <VStack spacing={2} align="stretch">
            <InputGroup size="sm">
              <InputLeftElement>
                <Search size={14} />
              </InputLeftElement>
              <Input
                placeholder="搜索标签"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </InputGroup>
            
            <Box maxH="200px" overflowY="auto" css={{
              '&::-webkit-scrollbar': {
                width: '6px',
              },
              '&::-webkit-scrollbar-track': {
                background: 'transparent',
              },
              '&::-webkit-scrollbar-thumb': {
                background: '#CBD5E0',
                borderRadius: '3px',
              },
              '&::-webkit-scrollbar-thumb:hover': {
                background: '#A0AEC0',
              },
            }}>
              <List spacing={1}>
                {filteredTags.length > 0 ? (
                  filteredTags.map((tag, index) => (
                    <ListItem
                      key={tag.name}
                      p={2}
                      borderRadius="md"
                      bg={index === selectedIndex ? 'gray.100' : 'transparent'}
                      _hover={{ bg: 'gray.100', cursor: 'pointer' }}
                      onClick={() => handleSelectTag(tag.name)}
                    >
                      <Badge colorScheme={tag.color} variant="outline" mr={2}>
                        {tag.name}
                      </Badge>
                    </ListItem>
                  ))
                ) : (
                  <ListItem p={2}>
                    <Text fontSize="sm" color="gray.500">
                      未找到匹配的标签
                    </Text>
                  </ListItem>
                )}
              </List>
            </Box>
          </VStack>
        </PopoverContent>
      </Popover>
    </Box>
  )
}

export default TagInput