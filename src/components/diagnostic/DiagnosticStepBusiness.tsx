import React from 'react';
import { QuickDiagnosticData, BusinessType } from '../../types';
import Button from '../ui/Button';
import Input from '../ui/Input';

interface DiagnosticStepBusinessProps {
    formData: QuickDiagnosticData;
    handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
    handleNumberChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    nextStep: () => void;
}

const DiagnosticStepBusiness: React.FC<DiagnosticStepBusinessProps> = ({ formData, handleChange, handleNumberChange, nextStep }) => {
    return (
        <div className="space-y-6 animate-fade-in">
            <div>
                <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2 font-space">Datos del Negocio</h2>
                <p className="text-[var(--text-muted)]">Empecemos por entender el contexto de tu operación.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Tipo de Negocio</label>
                    <select
                        name="businessType"
                        value={formData.businessType}
                        onChange={handleChange}
                        className="bg-[#0F1416]/40 border border-[var(--border-strong)] text-[var(--text-primary)] text-sm rounded-md block w-full p-2.5 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)]"
                    >
                        {Object.values(BusinessType).map(t => <option key={t} value={t} className="text-gray-900 bg-white">{t}</option>)}
                    </select>
                </div>
                <Input label="Ciudad / País" name="city" value={formData.city || ''} onChange={handleChange} placeholder="Ej: Córdoba, Argentina" />
                <Input label="Tickets promedio por día (Aprox)" type="number" name="dailyCovers" value={formData.dailyCovers || ''} onChange={handleNumberChange} placeholder="Ej: 80" />
                <Input label="Días apertura por semana" type="number" name="openDays" value={formData.openDays || ''} onChange={handleNumberChange} min={1} max={7} placeholder="1-7" />
            </div>

            <div className="pt-4">
                <Button onClick={nextStep} fullWidth size="lg">Siguiente: Tus Números</Button>
            </div>
        </div>
    );
};

export default DiagnosticStepBusiness;
