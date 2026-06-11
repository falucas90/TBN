import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// globals:false disables RTL's automatic cleanup (it hooks into a global
// afterEach), so register it explicitly.
afterEach(cleanup);
