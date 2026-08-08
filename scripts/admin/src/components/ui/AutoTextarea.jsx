import { useRef, useLayoutEffect } from 'react'

export default function AutoTextarea({
  id,
  value,
  onChange,
  className = 'field-textarea',
  placeholder,
  style = {},
  ...props
}) {
  const ref = useRef(null)

  const adjustHeight = () => {
    const el = ref.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.max(el.scrollHeight, 40)}px`
  }

  useLayoutEffect(() => {
    adjustHeight()
  }, [value])

  return (
    <textarea
      ref={ref}
      id={id}
      value={value || ''}
      onChange={e => {
        onChange(e)
        adjustHeight()
      }}
      placeholder={placeholder}
      className={className}
      style={{
        ...style,
        overflow: 'hidden',
        resize: 'none',
        boxSizing: 'border-box',
        minHeight: '40px',
        lineHeight: 1.5,
        display: 'block',
        width: '100%',
      }}
      rows={1}
      {...props}
    />
  )
}
