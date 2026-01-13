import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AccountModal } from '../finance/components/AccountModal';
import { Account, AccountType } from '../finance/financeTypes';

describe('AccountModal', () => {
    const mockOnClose = vi.fn();
    const mockOnSave = vi.fn();
    const mockSetEditingAccount = vi.fn();
    const mockFormatArgNumber = vi.fn((val: number) => val.toLocaleString('es-AR'));
    const mockParseArgNumber = vi.fn((val: string) => parseFloat(val.replace(',', '.')));

    const mockAccountTypes: AccountType[] = [
        { id: 'type-1', name: 'Banco', includeInCashflow: true, isActive: true },
        { id: 'type-2', name: 'Billetera Virtual', includeInCashflow: true, isActive: true },
        { id: 'type-3', name: 'Tarjeta de Crédito', includeInCashflow: true, isActive: true }
    ];

    const defaultProps = {
        isOpen: true,
        onClose: mockOnClose,
        editingAccount: { name: '', currency: 'ARS', isActive: true } as Partial<Account>,
        setEditingAccount: mockSetEditingAccount,
        accountTypes: mockAccountTypes,
        onSave: mockOnSave,
        formatArgNumber: mockFormatArgNumber,
        parseArgNumber: mockParseArgNumber
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should not render when isOpen is false', () => {
        render(<AccountModal {...defaultProps} isOpen={false} />);
        expect(screen.queryByText('Nueva Cuenta')).not.toBeInTheDocument();
    });

    it('should render modal when isOpen is true', () => {
        render(<AccountModal {...defaultProps} />);
        expect(screen.getByText('Nueva Cuenta')).toBeInTheDocument();
    });

    it('should show "Editar Cuenta" when editing existing account', () => {
        render(
            <AccountModal
                {...defaultProps}
                editingAccount={{ id: '123', name: 'Test', currency: 'ARS', isActive: true }}
            />
        );
        expect(screen.getByText('Editar Cuenta')).toBeInTheDocument();
    });

    it('should call onClose when X button is clicked', () => {
        render(<AccountModal {...defaultProps} />);
        const closeButton = screen.getByTitle('Cerrar (Esc)');
        fireEvent.click(closeButton);
        expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should have account name input', () => {
        render(<AccountModal {...defaultProps} />);
        expect(screen.getByPlaceholderText('Ej: Brubank Personal')).toBeInTheDocument();
    });

    it('should show account types in dropdown', () => {
        render(<AccountModal {...defaultProps} />);
        expect(screen.getByText('Banco')).toBeInTheDocument();
        expect(screen.getByText('Billetera Virtual')).toBeInTheDocument();
    });

    it('should have currency selector with ARS and USD', () => {
        render(<AccountModal {...defaultProps} />);
        expect(screen.getByText('ARS')).toBeInTheDocument();
        expect(screen.getByText('USD')).toBeInTheDocument();
    });

    it('should update account name on input change', () => {
        render(<AccountModal {...defaultProps} />);
        const input = screen.getByPlaceholderText('Ej: Brubank Personal');
        fireEvent.change(input, { target: { value: 'Mi Cuenta' } });
        expect(mockSetEditingAccount).toHaveBeenCalled();
    });

    it('should have submit button', () => {
        render(<AccountModal {...defaultProps} />);
        expect(screen.getByText('Guardar Cambios')).toBeInTheDocument();
    });

    it('should call onSave when form is submitted', () => {
        render(
            <AccountModal
                {...defaultProps}
                editingAccount={{ name: 'Test', accountTypeId: 'type-1', currency: 'ARS', isActive: true }}
            />
        );
        const form = document.querySelector('form');
        if (form) {
            fireEvent.submit(form);
            expect(mockOnSave).toHaveBeenCalledTimes(1);
        }
    });
});
