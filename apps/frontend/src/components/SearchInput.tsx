import { Search, X } from 'lucide-react'

import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

interface SearchInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export function SearchInput({
  value,
  onChange,
  placeholder = 'Search markets...',
}: SearchInputProps) {
  return (
    <div className="relative group">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-accent" />

      <Input
        type="search"
        value={value}
        placeholder={placeholder}
        autoComplete="off"
        aria-label="Search"
        onChange={(e) => onChange(e.target.value)}
        className="
          pl-10
          pr-10
          shadow-sm
          transition-all
          duration-200
          focus-visible:shadow-md
        "
      />

      {value && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => onChange('')}
          className="
            absolute
            right-1
            top-1/2
            h-7
            w-7
            -translate-y-1/2
          "
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      )}
    </div>
  )
}