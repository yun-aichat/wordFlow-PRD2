import React, { useState, useEffect } from 'react'
import {
  Box,
  VStack,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  Select,
  Button,
  HStack,
  Text,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  useColorModeValue,
  Alert,
  AlertIcon,
  Card,
  CardHeader,
  CardBody,
  IconButton,
  Collapse,
  useToast,
} from '@chakra-ui/react'
import { CloseIcon, ChevronUpIcon, ChevronDownIcon } from '@chakra-ui/icons'
import { Eye } from 'lucide-react'
import { useReactFlow } from 'reactflow'
import ReactMarkdown from 'react-markdown'
import { CustomNode, NodeFormData } from '../types'
import TagInput from './TagInput'

interface NodeSettingsPanelProps {
  selectedNode: CustomNode | null
  onNodeUpdate: (node: CustomNode | null) => void
  onClose: () => void
  tags: {name: string, color: string}[]
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
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
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
    }
  }, [selectedNode])

  const handleInputChange = (field: keyof NodeFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }))
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

  const handleTypeChange = (newType: 'page' | 'modal') => {
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
      overflowY="auto"
    >
      <CardHeader pb={2}>
        <HStack justify="space-between" align="center">
          <Text fontSize="lg" fontWeight="bold">
            节点设置
          </Text>
          <HStack spacing={1}>
            <IconButton
              aria-label="折叠/展开"
              icon={isCollapsed ? <ChevronDownIcon /> : <ChevronUpIcon />}
              size="sm"
              variant="ghost"
              onClick={() => setIsCollapsed(!isCollapsed)}
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

      <Collapse in={!isCollapsed}>
        <CardBody pt={0}>
          <Tabs size="sm" variant="enclosed">
            <TabList>
              <Tab>基本信息</Tab>
              <Tab>内容编辑</Tab>
            </TabList>

            <TabPanels>
              <TabPanel px={0} py={3}>
                <VStack spacing={3} align="stretch">
                  {/* 类型 */}
                  <FormControl size="sm">
                    <FormLabel fontSize="sm">类型</FormLabel>
                    <Select
                      size="sm"
                      value={selectedNode.data.type}
                      onChange={(e) => handleTypeChange(e.target.value as 'page' | 'modal')}
                    >
                      <option value="page">📄 页面</option>
                      <option value="modal">🪟 弹窗</option>
                    </Select>
                  </FormControl>

                  {/* 名称 */}
                  <FormControl size="sm">
                    <FormLabel fontSize="sm">名称</FormLabel>
                    <Input
                      size="sm"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      placeholder="输入节点名称"
                    />
                  </FormControl>

                  {/* 描述 */}
                  <FormControl size="sm">
                    <FormLabel fontSize="sm">描述</FormLabel>
                    <Textarea
                      size="sm"
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      placeholder="输入节点描述（可选）"
                      rows={2}
                    />
                  </FormControl>

                  <HStack spacing={2}>
                    <Button size="sm" colorScheme="blue" flex={1} onClick={handleSave}>
                      保存
                    </Button>
                    <Button size="sm" colorScheme="red" variant="outline" flex={1} onClick={handleDelete}>
                      删除
                    </Button>
                  </HStack>
                </VStack>
              </TabPanel>

              <TabPanel px={0} py={3}>
                <VStack spacing={3} align="stretch">
                  <FormControl size="sm">
                    <HStack justify="space-between" align="center" mb={2}>
                      <FormLabel fontSize="sm" mb={0}>PRD内容</FormLabel>
                      {formData.content && (
                        <IconButton
                          aria-label="预览"
                          icon={<Eye size={14} />}
                          size="xs"
                          variant="ghost"
                          onClick={() => setShowPreview(!showPreview)}
                        />
                      )}
                    </HStack>
                    <TagInput
                      value={formData.content}
                      onChange={(value) => handleInputChange('content', value)}
                      placeholder="支持 Markdown 格式和标签引用 {标签名}\n\n# 标题\n**粗体文本**\n- 列表项"
                      tags={tags}
                      minH="300px"
                      fontFamily="mono"
                      fontSize="xs"
                      multiline={true}
                    />
                  </FormControl>

                  {formData.content && showPreview && (
                    <Box>
                      <Text fontSize="xs" color="gray.500" mb={2}>预览:</Text>
                      <Box
                        border="1px"
                        borderColor={borderColor}
                        borderRadius="md"
                        p={2}
                        maxH="200px"
                        overflowY="auto"
                        bg={useColorModeValue('gray.50', 'gray.700')}
                        fontSize="xs"
                      >
                        <ReactMarkdown>{formData.content}</ReactMarkdown>
                      </Box>
                    </Box>
                  )}
                </VStack>
              </TabPanel>
            </TabPanels>
          </Tabs>
        </CardBody>
      </Collapse>
    </Card>
  )
}

export default NodeSettingsPanel