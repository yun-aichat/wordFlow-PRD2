import React from 'react'
import { Text, Badge, Box } from '@chakra-ui/react'

interface TaggedTextProps {
  text: string
  fontSize?: string
  fontWeight?: string
  color?: string
  tags?: {name: string, color: string}[]
  [key: string]: any
}

const TaggedText: React.FC<TaggedTextProps> = ({ 
  text, 
  fontSize = 'sm', 
  fontWeight = 'medium', 
  color,
  tags = [],
  ...props 
}) => {
  // 解析文本中的标签
  const parseTextWithTags = (inputText: string) => {
    const parts = inputText.split(/({[^}]*})/g)
    
    return parts.map((part, index) => {
      if (part.match(/^{.*}$/)) {
        const tagName = part.slice(1, -1)
        // const tagData = tags.find(tag => tag.name === tagName)
        // const tagColor = tagData ? tagData.color : 'purple'
        
        return (
          <Badge 
            key={index} 
            colorScheme="blue" 
            variant="subtle" 
            mx={1}
            fontSize="xs"
            display="inline-flex"
            alignItems="center"
          >
            {tagName}
          </Badge>
        )
      }
      return part
    })
  }

  return (
    <Box display="inline-flex" alignItems="center" flexWrap="wrap" {...props}>
      <Text 
        fontSize={fontSize} 
        fontWeight={fontWeight} 
        color={color}
        display="inline-flex"
        alignItems="center"
        flexWrap="wrap"
      >
        {parseTextWithTags(text)}
      </Text>
    </Box>
  )
}

export default TaggedText