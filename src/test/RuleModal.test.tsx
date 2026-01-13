import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { RuleModal } from '../finance/components/RuleModal';
import { TextCategoryRule, Category, SubCategory, TransactionType } from '../finance/financeTypes';

describe('RuleModal', () => {
    const mockOnClose = vi.fn();
    const mockOnSave = vi.fn();
    const mockSetEditingRule = vi.fn();

    const mockCategories: Category[] = [
        { id: 'cat-1', name: 'Ventas', type: TransactionType.IN },
        { id: 'cat-2', name: 'Gastos Fijos', type: TransactionType.OUT }
    ];

    const mockSubCategories: SubCategory[] = [
        { id: 'sub-1', name: 'Servicios', categoryId: 'cat-2' },
        { id: 'sub-2', name: 'Alquiler', categoryId: 'cat-2' }
    ];

    const defaultProps = {
        isOpen: true,
        onClose: mockOnClose,
        editingRule: { pattern: '', categoryId: '' } as Partial<TextCategoryRule>,
        setEditingRule: mockSetEditingRule,
        categories: mockCategories,
        subCategories: mockSubCategories,
        onSave: mockOnSave
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should not render when isOpen is false', () => {
        render(<RuleModal {...defaultProps} isOpen={false} />);
        expect(screen.queryByText('Nueva Regla Inteligente')).not.toBeInTheDocument();
    });

    it('should render modal when isOpen is true', () => {
        render(<RuleModal {...defaultProps} />);
        expect(screen.getByText('Nueva Regla Inteligente')).toBeInTheDocument();
    });

    it('should call onClose when X button is clicked', () => {
        render(<RuleModal {...defaultProps} />);
        const closeButton = screen.getByTitle('Cerrar (Esc)');
        fireEvent.click(closeButton);
        expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should have pattern input with correct placeholder', () => {
        render(<RuleModal {...defaultProps} />);
        expect(screen.getByPlaceholderText('Ej: Carcor, Netflix, Sueldo')).toBeInTheDocument();
    });

    it('should update pattern on input change', () => {
        render(<RuleModal {...defaultProps} />);
        const input = screen.getByPlaceholderText('Ej: Carcor, Netflix, Sueldo');
        fireEvent.change(input, { target: { value: 'Netflix' } });
        expect(mockSetEditingRule).toHaveBeenCalled();
    });

    it('should show categories in dropdown', () => {
        render(<RuleModal {...defaultProps} />);
        expect(screen.getByText('Ventas')).toBeInTheDocument();
        expect(screen.getByText('Gastos Fijos')).toBeInTheDocument();
    });

    it('should have disabled subcategory dropdown when no category selected', () => {
        render(<RuleModal {...defaultProps} />);
        const subCatSelect = screen.getByText('Sin sub-rubro específico').closest('select');
        expect(subCatSelect).toBeDisabled();
    });

    it('should enable subcategory dropdown when category is selected', () => {
        render(
            <RuleModal
                {...defaultProps}
                editingRule={{ pattern: 'Test', categoryId: 'cat-2' }}
            />
        );
        const subCatSelect = screen.getByText('Sin sub-rubro específico').closest('select');
        expect(subCatSelect).not.toBeDisabled();
    });

    it('should have submit button', () => {
        render(<RuleModal {...defaultProps} />);
        expect(screen.getByText('Crear Regla')).toBeInTheDocument();
    });
});
