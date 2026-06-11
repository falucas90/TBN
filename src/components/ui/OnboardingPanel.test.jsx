import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom';
import OnboardingPanel from './OnboardingPanel';

// localStorage persistence for dismissal lives in Searches.jsx, not in the
// panel, so the panel is tested purely through its props/callbacks.

function LocationProbe() {
  const location = useLocation();
  return <div data-testid="location">{location.pathname}</div>;
}

function renderPanel(props = {}) {
  return render(
    <MemoryRouter initialEntries={['/searches']}>
      <Routes>
        <Route path="/searches" element={<OnboardingPanel {...props} />} />
        <Route path="*" element={<LocationProbe />} />
      </Routes>
    </MemoryRouter>
  );
}

describe('OnboardingPanel', () => {
  it('renders the welcome heading and the three steps', () => {
    renderPanel();
    expect(screen.getByText('Bem-vindo ao Crivo')).toBeInTheDocument();
    expect(screen.getByText('Crie uma pesquisa')).toBeInTheDocument();
    expect(screen.getByText('Monitorizamos a Europa')).toBeInTheDocument();
    expect(screen.getByText('Receba alertas com margem')).toBeInTheDocument();
    // numbered 01–03
    expect(screen.getByText('01')).toBeInTheDocument();
    expect(screen.getByText('02')).toBeInTheDocument();
    expect(screen.getByText('03')).toBeInTheDocument();
  });

  it('calls onDismiss when the dismiss button is clicked', async () => {
    const user = userEvent.setup();
    const onDismiss = vi.fn();
    renderPanel({ onDismiss });
    await user.click(screen.getByRole('button', { name: 'Dispensar introdução' }));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('navigates to /searches/new from the primary CTA', async () => {
    const user = userEvent.setup();
    renderPanel();
    await user.click(screen.getByRole('button', { name: /Criar primeira pesquisa/ }));
    expect(screen.getByTestId('location')).toHaveTextContent('/searches/new');
  });

  it('hides the sample-search button when onCreateSample is not provided', () => {
    renderPanel();
    expect(screen.queryByRole('button', { name: /pesquisa de exemplo/ })).not.toBeInTheDocument();
  });

  it('calls onCreateSample and shows a pending label while it resolves', async () => {
    const user = userEvent.setup();
    let resolveSample;
    const onCreateSample = vi.fn(() => new Promise((resolve) => { resolveSample = resolve; }));
    renderPanel({ onCreateSample });

    const sampleBtn = screen.getByRole('button', { name: 'Criar pesquisa de exemplo' });
    await user.click(sampleBtn);

    expect(onCreateSample).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('button', { name: 'A criar…' })).toBeDisabled();

    resolveSample();
    expect(await screen.findByRole('button', { name: 'Criar pesquisa de exemplo' })).toBeEnabled();
  });
});
