import { BookOpen, Palette, PenLine } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import { TextField } from '../../components/ui/TextField'
import { BookCover } from './BookCover'
import { BOOK_LIMITS, sanitizeBookPayload, validateBook } from './book-validation'
import { useState } from 'react'

export function BookFormModal({ open, onClose, book = null, onSubmit, isSubmitting, requestError }) {
  const [values, setValues] = useState({
    titulo: book?.titulo ?? '',
    autor: book?.autor ?? '',
  })
  const [errors, setErrors] = useState({})
  const isEditing = Boolean(book)
  const previewBook = { id: book?.id ?? values.titulo, ...values }

  function updateField(event) {
    const { name, value } = event.target
    setValues((current) => ({ ...current, [name]: value }))
    setErrors((current) => ({ ...current, [name]: undefined }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    const nextErrors = validateBook(values)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return
    try {
      await onSubmit(sanitizeBookPayload(values))
    } catch {
      // The parent mutation exposes its user-facing error through requestError.
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      closeDisabled={isSubmitting}
      title={isEditing ? 'Editar livro' : 'Adicionar livro'}
      size="medium"
    >
      <form className="book-form" onSubmit={handleSubmit} noValidate>
        <div className="modal-intro">
          <p className="eyebrow">Formulário de obra</p>
          <p>{isEditing ? 'Atualize os dados deste livro.' : 'Disponibilize uma nova história para trocas.'}</p>
        </div>
        <TextField
          label="Título do livro"
          name="titulo"
          value={values.titulo}
          onChange={updateField}
          maxLength={BOOK_LIMITS.title}
          icon={<BookOpen />}
          error={errors.titulo}
          disabled={isSubmitting}
          required
          autoFocus
        />
        <TextField
          label="Autor"
          name="autor"
          value={values.autor}
          onChange={updateField}
          maxLength={BOOK_LIMITS.author}
          icon={<PenLine />}
          error={errors.autor}
          disabled={isSubmitting}
          required
        />

        <div className="form-note">
          <Palette aria-hidden="true" />
          <p>A miniatura gráfica da capa será criada automaticamente com as cores da comunidade.</p>
        </div>
        <div className="cover-preview">
          <BookCover book={previewBook} size="preview" />
          <span>
            <strong>Pré-visualização da miniatura</strong>
            <small>Gradiente dinâmico baseado no título.</small>
          </span>
        </div>

        {requestError ? <p className="inline-error" role="alert">{requestError}</p> : null}

        <div className="modal-actions">
          <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button type="submit" isLoading={isSubmitting} disabled={isSubmitting}>
            {isSubmitting ? 'Salvando…' : isEditing ? 'Salvar alterações' : 'Salvar livro'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
