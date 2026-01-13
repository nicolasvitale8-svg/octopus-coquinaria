import React, { useState } from 'react';
import Layout from '../components/Layout';
import { BusinessType, QuickDiagnosticData, QuickDiagnosticResult } from '../types';
import { calculateQuickDiagnostic } from '../services/calculations';
import { saveDiagnosticResult } from '../services/storage';
import { supabase } from '../services/supabase';
import { ChevronLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { logger } from '../services/logger';

// Components
import DiagnosticHeader from '../components/diagnostic/DiagnosticHeader';
import DiagnosticStepBusiness from '../components/diagnostic/DiagnosticStepBusiness';
import DiagnosticStepFinance from '../components/diagnostic/DiagnosticStepFinance';
import DiagnosticStepConcerns from '../components/diagnostic/DiagnosticStepConcerns';
import DiagnosticStep7P from '../components/diagnostic/DiagnosticStep7P';
import DiagnosticStepLead from '../components/diagnostic/DiagnosticStepLead';
import DiagnosticResults from '../components/diagnostic/DiagnosticResults';

const STEPS = ['Negocio', 'Números', 'Problemas', 'Check 7P', 'Tus Datos', 'Resultado'];

const QuickDiagnostic = () => {
  const [step, setStep] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [phoneError, setPhoneError] = useState('');

  const [formData, setFormData] = useState<QuickDiagnosticData & { password?: string }>({
    businessType: BusinessType.RESTAURANT,
    city: '',
    dailyCovers: 0,
    openDays: 6,
    contactName: '',
    contactEmail: '',
    contactPhone: '',
    businessName: '',
    monthlyRevenue: 0,
    cogs: 0,
    laborCost: 0,
    rent: 0,
    utilitiesAndFixed: 0,
    primaryConcern: [],
    methodologyScores: {},
    password: ''
  });

  const [result, setResult] = useState<QuickDiagnosticResult | null>(null);

  const validatePhone = (phone: string) => {
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 8) {
      return "El número debe tener al menos 8 dígitos";
    }
    return "";
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    if (name === 'contactPhone') {
      setPhoneError(validatePhone(value));
    }

    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: Number(value) }));
  };

  const handleCurrencyValueChange = (name: string, value: number) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleConcernChange = (value: string) => {
    setFormData(prev => {
      const current = prev.primaryConcern;
      if (current.includes(value)) {
        return { ...prev, primaryConcern: current.filter(item => item !== value) };
      } else {
        return { ...prev, primaryConcern: [...current, value] };
      }
    });
  };

  const handleScoreChange = (key: string, score: number) => {
    setFormData(prev => ({
      ...prev,
      methodologyScores: { ...prev.methodologyScores, [key]: score }
    }));
  };

  const nextStep = async () => {
    if (step === 4) {
      setIsSaving(true);
      const res = calculateQuickDiagnostic(formData);
      const finalResult = {
        ...res,
        leadData: {
          name: formData.contactName,
          email: formData.contactEmail,
          phone: formData.contactPhone,
          business: formData.businessName
        }
      };

      setResult(finalResult);

      // Save to Supabase
      if (supabase) {
        try {
          // 1. Check if user wants to create account
          if (formData.password && formData.password.length >= 6) {
            logger.debug('Intentando crear cuenta para el lead', { context: 'QuickDiagnostic' });
            const { data: authData, error: authError } = await supabase.auth.signUp({
              email: formData.contactEmail,
              password: formData.password,
              options: {
                data: {
                  full_name: formData.contactName,
                  business_name: formData.businessName
                }
              }
            });

            if (authError) {
              logger.error('Error en registro Auth', { context: 'QuickDiagnostic', data: authError.message });
            } else if (authData.user) {
              logger.success('Usuario auth creado', { context: 'QuickDiagnostic', data: authData.user.id });
              // Crear perfil en tabla usuarios (trigger habitual, pero lo aseguramos)
              await supabase.from('usuarios').upsert({
                id: authData.user.id,
                email: formData.contactEmail,
                full_name: formData.contactName,
                business_name: formData.businessName,
                role: 'user', // Rol por defecto para leads que se registran
                permissions: ['view_dashboard', 'view_finance_basic']
              });
            }
          }

          // 2. Save Express Diagnostic
          const diagPayload = {
            contact_name: formData.contactName,
            contact_email: formData.contactEmail,
            contact_phone: formData.contactPhone,
            business_name: formData.businessName,
            city: formData.city,
            business_type: formData.businessType,
            monthly_revenue: formData.monthlyRevenue,
            score_global: finalResult.scoreGlobal,
            score_financial: finalResult.scoreFinancial,
            score_7p: finalResult.score7P,
            profile_name: finalResult.profileName,
            status: finalResult.status,
            cogs_percentage: finalResult.cogsPercentage,
            labor_percentage: finalResult.laborPercentage,
            margin_percentage: finalResult.marginPercentage,
            full_data: finalResult,
            source: 'web_quick_diagnostic'
          };

          const { error: diagError } = await supabase.from('diagnosticos_express').insert(diagPayload);

          if (diagError) {
            logger.warn('Fallo insert directo, reintentando con fallback', { context: 'QuickDiagnostic' });
            // Fallback: Si fallan las columnas nuevas, guardar solo lo básico + el JSON completo
            const fallbackPayload = {
              contact_name: formData.contactName,
              contact_email: formData.contactEmail,
              business_name: formData.businessName,
              full_data: finalResult,
              source: 'web_quick_diagnostic_fallback'
            };
            await supabase.from('diagnosticos_express').insert(fallbackPayload);
          }

        } catch (e) {
          logger.error('Error crítico en guardado de Supabase', { context: 'QuickDiagnostic', data: e });
        }
      }

      // Keep local storage as backup/cache
      await saveDiagnosticResult(finalResult);
      setIsSaving(false);
    }
    setStep(prev => prev + 1);
  };

  const prevStep = () => setStep(prev => prev - 1);

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 pt-8 pb-12">
        <div className="mb-8">
          <Link to="/" className="inline-flex items-center text-slate-500 hover:text-cyan-400 transition-colors text-sm font-bold uppercase tracking-widest group">
            <ChevronLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
            Volver al Inicio
          </Link>
        </div>
        <DiagnosticHeader step={step} steps={STEPS} showTitle={!result} />

        <div className="bg-[#0b1b26] border border-slate-700 rounded-2xl p-6 md:p-10 shadow-2xl relative overflow-hidden">
          {step === 0 && (
            <DiagnosticStepBusiness
              formData={formData}
              handleChange={handleChange}
              handleNumberChange={handleNumberChange}
              nextStep={nextStep}
            />
          )}

          {step === 1 && (
            <DiagnosticStepFinance
              formData={formData}
              handleCurrencyValueChange={handleCurrencyValueChange}
              nextStep={nextStep}
              prevStep={prevStep}
            />
          )}

          {step === 2 && (
            <DiagnosticStepConcerns
              formData={formData}
              handleConcernChange={handleConcernChange}
              prevStep={prevStep}
              nextStep={nextStep}
            />
          )}

          {step === 3 && (
            <DiagnosticStep7P
              formData={formData}
              handleScoreChange={handleScoreChange}
              prevStep={prevStep}
              nextStep={nextStep}
            />
          )}

          {step === 4 && (
            <DiagnosticStepLead
              formData={formData}
              handleChange={handleChange}
              prevStep={prevStep}
              nextStep={nextStep}
              isSaving={isSaving}
              phoneError={phoneError}
            />
          )}

          {step === 5 && result && (
            <DiagnosticResults
              result={result}
              formData={formData}
            />
          )}
        </div>
      </div>
    </Layout>
  );
};

export default QuickDiagnostic;
