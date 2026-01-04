import React from 'react';
import { QuickDiagnosticData } from '../../types';
import Button from '../ui/Button';
import CurrencyInput from '../ui/CurrencyInput';

interface DiagnosticStepFinanceProps {
    formData: QuickDiagnosticData;
    handleCurrencyValueChange: (name: string, value: number) => void;
    prevStep: () => void;
    nextStep: () => void;
}

const DiagnosticStepFinance: React.FC<DiagnosticStepFinanceProps> = ({ formData, handleCurrencyValueChange, prevStep, nextStep }) => {
    return (
        <div className="space-y-6 animate-fade-in">
            <div>
                <h2 className="text-2xl font-bold text-white mb-2 font-space">Números del último mes</h2>
                <p className="text-slate-400">Usá números aproximados. El sistema necesita datos reales para analizar tu rentabilidad.</p>
            </div>

            <div className="space-y-4">
                <CurrencyInput
                    label="Facturación Total (Ventas)"
                    prefix="$"
                    name="monthlyRevenue"
                    value={formData.monthlyRevenue}
                    onValueChange={handleCurrencyValueChange}
                    className="border-[#1FB6D5]/50 focus:border-[#1FB6D5] bg-[#00344F]/60 font-mono text-lg font-bold text-white"
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <CurrencyInput label="Compras Mercadería (Costo)" prefix="$" name="cogs" value={formData.cogs} onValueChange={handleCurrencyValueChange} className="font-mono" />
                    <CurrencyInput label="Sueldos + Cargas Sociales" prefix="$" name="laborCost" value={formData.laborCost} onValueChange={handleCurrencyValueChange} className="font-mono" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <CurrencyInput label="Alquiler" prefix="$" name="rent" value={formData.rent} onValueChange={handleCurrencyValueChange} className="font-mono" />
                    <CurrencyInput label="Servicios y otros fijos" prefix="$" name="utilitiesAndFixed" value={formData.utilitiesAndFixed} onValueChange={handleCurrencyValueChange} className="font-mono" />
                </div>
            </div>

            <div className="flex gap-4 pt-4">
                <Button variant="secondary" onClick={prevStep}>Atrás</Button>
                <Button onClick={nextStep} fullWidth disabled={!formData.monthlyRevenue}>Siguiente</Button>
            </div>
        </div>
    );
};

export default DiagnosticStepFinance;
