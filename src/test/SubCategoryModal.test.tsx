import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SubCategoryModal } from '../finance/components/SubCategoryModal';
import { SubCategory } from '../finance/financeTypes';

describe('SubCategoryModal', () => {
    const mockOnClose = vi.fn();
    const mockOnSave = vi.fn();
    const mockSetEditingSubCategory = vi.fn();

    const defaultProps = {
        isOpen: true,
        onClose: mockOnClose,
        editingSubCategory: { name: '', categoryId: 'cat-123' } as Partial<SubCategory>,
        setEditingSubCategory: mockSetEditingSubCategory,
        onSave: mockOnSave
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should not render when isOpen is false', () => {
        render(<SubCategoryModal {...defaultProps} isOpen={false} />);
        expect(screen.queryByText('Nuevo Sub-Rubro')).not.toBeInTheDocument();
    });

    it('should render modal when isOpen is true', () => {
        render(<SubCategoryModal {...defaultProps} />);
        expect(screen.getByText('Nuevo Sub-Rubro')).toBeInTheDocument();
    });

    it('should call onClose when X button is clicked', () => {
        render(<SubCategoryModal {...defaultProps} />);
        const closeButton = screen.getByTitle('Cerrar (Esc)');
        fireEvent.click(closeButton);
        expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should have input with correct placeholder', () => {
        render(<SubCategoryModal {...defaultProps} />);
        expect(screen.getByPlaceholderText('Ej: Luz Edesur')).toBeInTheDocument();
    });

    it('should update subcategory name on input change', () => {
        render(<SubCategoryModal {...defaultProps} />);
        const input = screen.getByPlaceholderText('Ej: Luz Edesur');
        fireEvent.change(input, { target: { value: 'Nueva Sub' } });
        expect(mockSetEditingSubCategory).toHaveBeenCalled();
    });

    it('should have submit button with correct text', () => {
        render(<SubCategoryModal {...defaultProps} />);
        expect(screen.getByText('Añadir Sub-Rubro')).toBeInTheDocument();
    });
});
