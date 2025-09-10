import React, { useState, useEffect } from 'react'
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  IconButton,
  Input,
  Textarea,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  useDisclosure,
  Card,
  CardBody,
  CardHeader,
  Heading,
  Badge,
  Flex,
  useColorModeValue,
  useToast,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  Grid,
  GridItem
} from '@chakra-ui/react'
import { AddIcon, EditIcon, DeleteIcon, DownloadIcon, AttachmentIcon } from '@chakra-ui/icons'
import { Project } from '../types'
import {
  getAllProjects,
  createProject,
  saveProject,
  deleteProject,
  exportProject,
  importProject,
  generateThumbnail
} from '../services/localStorage'

interface ProjectListProps {
  onProjectSelect: (project: Project) => void
}

const ProjectList: React.FC<ProjectListProps> = ({ onProjectSelect }) => {
  const [projects, setProjects] = useState<Project[]>([])
  const [editingProject, setEditingProject] = useState<Project | null>(null)
  const [newProjectName, setNewProjectName] = useState('')
  const [newProjectDescription, setNewProjectDescription] = useState('')
  const [deleteProjectId, setDeleteProjectId] = useState<string | null>(null)
  
  const { isOpen: isCreateOpen, onOpen: onCreateOpen, onClose: onCreateClose } = useDisclosure()
  const { isOpen: isEditOpen, onOpen: onEditOpen, onClose: onEditClose } = useDisclosure()
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure()
  
  const toast = useToast()
  const cancelRef = React.useRef<HTMLButtonElement>(null)
  
  const cardBg = useColorModeValue('white', 'gray.700')
  const borderColor = useColorModeValue('gray.200', 'gray.600')
  const hoverBg = useColorModeValue('gray.50', 'gray.600')

  // 加载项目列表
  const loadProjects = () => {
    const allProjects = getAllProjects()
    setProjects(allProjects)
  }

  useEffect(() => {
    loadProjects()
  }, [])

  // 创建新项目
  const handleCreateProject = () => {
    if (!newProjectName.trim()) {
      toast({
        title: '请输入项目名称',
        status: 'warning',
        duration: 2000
      })
      return
    }

    const project = createProject(newProjectName.trim(), newProjectDescription.trim())
    saveProject(project)
    loadProjects()
    
    setNewProjectName('')
    setNewProjectDescription('')
    onCreateClose()
    
    toast({
      title: '项目创建成功',
      status: 'success',
      duration: 2000
    })
  }

  // 编辑项目
  const handleEditProject = (project: Project) => {
    setEditingProject(project)
    setNewProjectName(project.name)
    setNewProjectDescription(project.description)
    onEditOpen()
  }

  // 保存编辑
  const handleSaveEdit = () => {
    if (!editingProject || !newProjectName.trim()) {
      toast({
        title: '请输入项目名称',
        status: 'warning',
        duration: 2000
      })
      return
    }

    const updatedProject = {
      ...editingProject,
      name: newProjectName.trim(),
      description: newProjectDescription.trim()
    }
    
    saveProject(updatedProject)
    loadProjects()
    
    setEditingProject(null)
    setNewProjectName('')
    setNewProjectDescription('')
    onEditClose()
    
    toast({
      title: '项目更新成功',
      status: 'success',
      duration: 2000
    })
  }

  // 删除项目确认
  const handleDeleteConfirm = (projectId: string) => {
    setDeleteProjectId(projectId)
    onDeleteOpen()
  }

  // 执行删除
  const handleDeleteProject = () => {
    if (deleteProjectId) {
      deleteProject(deleteProjectId)
      loadProjects()
      setDeleteProjectId(null)
      onDeleteClose()
      
      toast({
        title: '项目删除成功',
        status: 'success',
        duration: 2000
      })
    }
  }

  // 导出项目
  const handleExportProject = (project: Project) => {
    try {
      const data = exportProject(project.id)
      const blob = new Blob([data], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${project.name}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
      toast({
        title: '项目导出成功',
        status: 'success',
        duration: 2000
      })
    } catch (error) {
      toast({
        title: '导出失败',
        description: (error as Error).message,
        status: 'error',
        duration: 3000
      })
    }
  }

  // 导入项目
  const handleImportProject = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        const reader = new FileReader()
        reader.onload = (e) => {
          try {
            const data = e.target?.result as string
            importProject(data)
            loadProjects()
            
            toast({
              title: '项目导入成功',
              status: 'success',
              duration: 2000
            })
          } catch (error) {
            toast({
              title: '导入失败',
              description: (error as Error).message,
              status: 'error',
              duration: 3000
            })
          }
        }
        reader.readAsText(file)
      }
    }
    input.click()
  }

  return (
    <Box p={6} maxW="1200px" mx="auto">
      <VStack spacing={6} align="stretch">
        {/* 头部 */}
        <Flex justify="space-between" align="center">
          <Heading size="lg">项目管理</Heading>
          <HStack spacing={3}>
            <Button
              leftIcon={<AttachmentIcon />}
              variant="outline"
              onClick={handleImportProject}
            >
              导入项目
            </Button>
            <Button
              leftIcon={<AddIcon />}
              colorScheme="blue"
              onClick={onCreateOpen}
            >
              新建项目
            </Button>
          </HStack>
        </Flex>

        {/* 项目网格 */}
        {projects.length === 0 ? (
          <Box textAlign="center" py={12}>
            <Text color="gray.500" fontSize="lg">
              还没有项目，点击上方按钮创建第一个项目
            </Text>
          </Box>
        ) : (
          <Grid templateColumns="repeat(auto-fill, minmax(300px, 1fr))" gap={6}>
            {projects.map((project) => (
              <GridItem key={project.id}>
                <Card
                  bg={cardBg}
                  borderColor={borderColor}
                  borderWidth={1}
                  cursor="pointer"
                  transition="all 0.2s"
                  _hover={{
                    bg: hoverBg,
                    transform: 'translateY(-2px)',
                    shadow: 'md'
                  }}
                  onClick={() => onProjectSelect(project)}
                >
                  <CardHeader pb={2}>
                    <Flex justify="space-between" align="flex-start">
                      <VStack align="flex-start" spacing={1} flex={1}>
                        <Heading size="md" noOfLines={1}>
                          {project.name}
                        </Heading>
                        <Text fontSize="sm" color="gray.500">
                          {new Date(project.updatedAt).toLocaleDateString()}
                        </Text>
                      </VStack>
                      <HStack spacing={1}>
                        <IconButton
                          aria-label="编辑项目"
                          icon={<EditIcon />}
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleEditProject(project)
                          }}
                        />
                        <IconButton
                          aria-label="导出项目"
                          icon={<DownloadIcon />}
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleExportProject(project)
                          }}
                        />
                        <IconButton
                          aria-label="删除项目"
                          icon={<DeleteIcon />}
                          size="sm"
                          variant="ghost"
                          colorScheme="red"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteConfirm(project.id)
                          }}
                        />
                      </HStack>
                    </Flex>
                  </CardHeader>
                  <CardBody pt={0}>
                    <VStack align="flex-start" spacing={3}>
                      {project.description && (
                        <Text fontSize="sm" color="gray.600" noOfLines={2}>
                          {project.description}
                        </Text>
                      )}
                      <Badge colorScheme="blue" fontSize="xs">
                        {generateThumbnail(project.flowData.nodes)}
                      </Badge>
                    </VStack>
                  </CardBody>
                </Card>
              </GridItem>
            ))}
          </Grid>
        )}
      </VStack>

      {/* 创建项目弹窗 */}
      <Modal isOpen={isCreateOpen} onClose={onCreateClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>新建项目</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <Input
                placeholder="项目名称"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
              />
              <Textarea
                placeholder="项目描述（可选）"
                value={newProjectDescription}
                onChange={(e) => setNewProjectDescription(e.target.value)}
                rows={3}
              />
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onCreateClose}>
              取消
            </Button>
            <Button colorScheme="blue" onClick={handleCreateProject}>
              创建
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* 编辑项目弹窗 */}
      <Modal isOpen={isEditOpen} onClose={onEditClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>编辑项目</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <Input
                placeholder="项目名称"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
              />
              <Textarea
                placeholder="项目描述（可选）"
                value={newProjectDescription}
                onChange={(e) => setNewProjectDescription(e.target.value)}
                rows={3}
              />
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onEditClose}>
              取消
            </Button>
            <Button colorScheme="blue" onClick={handleSaveEdit}>
              保存
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* 删除确认弹窗 */}
      <AlertDialog
        isOpen={isDeleteOpen}
        leastDestructiveRef={cancelRef}
        onClose={onDeleteClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              删除项目
            </AlertDialogHeader>
            <AlertDialogBody>
              确定要删除这个项目吗？此操作无法撤销。
            </AlertDialogBody>
            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onDeleteClose}>
                取消
              </Button>
              <Button colorScheme="red" onClick={handleDeleteProject} ml={3}>
                删除
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Box>
  )
}

export default ProjectList