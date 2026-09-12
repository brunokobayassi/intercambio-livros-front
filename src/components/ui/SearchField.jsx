import { forwardRef } from 'react'
import { Search } from 'lucide-react'
import { TextField } from './TextField.jsx'

export const SearchField = forwardRef(function SearchField(
  {
    label = 'Buscar livros',
    onChange,
    placeholder = 'Buscar por título, autor ou proprietário',
    value,
    ...inputProps
  },
  ref,
) {
  return (
    <TextField
      {...inputProps}
      ref={ref}
      type="search"
      role="searchbox"
      label={label}
      icon={<Search size={20} strokeWidth={2} />}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      autoComplete="off"
      containerClassName={[
        'search-field',
        inputProps.containerClassName,
      ].filter(Boolean).join(' ')}
    />
  )
})
