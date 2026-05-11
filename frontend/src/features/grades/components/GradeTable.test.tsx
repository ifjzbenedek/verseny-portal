import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { axe } from 'jest-axe';

import { GradeTable } from './GradeTable';
import { renderWithProviders } from '@/test/testUtils';
import type { GradeResponse } from '../schemas';

const grades: GradeResponse[] = [
  {
    id: 1,
    studentId: 10,
    assignmentId: 100,
    subjectName: 'Matematika',
    value: 5,
    type: 'NORMAL',
    weight: 1,
    comment: 'Szép munka',
    recordedAt: '2026-02-01T10:00:00Z',
  },
  {
    id: 2,
    studentId: 10,
    assignmentId: 100,
    subjectName: 'Matematika',
    value: 1,
    type: 'MIDTERM',
    weight: 2,
    comment: '',
    recordedAt: '2026-02-15T10:00:00Z',
  },
];

describe('GradeTable', () => {
  it('renders one row per grade with value, type, weight', () => {
    renderWithProviders(<GradeTable grades={grades} showSubject />);
    expect(screen.getAllByText('Matematika')).toHaveLength(2);
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('1.0')).toBeInTheDocument();
    expect(screen.getByText('2.0')).toBeInTheDocument();
  });

  it('hides subject column when showSubject is false', () => {
    renderWithProviders(<GradeTable grades={grades} showSubject={false} />);
    expect(screen.queryByText('Matematika')).not.toBeInTheDocument();
  });

  it('has no accessibility violations', async () => {
    const { container } = renderWithProviders(<GradeTable grades={grades} showSubject />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
