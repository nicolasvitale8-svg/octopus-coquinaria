import React from 'react';
import { QuickDiagnosticData } from '../../types';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { User, Lock, ArrowRight } from 'lucide-react';

interface DiagnosticStepLeadProps {
    formData: QuickDiagnosticData;
    handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
    prevStep: () => void;
    nextStep: () => void;
    isSaving: boolean;
    phoneError: string;
}

const DiagnosticStepLead: React.FC<DiagnosticStepLeadProps> = ({ formData, handleChange, prevStep, nextStep, isSaving, phoneError }) => {

    // Derived validation for button
    const isContactValid = formData.contactName && formData.contactEmail && formData.businessName && formData.contactPhone.length >= 8 && !phoneError;

    return (
        <div className="space-y-6 animate-fade-in max-w-lg mx-auto py-4">
            <div className="text-center mb-8">
                <div className="w-16 h-16 bg-[#00344F] rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg border-2 border-[#1FB6D5] shadow-[#1FB6D5]/20">
                    <User className="w-8 h-8 text-[#1FB6D5]" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2 font-space">¡Casi listo!</h2>
                <p className="text-slate-400">
                    Completá tus datos para generar el reporte personalizado.
                </p>
            </div>

            <div className="space-y-4 bg-slate-900/80 p-6 rounded-xl border border-slate-700 backdrop-blur-sm">
                <Input
                    label="Nombre y Apellido"
                    name="contactName"
                    value={formData.contactName}
                    onChange={handleChange}
                    placeholder="Tu nombre"
                    required
                />
                <Input
                    label="Nombre del Negocio"
                    name="businessName"
                    value={formData.businessName}
                    onChange={handleChange}
                    placeholder="Ej: Burger King"
                    required
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                        label="Email"
                        type="email"
                        name="contactEmail"
                        value={formData.contactEmail}
                        onChange={handleChange}
                        placeholder="nombre@ejemplo.com"
                        required
                    />
                    <div>
                        <Input
                            label="WhatsApp"
                            type="tel"
                            name="contactPhone"
                            value={formData.contactPhone}
                            onChange={handleChange}
                            placeholder="+54 9 11..."
                            required
                        />
                        {phoneError && <p className="text-red-400 text-xs mt-1">{phoneError}</p>}
                    </div>
                </div>

                <div className="pt-4 border-t border-slate-800">
                    <p className="text-xs font-bold text-[#1FB6D5] uppercase tracking-widest mb-3">Opcional: Crea tu cuenta ahora</p>
                    <Input
                        label="Contraseña"
                        type="password"
                        name="password"
                        value={(formData as any).password || ''}
                        onChange={handleChange}
                        placeholder="Mínimo 6 caracteres"
                        helperText="Si ponés una contraseña, crearemos tu cuenta para que puedas entrar al Dashboard al instante."
                    />
                </div>
            </div>

            <div className="flex items-center gap-2 justify-center text-xs text-slate-500 mt-4">
                <Lock className="w-3 h-3" />
                Tus datos están protegidos y cifrados.
            </div>

            <div className="flex gap-4 pt-6">
                <Button variant="secondary" onClick={prevStep}>Atrás</Button>
                <Button
                    onClick={nextStep}
                    fullWidth
                    size="lg"
                    disabled={!isContactValid || isSaving}
                    className="shadow-xl bg-[#1FB6D5] text-[#021019] hover:bg-white hover:text-[#021019]"
                >
                    {isSaving ? "Guardando..." : "Ver mi Diagnóstico Final"}
                    {!isSaving && <ArrowRight className="w-4 h-4 ml-2" />}
                </Button>
            </div>
        </div>
    );
};

export default DiagnosticStepLead;
