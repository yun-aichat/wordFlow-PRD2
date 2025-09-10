import { visit } from 'unist-util-visit'
import { Tag } from '../types'

// 标签高亮的remark插件
export function remarkTagHighlight(tags: Tag[]) {
  return (tree: any) => {
    if (!tree) return tree
    
    visit(tree, 'text', (node: any, index: number | undefined, parent: any) => {
      // 检查必要的参数
      if (!node || !parent || typeof index === 'undefined' || !parent.children || !Array.isArray(parent.children)) {
        return
      }
      
      const text = node.value
      if (!text || typeof text !== 'string') {
        return
      }
      
      const tagRegex = /\{([^}]+)\}/g
      let match
      const newNodes = []
      let lastIndex = 0

      while ((match = tagRegex.exec(text)) !== null) {
        const tagName = match[1]
        const tag = tags.find(t => t.name === tagName)
        
        // 添加标签前的文本
        if (match.index > lastIndex) {
          newNodes.push({
            type: 'text',
            value: text.slice(lastIndex, match.index)
          })
        }

        // 添加标签节点
        if (tag) {
          newNodes.push({
            type: 'html',
            value: `<span class="tag-highlight" data-tag-id="${tag.id}" data-tag-name="${tag.name}" data-tag-description="${tag.description || ''}" data-tag-color="${tag.color}" style="background-color: var(--chakra-colors-${tag.color}-100); color: var(--chakra-colors-${tag.color}-800); padding: 2px 6px; border-radius: 4px; font-size: 0.875em; font-weight: 500; cursor: help; position: relative; transition: all 0.2s;" onmouseover="this.style.transform='scale(1.05)'; this.style.boxShadow='0 2px 8px rgba(0,0,0,0.1)';" onmouseout="this.style.transform='scale(1)'; this.style.boxShadow='none';">{${tagName}}</span>`
          })
        } else {
          // 未找到对应标签，保持原样
          newNodes.push({
            type: 'text',
            value: match[0]
          })
        }

        lastIndex = match.index + match[0].length
      }

      // 添加剩余文本
      if (lastIndex < text.length) {
        newNodes.push({
          type: 'text',
          value: text.slice(lastIndex)
        })
      }

      // 如果找到了标签，替换当前节点
      if (newNodes.length > 1) {
        parent.children.splice(index, 1, ...newNodes)
      }
    })
  }
}

// 标签自动补全功能
export function getTagSuggestions(text: string, cursorPosition: number, tags: Tag[]) {
  const beforeCursor = text.slice(0, cursorPosition)
  const match = beforeCursor.match(/\{([^}]*)$/)
  
  if (match) {
    const query = match[1].toLowerCase()
    const suggestions = tags.filter(tag => 
      tag.name.toLowerCase().includes(query)
    ).map(tag => ({
      label: tag.name,
      value: `{${tag.name}}`,
      description: tag.description,
      color: tag.color
    }))
    
    return {
      suggestions,
      startPos: cursorPosition - match[1].length,
      endPos: cursorPosition
    }
  }
  
  return null
}