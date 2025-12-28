import React, { useState } from 'react';
import Layout from '../components/Layout';
import { BusinessType, QuickDiagnosticData, QuickDiagnosticResult } from '../types';
import { calculateQuickDiagnostic } from '../services/calculations';
import { saveDiagnosticResult } from '../services/storage';
import { supabase } from '../services/supabase';

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

  const [formData, setFormData] = useState<QuickDiagnosticData>({
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
    methodologyScores: {}
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
        await supabase.from('diagnosticos_express').insert({
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
          source: 'web_quick_diagnostic'
        });
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
      <div className="max-w-4xl mx-auto px-4 py-12">
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
