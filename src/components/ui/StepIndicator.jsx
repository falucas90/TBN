import React from 'react';

export default function StepIndicator({ currentStep, steps }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%' }}>
      {steps.map((step, idx) => {
        const stepNum = idx + 1;
        const isActive = stepNum === currentStep;
        const isCompleted = stepNum < currentStep;
        
        return (
          <React.Fragment key={step}>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: '24px', height: '24px', borderRadius: '50%',
              fontSize: '0.75rem', fontWeight: '600',
              backgroundColor: isActive || isCompleted ? 'var(--color-primary-teal)' : 'var(--color-bg-page)',
              color: isActive || isCompleted ? '#fff' : 'var(--color-text-secondary)',
              border: isActive || isCompleted ? 'none' : '1px solid var(--color-border)',
              flexShrink: 0
            }}>
              {stepNum}
            </div>
            {idx < steps.length - 1 && (
              <div style={{
                flex: 1, height: '2px',
                backgroundColor: isCompleted ? 'var(--color-primary-teal)' : 'var(--color-border)',
                minWidth: '24px'
              }} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}
