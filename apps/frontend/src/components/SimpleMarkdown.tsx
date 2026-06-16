import React from 'react'

interface SimpleMarkdownProps {
  content: string
}

function parseInline(text: string): React.ReactNode[] {
  const parts = text.split(/(\*\*.*?\*\*)/g)

  return parts.map((part, index) => {
    const match = part.match(/^\*\*(.*?)\*\*$/)

    if (match) {
      return (
        <strong
          key={index}
          className="font-semibold text-text"
        >
          {match[1]}
        </strong>
      )
    }

    return <React.Fragment key={index}>{part}</React.Fragment>
  })
}

type Section = {
  title: string
  content: React.ReactNode[]
  colorClass: string
}

function getSectionColor(title: string) {
  const lower = title.toLowerCase()

  if (lower.includes('bull')) {
    return 'border-l-emerald-500'
  }

  if (lower.includes('bear')) {
    return 'border-l-red-500'
  }

  if (
    lower.includes('risk') ||
    lower.includes('concern') ||
    lower.includes('warning')
  ) {
    return 'border-l-amber-500'
  }

  if (
    lower.includes('conclusion') ||
    lower.includes('verdict') ||
    lower.includes('outlook') ||
    lower.includes('summary')
  ) {
    return 'border-l-blue-500'
  }

  return 'border-l-primary'
}

export function SimpleMarkdown({ content }: SimpleMarkdownProps) {
  const sections = React.useMemo(() => {
    const lines = content.split('\n')

    const result: Section[] = []
    let currentSection: Section | null = null

    const pushSection = () => {
      if (currentSection) {
        result.push(currentSection)
      }
    }

    lines.forEach((line, index) => {
      const trimmed = line.trim()

      if (!trimmed) {
        return
      }

      const headerMatch = trimmed.match(/^\*\*(\d+\.\s+.+)\*\*$/)

      if (headerMatch) {
        pushSection()

        currentSection = {
          title: headerMatch[1],
          content: [],
          colorClass: getSectionColor(headerMatch[1]),
        }

        return
      }

      if (!currentSection) {
        currentSection = {
          title: '',
          content: [],
          colorClass: 'border-l-primary',
        }
      }

      const bulletMatch = trimmed.match(/^\*\s+(.+)$/)

      if (bulletMatch) {
        currentSection.content.push(
          <div
            key={`bullet-${index}`}
            className="flex items-start gap-3"
          >
            <span className="mt-[8px] h-1.5 w-1.5 rounded-full bg-text-muted/50 shrink-0" />
            <span>{parseInline(bulletMatch[1])}</span>
          </div>
        )

        return
      }

      currentSection.content.push(
        <p
          key={`paragraph-${index}`}
          className="leading-7"
        >
          {parseInline(trimmed)}
        </p>
      )
    })

    pushSection()

    return result
  }, [content])

  return (
    <div className="space-y-4">
      {sections.map((section, index) => (
        <div
          key={index}
          className={`
            rounded-xl
            border
            border-border/50
            bg-card/30
            p-4
            backdrop-blur-sm
          `}
        >
          {section.title && (
            <div
              className={`
                mb-4
                border-l-4
                pl-3
                font-semibold
                text-sm
                text-text
                ${section.colorClass}
              `}
            >
              {section.title}
            </div>
          )}

          <div className="space-y-3 text-sm text-text-muted">
            {section.content}
          </div>
        </div>
      ))}
    </div>
  )
}