import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react'
import MDEditor, { commands } from '@uiw/react-md-editor'
import { Box, useColorModeValue, Portal, VStack, Text, Button, Badge, Tooltip } from '@chakra-ui/react'
import { Tag as TagIcon } from 'lucide-react' // 导入 Tag 图标
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

const PreviewTag: React.FC<{ tagName: string; tags: Tag[] }> = ({ tagName, tags }) => {
    const tagData = tags.find(tag => tag.name === tagName);
    const tagColor = tagData ? tagData.color : 'gray';
    const tagDescription = tagData ? tagData.description : `Tag: ${tagName}`;

    const tagElement = (
        <Badge 
            colorScheme={tagColor} 
            variant="subtle" 
            mx={1}
            fontSize="xs"
            display="inline-flex"
            alignItems="center"
            cursor="pointer"
        >
            {tagName}
        </Badge>
    );

    if (tagData && tagData.description) {
        return (
            <Tooltip label={tagDescription} fontSize="sm" hasArrow>
                {tagElement}
            </Tooltip>
        );
    }
    
    return tagElement;
};

const MarkdownEditor: React.FC<MarkdownEditorProps> = ({
  value,
  onChange,
  tags,
  placeholder = '开始编写内容...',
  height = 400,
}) => {
  // 移除预览模式状态，只保留编辑模式
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [suggestionPosition, setSuggestionPosition] = useState({ x: 0, y: 0 })
  const [selectedSuggestion, setSelectedSuggestion] = useState(0)
  const mdEditorRef = useRef<any>(null)
  
  // const bgColor = useColorModeValue('white', 'gray.800')
  // const borderColor = useColorModeValue('gray.200', 'gray.600')
  const suggestionBg = useColorModeValue('white', 'gray.700')
  const suggestionBorder = useColorModeValue('gray.200', 'gray.600')

  useEffect(() => {
    const textarea = mdEditorRef.current?.textarea;
    if (!textarea) return;

    const handlePaste = (event: ClipboardEvent) => {
      const items = event.clipboardData?.items;
      if (!items) return;

      const imageItem = Array.from(items).find(item => item.type.startsWith('image/'));

      if (imageItem) {
        const file = imageItem.getAsFile();
        if (file) {
          event.preventDefault();
          const reader = new FileReader();
          reader.onload = (e) => {
            const imageUrl = e.target?.result as string;
            if (imageUrl) {
              const markdownImage = `![](${imageUrl})`;
              const { selectionStart, selectionEnd } = textarea;
              const newValue =
                value.substring(0, selectionStart) +
                markdownImage +
                value.substring(selectionEnd);
              onChange(newValue);
              
              // Move cursor after inserted image
              setTimeout(() => {
                const newCursorPos = selectionStart + markdownImage.length;
                textarea.setSelectionRange(newCursorPos, newCursorPos);
                textarea.focus();
              }, 0);
            }
          };
          reader.onerror = (error) => {
            console.error("Failed to read file:", error);
            // Optionally show an error to the user
          };
          reader.readAsDataURL(file);
        }
      }
    };

    textarea.addEventListener('paste', handlePaste);

    return () => {
      textarea.removeEventListener('paste', handlePaste);
    };
  }, [value, onChange]);

  // 处理标签自动补全
  const handleEditorChange = useCallback((val?: string) => {
    if (val !== undefined) {
      onChange(val)
      
      // 检查是否需要显示标签建议
      const textarea = mdEditorRef.current?.textarea
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
        icon: <TagIcon size={12} />,
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
      commands.fullscreen,
      extraCommands[0], // 将自定义的添加标签命令添加到工具栏
    ]
    return commandList
  }, [])

  const customPreviewComponents = useMemo(() => ({
    p: ({ children }: { children: React.ReactNode }) => {
        const processChildren = (nodes: React.ReactNode): React.ReactNode => {
            if (!nodes) return null;

            return React.Children.map(nodes, (child, index) => {
                if (typeof child === 'string') {
                    const parts = child.split(/({[^}]*})/g).filter(part => part);
                    return parts.map((part, i) => {
                        if (part.match(/^{.*}$/)) {
                            const tagName = part.slice(1, -1);
                            return <PreviewTag key={`${index}-${i}`} tagName={tagName} tags={tags} />;
                        }
                        return part;
                    });
                }
                if (React.isValidElement(child) && child.props.children) {
                    return React.cloneElement(child, {
                        ...child.props,
                        children: processChildren(child.props.children)
                    });
                }
                return child;
            });
        };

        return <p>{processChildren(children)}</p>;
    },
  }), [tags]);

  // 处理建议选择
  const handleSuggestionSelect = useCallback((suggestion: any) => {
    const textarea = mdEditorRef.current
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
          ref={mdEditorRef}
          value={value}
          onChange={handleEditorChange}
          height={height}
          hideToolbar={false}
          visibleDragbar={false}
          textareaProps={{
            placeholder,
          }}
          data-color-mode={useColorModeValue('light', 'dark')}
          previewOptions={{
            components: customPreviewComponents,
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
            <VStack spacing={1} align="stretch" p={1}>
              {tags.map((tag) => (
                <Box
                  key={tag.id}
                  p={2}
                  borderRadius="md"
                  _hover={{ bg: 'gray.100', cursor: 'pointer' }}
                  onClick={() => handleTagSelect(tag)}
                >
                  <Badge colorScheme={tag.color} variant="subtle">
                    {tag.name}
                  </Badge>
                </Box>
              ))}
            </VStack>
          </Box>
        </Portal>
      )}
    </TagTooltip>
  )
}

export default MarkdownEditor