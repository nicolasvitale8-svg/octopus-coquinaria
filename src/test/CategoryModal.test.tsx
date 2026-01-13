import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CategoryModal } from '../finance/components/CategoryModal';
import { Category, TransactionType } from '../finance/financeTypes';

describe('CategoryModal', () => {
    const mockOnClose = vi.fn();
    const mockOnSave = vi.fn();
    const mockSetEditingCategory = vi.fn();

    const defaultProps = {
        isOpen: true,
        onClose: mockOnClose,
        editingCategory: { name: '', type: TransactionType.IN } as Partial<Category>,
        setEditingCategory: mockSetEditingCategory,
        onSave: mockOnSave
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should not render when isOpen is false', () => {
        render(<CategoryModal {...defaultProps} isOpen={false} />);
        expect(screen.queryByText('Nuevo Rubro')).not.toBeInTheDocument();
    });

    it('should render modal when isOpen is true', () => {
        render(<CategoryModal {...defaultProps} />);
        expect(screen.getByText('Nuevo Rubro')).toBeInTheDocument();
    });

    it('should show "Editar Rubro" when editing existing category', () => {
        render(
            <CategoryModal
                {...defaultProps}
                editingCategory={{ id: '123', name: 'Test', type: TransactionType.OUT }}
            />
        );
        expect(screen.getByText('Editar Rubro')).toBeInTheDocument();
    });

    it('should call onClose when X button is clicked', () => {
        render(<CategoryModal {...defaultProps} />);
        const closeButton = screen.getByTitle('Cerrar (Esc)');
        fireEvent.click(closeButton);
        expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should update category name on input change', () => {
        render(<CategoryModal {...defaultProps} />);
        const input = screen.getByPlaceholderText('Ej: Servicios Públicos');
        fireEvent.change(input, { target: { value: 'Nueva Categoría' } });
        expect(mockSetEditingCategory).toHaveBeenCalled();
    });

    it('should have type selector with correct options', () => {
        render(<CategoryModal {...defaultProps} />);
        expect(screen.getByText('Ingresos')).toBeInTheDocument();
        expect(screen.getByText('Gastos')).toBeInTheDocument();
        expect(screen.getByText('Mixto (Ambos)')).toBeInTheDocument();
    });

    it('should call onSave when form is submitted', () => {
        render(
            <CategoryModal
                {...defaultProps}
                editingCategory={{ name: 'Test Category', type: TransactionType.IN }}
            />
        );
        const form = document.querySelector('form');
        if (form) {
            fireEvent.submit(form);
            expect(mockOnSave).toHaveBeenCalledTimes(1);
        }
    });
});
