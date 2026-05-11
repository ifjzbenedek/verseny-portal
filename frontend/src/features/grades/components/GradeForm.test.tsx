import { describe, it, expect } from 'vitest';
import { fireEvent, screen, waitFor } from '@testing-library/react';

import { GradeForm } from './GradeForm';
import { renderWithProviders } from '@/test/testUtils';

describe('GradeForm', () => {
  it('renders Zod-validated fields with defaults', () => {
    renderWithProviders(<GradeForm assignmentId={1} studentId={2} />);
    const value = screen.getByLabelText(/Érték/i) as HTMLInputElement;
    const weight = screen.getByLabelText(/Súly/i) as HTMLInputElement;
    expect(value.value).toBe('5');
    expect(weight.value).toBe('1');
  });

  it('blocks submit and surfaces validation error when value is out of range', async () => {
    renderWithProviders(<GradeForm assignmentId={1} studentId={2} />);

    const value = screen.getByLabelText(/Érték/i) as HTMLInputElement;
    fireEvent.change(value, { target: { value: '9' } });
    expect(value.value).toBe('9');

    const form = value.closest('form');
    expect(form).not.toBeNull();
    fireEvent.submit(form!);

    await waitFor(() => {
      expect(screen.getByText(/Az érték 1 és 5 között legyen/i)).toBeInTheDocument();
    });
  });
});
