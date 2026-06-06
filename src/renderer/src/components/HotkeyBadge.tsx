import React from 'react'

interface HotkeyBadgeProps {
  keys: string[]
  size?: 'sm' | 'md' | 'lg'
}

export function HotkeyBadge({ keys, size = 'md' }: HotkeyBadgeProps) {
  const sizeMap = {
    sm: { padding: '2px 7px', fontSize: 11, gap: 4 },
    md: { padding: '4px 10px', fontSize: 13, gap: 6 },
    lg: { padding: '6px 14px', fontSize: 15, gap: 8 }
  }

  const s = sizeMap[size]

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: s.gap }}>
      {keys.map((key, i) => (
        <React.Fragment key={key}>
          {i > 0 && (
            <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: s.fontSize - 2 }}>+</span>
          )}
          <kbd
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: s.padding,
              fontSize: s.fontSize,
              fontFamily: "'JetBrains Mono', 'Consolas', monospace",
              fontWeight: 500,
              color: '#b8b4ff',
              background: 'rgba(124, 111, 247, 0.12)',
              border: '1px solid rgba(124, 111, 247, 0.3)',
              borderBottom: '2px solid rgba(124, 111, 247, 0.4)',
              borderRadius: 6,
              lineHeight: 1,
              letterSpacing: '0.01em'
            }}
          >
            {key}
          </kbd>
        </React.Fragment>
      ))}
    </div>
  )
}
