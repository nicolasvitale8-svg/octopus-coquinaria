import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ConciliateModal } from '../finance/components/ConciliateModal';
import { Account } from '../finance/financeTypes';

describe('ConciliateModal', () => {
    const mockOnClose = vi.fn();
    const mockOnConciliate = vi.fn();
    const mockSetRealBalance = vi.fn();
    const mockFormatArgNumber = vi.fn((val: number) => val.toLocaleString('es-AR'));
    const mockParseArgNumber = vi.fn((val: string) => parseFloat(val.replace(',', '.')));

    const mockAccount: Account = {
        id: 'acc-123',
        name: 'Banco Test',
        accountTypeId: 'type-1',
        currency: 'ARS',
        isActive: true
    };

    const defaultProps = {
        isOpen: true,
        onClose: mockOnClose,
        account: mockAccount,
        realBalance: '',
        setRealBalance: mockSetRealBalance,
        onConciliate: mockOnConciliate,
        formatArgNumber: mockFormatArgNumber,
        parseArgNumber: mockParseArgNumber
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should not render when isOpen is false', () => {
        render(<ConciliateModal {...defaultProps} isOpen={false} />);
        expect(screen.queryByText('Conciliar Cuenta')).not.toBeInTheDocument();
    });

    it('should not render when account is null', () => {
        render(<ConciliateModal {...defaultProps} account={null} />);
        expect(screen.queryByText('Conciliar Cuenta')).not.toBeInTheDocument();
    });

    it('should render modal with account name', () => {
        render(<ConciliateModal {...defaultProps} />);
        expect(screen.getByText('Conciliar Cuenta')).toBeInTheDocument();
        expect(screen.getByText('Banco Test')).toBeInTheDocument();
    });

    it('should call onClose when X button is clicked', () => {
        render(<ConciliateModal {...defaultProps} />);
        // Find the close button (the one with X icon)
        const closeButtons = screen.getAllByRole('button');
        const closeButton = closeButtons.find(btn => btn.className.includes('top-6'));
        if (closeButton) {
            fireEvent.click(closeButton);
            expect(mockOnClose).toHaveBeenCalledTimes(1);
        }
    });

    it('should update balance on input change', () => {
        render(<ConciliateModal {...defaultProps} />);
        const input = screen.getByPlaceholderText('0,00');
        fireEvent.change(input, { target: { value: '1000,50' } });
        expect(mockSetRealBalance).toHaveBeenCalledWith('1000,50');
    });

    it('should have disabled submit button when realBalance is empty', () => {
        render(<ConciliateModal {...defaultProps} realBalance="" />);
        const submitButton = screen.getByText('Ajustar y Conciliar');
        expect(submitButton).toBeDisabled();
    });

    it('should enable submit button when realBalance has value', () => {
        render(<ConciliateModal {...defaultProps} realBalance="5000,00" />);
        const submitButton = screen.getByText('Ajustar y Conciliar');
        expect(submitButton).not.toBeDisabled();
    });

    it('should call onConciliate when submit button is clicked', () => {
        render(<ConciliateModal {...defaultProps} realBalance="5000,00" />);
        const submitButton = screen.getByText('Ajustar y Conciliar');
        fireEvent.click(submitButton);
        expect(mockOnConciliate).toHaveBeenCalledTimes(1);
    });

    it('should show instructions text', () => {
        render(<ConciliateModal {...defaultProps} />);
        expect(screen.getByText(/Ingresa el saldo real/)).toBeInTheDocument();
    });
});
