import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import ErrorBoundary from '../components/ErrorBoundary';

// Componente que lanza error para testing
const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
    if (shouldThrow) {
        throw new Error('Test error');
    }
    return <div>Child content</div>;
};

describe('ErrorBoundary', () => {
    beforeEach(() => {
        // Suprimir console.error de React para este test
        vi.spyOn(console, 'error').mockImplementation(() => { });
    });

    it('renders children when there is no error', () => {
        render(
            <ErrorBoundary>
                <ThrowError shouldThrow={false} />
            </ErrorBoundary>
        );

        expect(screen.getByText('Child content')).toBeInTheDocument();
    });

    it('renders error UI when child throws', () => {
        render(
            <ErrorBoundary>
                <ThrowError shouldThrow={true} />
            </ErrorBoundary>
        );

        expect(screen.getByText('Algo salió mal')).toBeInTheDocument();
        expect(screen.getByText('Reintentar')).toBeInTheDocument();
    });

    it('renders custom fallback message', () => {
        render(
            <ErrorBoundary fallbackMessage="Custom error message">
                <ThrowError shouldThrow={true} />
            </ErrorBoundary>
        );

        expect(screen.getByText('Custom error message')).toBeInTheDocument();
    });
});
