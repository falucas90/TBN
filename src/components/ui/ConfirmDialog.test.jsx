import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ConfirmDialog from './ConfirmDialog';

function renderDialog(props = {}) {
  const onConfirm = vi.fn();
  const onCancel = vi.fn();
  const utils = render(
    <ConfirmDialog
      open
      title="Eliminar pesquisa"
      description="Esta ação não pode ser revertida."
      onConfirm={onConfirm}
      onCancel={onCancel}
      {...props}
    />
  );
  return { onConfirm, onCancel, ...utils };
}

describe('ConfirmDialog', () => {
  it('renders nothing when open=false', () => {
    renderDialog({ open: false });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders an aria-modal dialog labelled by the title', () => {
    renderDialog();
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(screen.getByRole('dialog', { name: 'Eliminar pesquisa' })).toBe(dialog);
    expect(screen.getByText('Esta ação não pode ser revertida.')).toBeInTheDocument();
  });

  it('calls onCancel when Escape is pressed', async () => {
    const user = userEvent.setup();
    const { onCancel } = renderDialog();
    await user.keyboard('{Escape}');
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('calls onCancel when the overlay is clicked', async () => {
    const user = userEvent.setup();
    const { onCancel, container } = renderDialog();
    await user.click(container.firstChild);
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('does not call onCancel when clicking inside the panel', async () => {
    const user = userEvent.setup();
    const { onCancel } = renderDialog();
    await user.click(screen.getByRole('dialog'));
    await user.click(screen.getByText('Eliminar pesquisa'));
    expect(onCancel).not.toHaveBeenCalled();
  });

  it('calls onCancel when the cancel button is clicked', async () => {
    const user = userEvent.setup();
    const { onCancel, onConfirm } = renderDialog();
    await user.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('fires onConfirm on click when no confirmText is required', async () => {
    const user = userEvent.setup();
    const { onConfirm } = renderDialog();
    const confirmBtn = screen.getByRole('button', { name: 'Confirmar' });
    expect(confirmBtn).toBeEnabled();
    await user.click(confirmBtn);
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('renders custom confirm/cancel labels', () => {
    renderDialog({ confirmLabel: 'Apagar', cancelLabel: 'Voltar' });
    expect(screen.getByRole('button', { name: 'Apagar' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Voltar' })).toBeInTheDocument();
  });

  describe('with confirmText="ELIMINAR"', () => {
    it('disables confirm until the exact text is typed (case-sensitive)', async () => {
      const user = userEvent.setup();
      const { onConfirm } = renderDialog({ confirmText: 'ELIMINAR' });
      const confirmBtn = screen.getByRole('button', { name: 'Confirmar' });
      const input = screen.getByRole('textbox');

      expect(confirmBtn).toBeDisabled();
      await user.click(confirmBtn);
      expect(onConfirm).not.toHaveBeenCalled();

      await user.type(input, 'eliminar');
      expect(confirmBtn).toBeDisabled();

      await user.clear(input);
      await user.type(input, 'ELIMINAR');
      expect(confirmBtn).toBeEnabled();

      await user.click(confirmBtn);
      expect(onConfirm).toHaveBeenCalledTimes(1);
    });

    it('disables confirm again when extra characters are added', async () => {
      const user = userEvent.setup();
      renderDialog({ confirmText: 'ELIMINAR' });
      const input = screen.getByRole('textbox');
      await user.type(input, 'ELIMINARX');
      expect(screen.getByRole('button', { name: 'Confirmar' })).toBeDisabled();
    });
  });
});
