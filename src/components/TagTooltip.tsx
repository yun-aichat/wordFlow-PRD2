import React, { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Box, Text, useColorModeValue } from '@chakra-ui/react'

interface TagTooltipProps {
  children: React.ReactNode
}

const TagTooltip: React.FC<TagTooltipProps> = ({ children }) => {
  const [tooltip, setTooltip] = useState<{
    visible: boolean
    x: number
    y: number
    content: string
    tagName: string
    tagColor: string
  }>({ visible: false, x: 0, y: 0, content: '', tagName: '', tagColor: '' })

  const tooltipBg = useColorModeValue('white', 'gray.700')
  const tooltipBorder = useColorModeValue('gray.200', 'gray.600')
  const tooltipShadow = useColorModeValue('lg', 'dark-lg')

  useEffect(() => {
    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (target.classList.contains('tag-highlight')) {
        const description = target.getAttribute('data-tag-description') || ''
        const tagName = target.getAttribute('data-tag-name') || ''
        const tagColor = target.getAttribute('data-tag-color') || 'gray'
        
        if (description) {
          const rect = target.getBoundingClientRect()
          setTooltip({
            visible: true,
            x: rect.left + rect.width / 2,
            y: rect.top - 10,
            content: description,
            tagName,
            tagColor
          })
        }
      }
    }

    const handleMouseOut = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (target.classList.contains('tag-highlight')) {
        setTooltip(prev => ({ ...prev, visible: false }))
      }
    }

    const handleScroll = () => {
      setTooltip(prev => ({ ...prev, visible: false }))
    }

    document.addEventListener('mouseover', handleMouseOver)
    document.addEventListener('mouseout', handleMouseOut)
    document.addEventListener('scroll', handleScroll, true)

    return () => {
      document.removeEventListener('mouseover', handleMouseOver)
      document.removeEventListener('mouseout', handleMouseOut)
      document.removeEventListener('scroll', handleScroll, true)
    }
  }, [])

  return (
    <>
      {children}
      {tooltip.visible && createPortal(
        <Box
          position="fixed"
          left={tooltip.x}
          top={tooltip.y}
          transform="translateX(-50%) translateY(-100%)"
          bg={tooltipBg}
          border="1px"
          borderColor={tooltipBorder}
          borderRadius="md"
          shadow={tooltipShadow}
          px={3}
          py={2}
          zIndex={10000}
          maxW="300px"
          pointerEvents="none"
        >
          <Text fontSize="xs" fontWeight="medium" color={`${tooltip.tagColor}.600`} mb={1}>
            {tooltip.tagName}
          </Text>
          <Text fontSize="sm" color="gray.600">
            {tooltip.content}
          </Text>
          {/* 小箭头 */}
          <Box
            position="absolute"
            bottom="-5px"
            left="50%"
            transform="translateX(-50%)"
            w={0}
            h={0}
            borderLeft="5px solid transparent"
            borderRight="5px solid transparent"
            borderTop={`5px solid ${tooltipBorder}`}
          />
        </Box>,
        document.body
      )}
    </>
  )
}

export default TagTooltip