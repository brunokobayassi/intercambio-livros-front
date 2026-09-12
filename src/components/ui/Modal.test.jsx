import { useRef, useState } from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { Modal } from './Modal.jsx'

function ControlledModal() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        Abrir detalhes
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title="Detalhes do livro">
        <button type="button">Ação interna</button>
      </Modal>
    </>
  )
}

describe('Modal', () => {
  it('associa o título e expõe a semântica de diálogo modal', () => {
    render(
      <Modal open onClose={() => {}} title="Editar livro" titleId="edit-title">
        <p>Conteúdo</p>
      </Modal>,
    )

    const dialog = screen.getByRole('dialog', { name: 'Editar livro' })
    expect(dialog).toHaveAttribute('aria-modal', 'true')
    expect(dialog).toHaveAttribute('aria-labelledby', 'edit-title')
    expect(screen.getByRole('heading', { name: 'Editar livro' })).toHaveAttribute(
      'id',
      'edit-title',
    )
  })

  it('prioriza initialFocusRef e prende Tab e Shift+Tab', async () => {
    const user = userEvent.setup()

    function FocusExample() {
      const preferredRef = useRef(null)
      return (
        <Modal
          open
          onClose={() => {}}
          title="Confirmar ação"
          initialFocusRef={preferredRef}
        >
          <button type="button">Primeira ação</button>
          <button ref={preferredRef} type="button">
            Cancelar
          </button>
          <button type="button">Confirmar</button>
        </Modal>
      )
    }

    render(<FocusExample />)

    const closeButton = screen.getByRole('button', { name: 'Fechar' })
    const cancelButton = screen.getByRole('button', { name: 'Cancelar' })
    const confirmButton = screen.getByRole('button', { name: 'Confirmar' })
    expect(cancelButton).toHaveFocus()

    confirmButton.focus()
    await user.tab()
    expect(closeButton).toHaveFocus()

    await user.tab({ shift: true })
    expect(confirmButton).toHaveFocus()
  })

  it('usa o elemento autoFocus antes do primeiro controle do diálogo', () => {
    render(
      <Modal open onClose={() => {}} title="Novo livro">
        <input aria-label="Título" autoFocus />
        <button type="button">Salvar</button>
      </Modal>,
    )

    expect(screen.getByRole('textbox', { name: 'Título' })).toHaveFocus()
  })

  it('fecha com Escape e restaura o foco ao elemento que abriu', async () => {
    const user = userEvent.setup()
    render(<ControlledModal />)
    const opener = screen.getByRole('button', { name: 'Abrir detalhes' })

    await user.click(opener)
    expect(screen.getByRole('dialog', { name: 'Detalhes do livro' })).toBeVisible()

    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(opener).toHaveFocus()
  })

  it('fecha ao clicar no backdrop, mas não ao clicar no conteúdo', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    render(
      <Modal open onClose={onClose} title="Detalhes">
        <p>Conteúdo seguro</p>
      </Modal>,
    )

    await user.click(screen.getByText('Conteúdo seguro'))
    expect(onClose).not.toHaveBeenCalled()

    fireEvent.click(document.querySelector('.modal-backdrop'))
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('foca o próprio diálogo quando não há controles focáveis', () => {
    render(
      <Modal
        open
        onClose={() => {}}
        title="Aviso"
        showCloseButton={false}
      >
        <p>Somente leitura</p>
      </Modal>,
    )

    expect(screen.getByRole('dialog', { name: 'Aviso' })).toHaveFocus()
  })
})
