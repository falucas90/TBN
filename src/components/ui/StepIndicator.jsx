import React from 'react';
import { Check } from 'lucide-react';

export default function StepIndicator({ currentStep, steps }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0', width: '100%' }}>
      {steps.map((step, idx) => {
        const stepNum = idx + 1;
        const isActive = stepNum === currentStep;
        const isCompleted = stepNum < currentStep;

        return (
          <React.Fragment key={step}>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: '26px', height: '26px', borderRadius: '50%',
              fontSize: '0.75rem', fontWeight: '700', flexShrink: 0,
              background: isCompleted ? 'var(--accent)' : isActive ? 'var(--accent-dim)' : 'var(--surface-3)',
              color: isCompleted ? '#0a1a0f' : isActive ? 'var(--accent)' : 'var(--text-muted)',
              border: isActive ? '2px solid var(--accent)' : '2px solid transparent',
              transition: 'all var(--t-base)',
            }}>
              {isCompleted ? <Check size={13} strokeWidth={3} /> : stepNum}
            </div>
            {idx < steps.length - 1 && (
              <div style={{
                flex: 1, height: '2px', minWidth: '24px',
                background: isCompleted ? 'var(--accent)' : 'var(--border-subtle)',
                transition: 'background var(--t-slow)',
              }} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}
