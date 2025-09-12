import React, { useState, useCallback, useRef } from 'react'
import {
  Box,
  Text,
  useColorModeValue,
  VStack,
  HStack,
  IconButton,
  Input,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  Button,
  Flex,
} from '@chakra-ui/react'
import { Download, Eye, FileText, X } from 'lucide-react'
import MDEditor from '@uiw/react-md-editor'
import { CustomNode } from '../types'

interface MarkdownFileNodeProps {
  data: CustomNode['data']
  selected?: boolean
  onUpdate?: (updatedData: CustomNode['data']) => void
}

const MarkdownFileNode: React.FC<MarkdownFileNodeProps> = ({ 
  data, 
  selected = false, 
  onUpdate 
}) => {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [markdownContent, setMarkdownContent] = useState(data.markdownFile?.content || '')
  const toast = useToast()

  const borderColor = useColorModeValue('gray.200', 'gray.600')
  const selectedBorderColor = useColorModeValue('blue.400', 'blue.300')
  const textColor = useColorModeValue('gray.800', 'white')
  const subtextColor = useColorModeValue('gray.600', 'gray.300')
  const bgColor = useColorModeValue('orange.50', 'orange.700')
  const iconColor = useColorModeValue('orange.600', 'orange.300')



  // 处理文件下载
  const handleFileDownload = useCallback(() => {
    if (!data.markdownFile) return

    const element = document.createElement('a')
    const file = new Blob([markdownContent], { type: 'text/markdown' })
    element.href = URL.createObjectURL(file)
    element.download = data.markdownFile.name
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
    URL.revokeObjectURL(element.href)

    toast({
      title: '下载完成',
      description: `文件 ${data.markdownFile.name} 已下载`,
      status: 'success',
      duration: 2000,
      isClosable: true,
    })
  }, [data.markdownFile, markdownContent, toast])

  // 处理文件删除
  const handleFileDelete = useCallback(() => {
    const updatedData = {
      ...data,
      markdownFile: undefined,
    }
    
    setMarkdownContent('')
    onUpdate?.(updatedData)

    toast({
      title: '文件已删除',
      description: 'MD文件已从节点中移除',
      status: 'info',
      duration: 2000,
      isClosable: true,
    })
  }, [data, onUpdate, toast])

  // 打开预览
  const handlePreview = useCallback(() => {
    if (data.markdownFile?.content) {
      setMarkdownContent(data.markdownFile.content)
      setIsPreviewOpen(true)
    }
  }, [data.markdownFile])

  return (
    <>
      <Box
        bg={bgColor}
        border="2px"
        borderColor={selected ? selectedBorderColor : borderColor}
        borderRadius="lg"
        p={4}
        minW="200px"
        maxW="250px"
        shadow={selected ? 'xl' : 'sm'}
        _hover={{
          shadow: 'lg',
          transform: 'translateY(-2px)',
          borderColor: selected ? selectedBorderColor : borderColor,
        }}
        transition="all 0.2s ease-in-out"
      >
        <VStack spacing={3} align="start">
          {/* 标题区域 */}
          <HStack spacing={2} w="100%">
            <Text fontSize="lg" color={iconColor}>
              📄
            </Text>
            <Text
              fontSize="md"
              fontWeight="bold"
              color={textColor}
              flex={1}
              noOfLines={2}
            >
              {data.name || 'MD文档节点'}
            </Text>
          </HStack>

          {/* 文件信息区域 */}
          {data.markdownFile ? (
            <Box w="100%" p={2} bg={useColorModeValue('white', 'gray.700')} borderRadius="md">
              <HStack spacing={2} justify="space-between">
                <HStack spacing={2} flex={1} minW={0}>
                  <FileText size={16} color={iconColor} />
                  <Text
                    fontSize="sm"
                    color={textColor}
                    noOfLines={1}
                    flex={1}
                    title={data.markdownFile.name}
                  >
                    {data.markdownFile.name}
                  </Text>
                </HStack>
                
                <HStack spacing={1}>
                  <IconButton
                    aria-label="预览文件"
                    icon={<Eye size={14} />}
                    size="xs"
                    variant="ghost"
                    colorScheme="blue"
                    onClick={handlePreview}
                  />
                  <IconButton
                    aria-label="下载文件"
                    icon={<Download size={14} />}
                    size="xs"
                    variant="ghost"
                    colorScheme="green"
                    onClick={handleFileDownload}
                  />
                  <IconButton
                    aria-label="删除文件"
                    icon={<X size={14} />}
                    size="xs"
                    variant="ghost"
                    colorScheme="red"
                    onClick={handleFileDelete}
                  />
                </HStack>
              </HStack>
            </Box>
          ) : (
            <Box w="100%">
              <Text fontSize="sm" color={subtextColor} textAlign="center">
                请在设置面板中上传MD文件
              </Text>
            </Box>
          )}
        </VStack>


      </Box>

      {/* 预览模态框 */}
      <Modal isOpen={isPreviewOpen} onClose={() => setIsPreviewOpen(false)} size="6xl">
        <ModalOverlay />
        <ModalContent maxH="90vh">
          <ModalHeader>
            <HStack spacing={2}>
              <FileText size={20} />
              <Text>{data.markdownFile?.name || 'MD文档预览'}</Text>
            </HStack>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6} overflow="auto">
            <Box h="70vh">
              <MDEditor.Markdown
                source={markdownContent}
                style={{
                  backgroundColor: 'transparent',
                  color: 'inherit',
                  height: '100%',
                  overflow: 'auto',
                }}
              />
            </Box>
            <Flex justify="flex-end" mt={4}>
              <Button
                leftIcon={<Download size={16} />}
                colorScheme="green"
                onClick={handleFileDownload}
                mr={2}
              >
                下载文件
              </Button>
              <Button onClick={() => setIsPreviewOpen(false)}>
                关闭
              </Button>
            </Flex>
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  )
}

export default MarkdownFileNode