import React, { useState, useRef, useEffect } from 'react';
import { EdgeProps, getBezierPath, useReactFlow } from 'reactflow';
import { useColorModeValue } from '@chakra-ui/react';

interface CustomEdgeData {
  label?: string;
}

const CustomEdge: React.FC<EdgeProps> = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  data,
}) => {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const [isEditing, setIsEditing] = useState(false);
  const [label, setLabel] = useState(data?.label || '');
  const inputRef = useRef<HTMLInputElement>(null);
  const { setEdges } = useReactFlow();

  // 颜色模式适配
  const bgColor = useColorModeValue('white', '#2D3748');
  const textColor = useColorModeValue('black', 'white');
  const borderColor = useColorModeValue('#E2E8F0', '#4A5568');

  // 处理双击事件，显示编辑框
  const handleDoubleClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    setIsEditing(true);
  };

  // 处理编辑框失去焦点事件，保存标签
  const handleBlur = () => {
    setIsEditing(false);
    // 如果标签为空或只有空格，则不保存
    const trimmedLabel = label.trim();
    if (trimmedLabel === '') {
      setLabel('');
    }

    // 更新边的数据
    setEdges((edges) =>
      edges.map((edge) => {
        if (edge.id === id) {
          return {
            ...edge,
            data: {
              ...edge.data,
              label: trimmedLabel === '' ? undefined : trimmedLabel,
            },
          };
        }
        return edge;
      })
    );
  };

  // 处理输入框变化
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setLabel(event.target.value);
  };

  // 处理键盘事件，按Enter保存，按Esc取消
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      handleBlur();
    } else if (event.key === 'Escape') {
      setIsEditing(false);
      setLabel(data?.label || '');
    }
  };

  // 当进入编辑模式时，自动聚焦输入框
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  // 当data.label变化时更新本地状态
  useEffect(() => {
    setLabel(data?.label || '');
  }, [data?.label]);

  return (
    <>
      {/* 扩大点击区域的透明路径 */}
      <path
        id={id}
        className="react-flow__edge-path-selector"
        d={edgePath}
        strokeWidth={20}
        stroke="transparent"
        fill="none"
        onDoubleClick={handleDoubleClick}
      />
      {/* 实际可见的边 */}
      <path
        id={id}
        className="react-flow__edge-path"
        d={edgePath}
        markerEnd={markerEnd}
        style={style}
        onDoubleClick={handleDoubleClick}
      />
      {/* 标签或编辑框 */}
      {(isEditing || (data?.label && data.label.trim() !== '')) && (
        <foreignObject
          width={isEditing ? 120 : Math.max(data?.label?.length * 8 || 0, 30)}
          height={isEditing ? 40 : 30}
          x={labelX - (isEditing ? 60 : Math.max(data?.label?.length * 4 || 0, 15))}
          y={labelY - (isEditing ? 20 : 15)}
          requiredExtensions="http://www.w3.org/1999/xhtml"
          className="edge-label-container"
        >
          {isEditing ? (
            <div
              style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                padding: '2px',
              }}
            >
              <input
                ref={inputRef}
                value={label}
                onChange={handleChange}
                onBlur={handleBlur}
                onKeyDown={handleKeyDown}
                style={{
                  width: '100%',
                  height: '100%',
                  background: bgColor,
                  color: textColor,
                  border: `1px solid ${borderColor}`,
                  borderRadius: '4px',
                  padding: '0 4px',
                  fontSize: '12px',
                  textAlign: 'center',
                }}
              />
            </div>
          ) : (
            data?.label && (
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  background: bgColor,
                  color: textColor,
                  border: `1px solid ${borderColor}`,
                  borderRadius: '4px',
                  padding: '0 4px',
                  fontSize: '12px',
                  textAlign: 'center',
                }}
                onDoubleClick={handleDoubleClick}
              >
                {data.label}
              </div>
            )
          )}
        </foreignObject>
      )}
    </>
  );
};

export default CustomEdge;