import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react'
import MDEditor, { commands } from '@uiw/react-md-editor'
import { Box, useColorModeValue, Portal, VStack, Text, Button } from '@chakra-ui/react'
import { Tag } from '../types'
import { remarkTagHighlight, getTagSuggestions } from '../utils/remarkTagPlugin'
import TagTooltip from './TagTooltip'
import rehypeMermaid from 'rehype-mermaid'
import '@uiw/react-md-editor/markdown-editor.css'
import '@uiw/react-markdown-preview/markdown.css'

interface MarkdownEditorProps {
  value: string
  onChange: (value: string) => void
  tags: Tag[]
  placeholder?: string
  height?: number
}

const MarkdownEditor: React.FC<MarkdownEditorProps> = ({
  value,
  onChange,
  tags,
  placeholder = '开始编写内容...',
  height = 400
}) => {
  // 移除预览模式状态，只保留编辑模式
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [suggestionPosition, setSuggestionPosition] = useState({ x: 0, y: 0 })
  const [selectedSuggestion, setSelectedSuggestion] = useState(0)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  
  // const bgColor = useColorModeValue('white', 'gray.800')
  // const borderColor = useColorModeValue('gray.200', 'gray.600')
  const suggestionBg = useColorModeValue('white', 'gray.700')
  const suggestionBorder = useColorModeValue('gray.200', 'gray.600')

  // 处理标签自动补全
  const handleEditorChange = useCallback((val?: string) => {
    if (val !== undefined) {
      onChange(val)
      
      // 检查是否需要显示标签建议
      const textarea = textareaRef.current
      if (textarea) {
        const cursorPosition = textarea.selectionStart
        const tagSuggestions = getTagSuggestions(val, cursorPosition, tags)
        
        if (tagSuggestions && tagSuggestions.suggestions.length > 0) {
          setSuggestions(tagSuggestions.suggestions)
          setSelectedSuggestion(0)
          setShowSuggestions(true)
          
          // 计算建议框位置
          const rect = textarea.getBoundingClientRect()
          setSuggestionPosition({
            x: rect.left + 10,
            y: rect.top + 30
          })
        } else {
          setShowSuggestions(false)
        }
      }
    }
  }, [onChange, tags])

  // 标签选择状态
  const [showTagSelector, setShowTagSelector] = useState(false)
  const [tagSelectorPosition, setTagSelectorPosition] = useState({ x: 0, y: 0 })
  const [currentApi, setCurrentApi] = useState<any>(null)

  // 额外的自定义命令
  const extraCommands = useMemo(() => {
    return [
      {
        name: 'tag-add',
        keyCommand: 'tag-add',
        buttonProps: { 'aria-label': '添加标签', title: '添加标签' },
        icon: (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
            <path d="M5.5 7A1.5 1.5 0 0 1 4 5.5V4a2 2 0 0 1 2-2h1.5A1.5 1.5 0 0 1 9 3.5v1A1.5 1.5 0 0 1 7.5 6H6a2 2 0 0 1-2 2v1.5zM20 12l-1.5-1.5L17 12l1.5 1.5L20 12zm-2-5.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0z"/>
          </svg>
        ),
        execute: (_state: any, api: any) => {
          // 显示标签选择器
          setCurrentApi(api)
          const button = document.querySelector('[aria-label="添加标签"]')
          if (button) {
            const rect = button.getBoundingClientRect()
            setTagSelectorPosition({ x: rect.left, y: rect.bottom + 5 })
          }
          setShowTagSelector(true)
        },
      },
    ]
  }, [])

  // 自定义工具栏命令，恢复完整的编辑器功能
  const customCommands = useMemo(() => {
    // 使用 MDEditor 提供的默认命令，包含预览、编辑、全屏等功能
    const commandList = [
      commands.bold,
      commands.italic,
      commands.strikethrough,
      commands.hr,
      commands.title,
      commands.divider,
      commands.link,
      commands.quote,
      commands.code,
      commands.codeBlock,
      commands.comment,
      commands.image,
      commands.table,
      commands.divider,
      commands.unorderedListCommand,
      commands.orderedListCommand,
      commands.checkedListCommand,
      commands.divider,
      commands.codeEdit,
      commands.codeLive,
      commands.codePreview,
      commands.divider,
      commands.fullscreen
    ]
    return commandList
  }, [])

  // 处理建议选择
  const handleSuggestionSelect = useCallback((suggestion: any) => {
    const textarea = textareaRef.current
    if (textarea) {
      const cursorPosition = textarea.selectionStart
      const beforeCursor = value.slice(0, cursorPosition)
      const afterCursor = value.slice(cursorPosition)
      const match = beforeCursor.match(/\{([^}]*)$/)
      
      if (match) {
        const newValue = beforeCursor.slice(0, match.index) + suggestion.value + afterCursor
        onChange(newValue)
        setShowSuggestions(false)
        
        // 设置光标位置
        setTimeout(() => {
          const newCursorPos = match.index! + suggestion.value.length
          textarea.setSelectionRange(newCursorPos, newCursorPos)
          textarea.focus()
        }, 0)
      }
    }
  }, [value, onChange])

  // 处理标签选择
  const handleTagSelect = useCallback((tag: Tag) => {
    if (currentApi) {
      // 使用编辑器自己的标签样式格式
      const tagText = `{${tag.name}}`
      currentApi.replaceSelection(tagText)
    }
    setShowTagSelector(false)
    setCurrentApi(null)
  }, [currentApi])

  // 键盘事件处理
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (showSuggestions) {
        if (e.key === 'ArrowDown') {
          e.preventDefault()
          setSelectedSuggestion(prev => (prev + 1) % suggestions.length)
        } else if (e.key === 'ArrowUp') {
          e.preventDefault()
          setSelectedSuggestion(prev => (prev - 1 + suggestions.length) % suggestions.length)
        } else if (e.key === 'Enter' || e.key === 'Tab') {
          e.preventDefault()
          handleSuggestionSelect(suggestions[selectedSuggestion])
        } else if (e.key === 'Escape') {
          setShowSuggestions(false)
        }
      }
      
      if (showTagSelector && e.key === 'Escape') {
        setShowTagSelector(false)
        setCurrentApi(null)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [showSuggestions, suggestions, selectedSuggestion, handleSuggestionSelect, showTagSelector])

  // 点击外部关闭标签选择器
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (showTagSelector) {
        const target = e.target as Element
        if (!target.closest('[data-tag-selector]') && !target.closest('[aria-label="添加标签"]')) {
          setShowTagSelector(false)
          setCurrentApi(null)
        }
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showTagSelector])

  // 自定义预览组件，支持标签高亮


  return (
    <TagTooltip>
      <Box position="relative">
        <MDEditor
          value={value}
          onChange={handleEditorChange}
          height={height}
          hideToolbar={false}
          visibleDragbar={false}
          textareaProps={{
            placeholder,
          }}
          data-color-mode={useColorModeValue('light', 'dark')}
          extraCommands={extraCommands}
          previewOptions={{
            remarkPlugins: [remarkTagHighlight(tags)],
            rehypePlugins: [[rehypeMermaid, { strategy: 'inline-svg' }]],
          }}
          commands={customCommands}
        />
      </Box>

      {/* 标签建议框 */}
      {showSuggestions && (
        <Portal>
          <Box
            position="fixed"
            left={suggestionPosition.x}
            top={suggestionPosition.y}
            bg={suggestionBg}
            border="1px"
            borderColor={suggestionBorder}
            borderRadius="md"
            shadow="lg"
            zIndex={9999}
            maxW="300px"
            maxH="200px"
            overflowY="auto"
          >
            <VStack spacing={0} align="stretch">
              {suggestions.map((suggestion, index) => (
                <Button
                  key={suggestion.label}
                  variant="ghost"
                  size="sm"
                  justifyContent="flex-start"
                  bg={index === selectedSuggestion ? 'blue.50' : 'transparent'}
                  color={index === selectedSuggestion ? 'blue.600' : 'inherit'}
                  _hover={{ bg: 'blue.50', color: 'blue.600' }}
                  onClick={() => handleSuggestionSelect(suggestion)}
                  borderRadius={0}
                >
                  <VStack spacing={0} align="flex-start" w="full">
                    <Text fontSize="sm" fontWeight="medium">
                      {suggestion.label}
                    </Text>
                    {suggestion.description && (
                      <Text fontSize="xs" color="gray.500" noOfLines={1}>
                        {suggestion.description}
                      </Text>
                    )}
                  </VStack>
                </Button>
              ))}
            </VStack>
          </Box>
        </Portal>
      )}

      {/* 标签选择器 */}
       {showTagSelector && (
         <Portal>
           <Box
             position="fixed"
             left={`${tagSelectorPosition.x}px`}
             top={`${tagSelectorPosition.y}px`}
             bg={suggestionBg}
             border="1px solid"
             borderColor={suggestionBorder}
             borderRadius="md"
             boxShadow="lg"
             zIndex={9999}
             maxH="200px"
             overflowY="auto"
             minW="150px"
             data-tag-selector
           >
            <VStack spacing={0} align="stretch">
              {tags.map((tag) => (
                <Button
                  key={tag.id}
                  variant="ghost"
                  size="sm"
                  justifyContent="flex-start"
                  _hover={{ bg: 'blue.50' }}
                  onClick={() => handleTagSelect(tag)}
                  borderRadius={0}
                >
                  <Text fontSize="sm" color={tag.color}>
                    {tag.name}
                  </Text>
                </Button>
              ))}
            </VStack>
          </Box>
        </Portal>
      )}
    </TagTooltip>
  )
}

export default MarkdownEditor