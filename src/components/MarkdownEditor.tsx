import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react'
import MDEditor, { commands } from '@uiw/react-md-editor'
import { Box, useColorModeValue, Portal, VStack, Text, Button, Badge, Tooltip, useToast } from '@chakra-ui/react'
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
  
  // 添加历史记录状态，用于撤销功能
  const historyRef = useRef<{
    past: string[];
    future: string[];
  }>({ past: [], future: [] });
  const [selectedSuggestion, setSelectedSuggestion] = useState(0)
  const mdEditorRef = useRef<any>(null)
  const toast = useToast()
  
  // FIX: 删除未使用的颜色变量
  const suggestionBg = useColorModeValue('white', 'gray.700')
  const suggestionBorder = useColorModeValue('gray.200', 'gray.600')

  // 撤销操作
  const undo = useCallback(() => {
    const { past, future } = historyRef.current;
    if (past.length === 0) return;

    const newPast = [...past];
    const previous = newPast.pop();
    const newFuture = [value, ...future];

    historyRef.current = {
      past: newPast,
      future: newFuture
    };

    if (previous !== undefined) {
      onChange(previous);
    }
  }, [value, onChange]);

  // 处理粘贴事件
  const handlePaste = useCallback(async (event: ClipboardEvent) => {
    console.log('粘贴事件触发');
    const items = event.clipboardData?.items;
    if (!items) {
      console.log('没有粘贴项');
      return;
    }

    console.log('粘贴项数量:', items.length);
    let hasImage = false;
    
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      console.log('粘贴项类型:', item.type);
      
      if (item.type.startsWith('image/')) {
        hasImage = true;
        const file = item.getAsFile();
        if (!file) {
          console.log('无法获取文件');
          continue;
        }
        
        console.log('获取到图片文件:', file.name, file.size);
        event.preventDefault();
        
        const textarea = document.querySelector('.w-md-editor-text-input') as HTMLTextAreaElement;
        if (!textarea) {
          console.error('找不到文本区域元素');
          return;
        }
        
        // 显示临时占位符
        const placeholderText = '![上传中...]()'; 
        const selectionStart = textarea.selectionStart;
        const selectionEnd = textarea.selectionEnd;
        const newValue =
          value.substring(0, selectionStart) +
          placeholderText +
          value.substring(selectionEnd);
        onChange(newValue);
        
        // 上传图片到后端
        try {
          const formData = new FormData();
          formData.append('image', file);
          console.log('准备上传图片');
          
          const response = await fetch('/upload', {
            method: 'POST',
            body: formData,
          });
          
          console.log('上传响应状态:', response.status);
          if (!response.ok) {
            throw new Error('Image upload failed');
          }
          
          const data = await response.json();
          console.log('上传响应数据:', data);
          const imageUrl = data.imageUrl;
          const isDuplicate = data.isDuplicate;
          
          // 替换占位符为实际图片链接
          const markdownImage = `![](${imageUrl})`;
          
          // 如果是重复图片，不显示提示信息（根据需求1）
          
          const currentValue = textarea.value;
          const placeholderIndex = currentValue.indexOf('![上传中...]()'); 
          
          console.log('占位符索引:', placeholderIndex);
          if (placeholderIndex !== -1) {
            const updatedValue =
              currentValue.substring(0, placeholderIndex) +
              markdownImage +
              currentValue.substring(placeholderIndex + '![上传中...]()'.length);
            onChange(updatedValue);
            console.log('已替换占位符为图片链接');
            
            // 移动光标到插入图片后的位置
            const newCursorPos = placeholderIndex + markdownImage.length;
            setTimeout(() => {
              textarea.setSelectionRange(newCursorPos, newCursorPos);
              textarea.focus();
            }, 0);
          }
        } catch (error) {
          console.error('上传图片失败:', error);
          // 上传失败，移除占位符
          const currentValue = textarea.value;
          const placeholderIndex = currentValue.indexOf('![上传中...]()'); 
          
          if (placeholderIndex !== -1) {
            const updatedValue =
              currentValue.substring(0, placeholderIndex) +
              currentValue.substring(placeholderIndex + '![上传中...]()'.length);
            onChange(updatedValue);
            console.log('已移除占位符');
          }
        }
      }
    }
  }, [value, onChange]);

  useEffect(() => {
    // 使用 setTimeout 确保编辑器已经完全渲染
    const timeoutId = setTimeout(() => {
      const textarea = document.querySelector('.w-md-editor-text-input') as HTMLTextAreaElement;
      if (!textarea) {
        console.error('找不到文本区域元素');
        return;
      }

      console.log('找到文本区域元素:', textarea);
      textarea.addEventListener('paste', handlePaste);
    }, 500);

    // 设置键盘事件监听器，用于撤销操作
    const handleKeyDown = (e: KeyboardEvent) => {
      // 检测 Ctrl+Z 或 Command+Z
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        undo();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      clearTimeout(timeoutId);
      // 清理历史记录保存定时器
      if (saveHistoryTimeoutRef.current) {
        clearTimeout(saveHistoryTimeoutRef.current);
      }
      const textarea = document.querySelector('.w-md-editor-text-input') as HTMLTextAreaElement;
      textarea?.removeEventListener('paste', handlePaste);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handlePaste, undo]);

  // 用于延迟保存历史记录的定时器
  const saveHistoryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // 处理标签自动补全
  const handleEditorChange = useCallback((val?: string) => {
    if (val !== undefined) {
      // 延迟保存历史记录，减少保存频率
      if (value !== val) {
        // 清除之前的定时器
        if (saveHistoryTimeoutRef.current) {
          clearTimeout(saveHistoryTimeoutRef.current);
        }
        
        // 设置新的定时器，延迟1秒保存历史记录
        saveHistoryTimeoutRef.current = setTimeout(() => {
          const { past } = historyRef.current;
          // 只保留最新的20次操作
          const newPast = [...past, value];
          const limitedPast = newPast.length > 20 ? newPast.slice(-20) : newPast;
          
          historyRef.current = {
            past: limitedPast,
            future: []
          };
          saveHistoryTimeoutRef.current = null;
        }, 1000);
      }
      
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
  }, [onChange, tags, value])

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