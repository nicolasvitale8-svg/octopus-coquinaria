
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import CurrencyInput from '../components/ui/CurrencyInput';
import { BusinessType, QuickDiagnosticData, QuickDiagnosticResult, DiagnosticStatus } from '../types';
import { WHATSAPP_NUMBER } from '../constants';
import { CheckCircle, AlertTriangle, XCircle, Download, Save, MessageCircle, Star, ArrowRight, TrendingUp, Check, User, Lock, Sparkles } from 'lucide-react';
import { calculateQuickDiagnostic, formatPercent } from '../services/calculations';
import { saveDiagnosticResult } from '../services/storage';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const STEPS = ['Negocio', 'Números', 'Problemas', 'Check 7P', 'Tus Datos', 'Resultado'];

const QUESTIONS_7P = [
  { key: 'O', letter: 'Orden', text: 'En tu día a día, ¿qué tan claros y escritos están los procedimientos (apertura, cierre, caja)?', low: 'Nada claros', high: 'Muy claros' },
  { key: 'T', letter: 'Tecnología', text: '¿Registrás tus ventas y gastos en algún sistema o planilla que uses de verdad?', low: 'Casi nada', high: 'Siempre' },
  { key: 'O_obs', letter: 'Observación', text: '¿Con qué frecuencia mirás tus números?', low: 'Casi nunca', high: 'Semanalmente' },
  { key: 'P', letter: 'Pragmatismo', text: '¿Tenés metas numéricas claras (ej: bajar costo de mercadería al 35%)?', low: 'No', high: 'Sí, claras' },
  { key: 'C', letter: 'Creatividad', text: '¿Cada cuánto revisás o renovás tu propuesta (carta, combos, experiencias)?', low: 'Nunca', high: 'Frecuentemente' },
  { key: 'U', letter: 'Universalidad', text: '¿Tu negocio es replicable (podrías abrir otro igual con el mismo modelo)?', low: 'Imposible', high: 'Sí, bastante' },
  { key: 'S', letter: 'Sutileza', text: '¿Cómo manejás reseñas, quejas y pequeños detalles de servicio?', low: 'Ignoramos', high: 'Actuamos rápido' },
];

const QuickDiagnostic = () => {
  const [step, setStep] = useState(0);
  const [isSaving, setIsSaving] = useState(false); // UI Feedback
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
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
      // Async Save to DB
      await saveDiagnosticResult(finalResult); 
      setIsSaving(false);
    }
    setStep(prev => prev + 1);
  };
  
  const prevStep = () => setStep(prev => prev - 1);

  // Updated colors to Brand Palette
  const getStatusColor = (status: DiagnosticStatus) => {
    switch (status) {
      case DiagnosticStatus.RED: return 'text-[#D64747] border-[#D64747] bg-[#D64747]/10';
      case DiagnosticStatus.YELLOW: return 'text-[#F2B350] border-[#F2B350] bg-[#F2B350]/10';
      case DiagnosticStatus.GREEN: return 'text-[#1FA77A] border-[#1FA77A] bg-[#1FA77A]/10';
      default: return 'text-slate-400';
    }
  };

  const getMetricColor = (val: number, type: 'cogs' | 'labor' | 'margin') => {
      if (type === 'cogs') return val <= 35 ? 'text-[#1FA77A]' : (val <= 40 ? 'text-[#F2B350]' : 'text-[#D64747]');
      if (type === 'labor') return val <= 25 ? 'text-[#1FA77A]' : (val <= 30 ? 'text-[#F2B350]' : 'text-[#D64747]');
      if (type === 'margin') return val >= 15 ? 'text-[#1FA77A]' : (val >= 5 ? 'text-[#F2B350]' : 'text-[#D64747]');
      return 'text-slate-200';
  };

  const getWhatsappLink = () => {
    if (!result) return `https://wa.me/${WHATSAPP_NUMBER}`;
    const message = `Hola Octopus 🐙. Soy ${formData.contactName} de ${formData.businessName}.\n\n` +
      `Acabo de hacer el diagnóstico con Madame Oracle:\n` +
      `📊 *Resultado:* ${result.status}\n` +
      `🏷️ *Perfil:* ${result.profileName}\n` +
      `📉 *Costos:* CMV ${result.cogsPercentage.toFixed(1)}% | Mano de Obra ${result.laborPercentage.toFixed(1)}%\n\n` +
      `Me gustaría revisar esto con un consultor.`;
    return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
  };

  // Charts Config
  const pieData = result ? [
    { name: 'Mercadería', value: result.cogsPercentage, color: '#1FB6D5' }, // Cyan
    { name: 'Mano de Obra', value: result.laborPercentage, color: '#F2B350' }, // Yellow
    { name: 'Fijos/Alq', value: result.fixedPercentage, color: '#64748b' }, // Grey
    { name: 'Margen', value: Math.max(0, result.marginPercentage), color: '#1FA77A' } // Green
  ].filter(i => i.value > 0) : [];

  const barData = result ? [
    { name: 'Mercadería', Real: result.cogsPercentage, Ideal: 32 }, 
    { name: 'Mano de Obra', Real: result.laborPercentage, Ideal: 25 },
    { name: 'Fijos', Real: result.fixedPercentage, Ideal: 20 },
    { name: 'Margen', Real: result.marginPercentage, Ideal: 23 },
  ] : [];

  const isContactValid = formData.contactName && formData.contactEmail && formData.businessName;

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Madame Oracle Header */}
        {!result && (
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 bg-[#00344F] text-[#1FB6D5] px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-2 border border-[#1FB6D5]/30">
              <Sparkles className="w-4 h-4" /> Módulo Madame Oracle
            </div>
            <h1 className="text-3xl font-bold text-white font-space">Diagnóstico Express</h1>
          </div>
        )}

        {/* Progress Bar */}
        <div className="mb-10">
          <div className="flex justify-between mb-2 px-1">
            {STEPS.map((s, i) => (
              <span key={s} className={`text-[10px] md:text-xs font-bold uppercase tracking-wider ${i <= step ? 'text-[#1FB6D5]' : 'text-slate-600'}`}>
                {s}
              </span>
            ))}
          </div>
          <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
            <div 
              className="h-2 bg-[#1FB6D5] rounded-full transition-all duration-500 ease-out shadow-[0_0_10px_#1FB6D5]"
              style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Main Card */}
        <div className="bg-[#0b1b26] border border-slate-700 rounded-2xl p-6 md:p-10 shadow-2xl relative overflow-hidden">
          
          {/* STEP 1: Datos Básicos */}
          {step === 0 && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h2 className="text-2xl font-bold text-white mb-2 font-space">Datos del Negocio</h2>
                <p className="text-slate-400">Empecemos por entender el contexto de tu operación.</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Tipo de Negocio</label>
                  <select 
                    name="businessType" 
                    value={formData.businessType} 
                    onChange={handleChange}
                    className="bg-[#00344F]/40 border border-slate-600 text-white text-sm rounded-md block w-full p-2.5 focus:ring-[#1FB6D5] focus:border-[#1FB6D5]"
                  >
                    {Object.values(BusinessType).map(t => <option key={t} value={t}>{t}</option>)}
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
          )}

          {/* STEP 2: Números Básicos */}
          {step === 1 && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h2 className="text-2xl font-bold text-white mb-2 font-space">Números del último mes</h2>
                <p className="text-slate-400">Usá números aproximados. La <span className="font-mono font-bold text-[#1FB6D5]">Madame Oracle</span> necesita datos para predecir.</p>
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
          )}

          {/* STEP 3: Percepción */}
          {step === 2 && (
            <div className="space-y-6 animate-fade-in">
               <div>
                 <h2 className="text-2xl font-bold text-white mb-2 font-space">¿Qué te quita el sueño?</h2>
                 <p className="text-slate-400">Seleccioná todo lo que aplique a tu situación actual.</p>
               </div>

               <div className="space-y-3">
                 {[
                   "Costos demasiado altos",
                   "Poco margen de ganancia",
                   "Caos operativo / nadie sigue procesos",
                   "Equipo desmotivado / alta rotación",
                   "Quejas de clientes / Reseñas malas",
                   "Quiebres de stock",
                   "No tengo idea de mis números"
                 ].map(option => (
                   <label key={option} className={`flex items-center p-4 rounded-xl border cursor-pointer transition-all group ${formData.primaryConcern.includes(option) ? 'border-[#1FB6D5] bg-[#1FB6D5]/10' : 'border-slate-700 hover:bg-slate-800'}`}>
                     <div className={`w-5 h-5 rounded border flex items-center justify-center mr-4 transition-colors ${formData.primaryConcern.includes(option) ? 'border-[#1FB6D5] bg-[#1FB6D5] text-[#021019]' : 'border-slate-500'}`}>
                        {formData.primaryConcern.includes(option) && <Check className="w-3 h-3" strokeWidth={4} />}
                     </div>
                     <span className={`text-lg ${formData.primaryConcern.includes(option) ? 'text-[#1FB6D5] font-bold' : 'text-slate-300 group-hover:text-white'}`}>{option}</span>
                     <input 
                       type="checkbox" 
                       name="primaryConcern" 
                       value={option} 
                       checked={formData.primaryConcern.includes(option)}
                       onChange={() => handleConcernChange(option)}
                       className="hidden"
                     />
                   </label>
                 ))}
               </div>
               <div className="flex gap-4 pt-4">
                <Button variant="secondary" onClick={prevStep}>Atrás</Button>
                <Button onClick={nextStep} fullWidth disabled={formData.primaryConcern.length === 0}>Siguiente</Button>
              </div>
            </div>
          )}

          {/* STEP 4: Check 7P */}
          {step === 3 && (
            <div className="space-y-6 animate-fade-in">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-white mb-2 font-space">Check Rápido 7P</h2>
                <p className="text-slate-400">Sé honesto. Nadie te juzga (solo el algoritmo).</p>
              </div>
              
              <div className="space-y-8">
                {QUESTIONS_7P.map((item) => {
                   const currentScore = formData.methodologyScores[item.key] || 0;
                   return (
                    <div key={item.key} className="border-b border-slate-800 pb-6 last:border-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="bg-[#00344F] text-[#1FB6D5] text-xs font-bold px-2 py-1 rounded font-mono border border-[#1FB6D5]/20">{item.letter}</span>
                        <span className="text-slate-200 font-medium">{item.text}</span>
                      </div>
                      <div className="flex items-center justify-between mt-3">
                        <span className="text-xs text-slate-500 uppercase font-bold w-20">{item.low}</span>
                        <div className="flex gap-2 sm:gap-4">
                          {[1, 2, 3, 4, 5].map((val) => (
                            <button
                              key={val}
                              onClick={() => handleScoreChange(item.key, val)}
                              className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center font-bold text-lg transition-all ${
                                currentScore === val 
                                ? 'bg-[#1FB6D5] text-[#021019] scale-110 shadow-lg shadow-[#1FB6D5]/30' 
                                : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
                              }`}
                            >
                              {val}
                            </button>
                          ))}
                        </div>
                        <span className="text-xs text-slate-500 uppercase font-bold w-20 text-right">{item.high}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex gap-4 pt-4">
                <Button variant="secondary" onClick={prevStep}>Atrás</Button>
                <Button onClick={nextStep} fullWidth>Siguiente</Button>
              </div>
            </div>
          )}

          {/* STEP 5: LEAD CAPTURE */}
          {step === 4 && (
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

                <div className="space-y-4 bg-slate-900 p-6 rounded-xl border border-slate-700">
                   <Input 
                      label="Nombre y Apellido" 
                      name="contactName" 
                      value={formData.contactName} 
                      onChange={handleChange} 
                      placeholder="Tu nombre" 
                   />
                   <Input 
                      label="Nombre del Negocio" 
                      name="businessName" 
                      value={formData.businessName} 
                      onChange={handleChange} 
                      placeholder="Ej: Burger King" 
                   />
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input 
                          label="Email" 
                          type="email" 
                          name="contactEmail" 
                          value={formData.contactEmail} 
                          onChange={handleChange} 
                          placeholder="nombre@ejemplo.com" 
                      />
                      <Input 
                          label="WhatsApp" 
                          type="tel" 
                          name="contactPhone" 
                          value={formData.contactPhone} 
                          onChange={handleChange} 
                          placeholder="+54 9 11..." 
                      />
                   </div>
                </div>

                <div className="flex items-center gap-2 justify-center text-xs text-slate-500 mt-4">
                   <Lock className="w-3 h-3" />
                   Tus datos están seguros.
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
          )}

          {/* STEP 6: Result (Dashboard) - Dark Theme */}
          {step === 5 && result && (
            <div className="animate-fade-in space-y-10">
              
              {/* Block 1: Status General */}
              <div className="text-center">
                 <div className={`inline-flex items-center justify-center px-6 py-2 rounded-full border-2 text-xl font-bold mb-6 ${getStatusColor(result.status)}`}>
                    {result.status === DiagnosticStatus.RED && <XCircle className="w-6 h-6 mr-3" />}
                    {result.status === DiagnosticStatus.YELLOW && <AlertTriangle className="w-6 h-6 mr-3" />}
                    {result.status === DiagnosticStatus.GREEN && <CheckCircle className="w-6 h-6 mr-3" />}
                    Estado General: {result.status}
                 </div>
                 
                 <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-4 font-space">{result.profileName}</h2>
                 <p className="text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
                   {result.profileDescription}
                 </p>
              </div>

              {/* NEW Block: Visual Graphics */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                 {/* Chart 1: Distribution */}
                 <div className="bg-slate-900 p-6 rounded-xl border border-slate-700">
                    <h3 className="text-white font-bold text-center mb-4 font-space">¿A dónde se van tus ventas?</h3>
                    <div className="h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={pieData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                            stroke="none"
                          >
                            {pieData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                            ))}
                          </Pie>
                          <Tooltip 
                             formatter={(value: number) => `${value.toFixed(1)}%`}
                             contentStyle={{ backgroundColor: '#021019', borderColor: '#334155', color: '#fff' }}
                          />
                          <Legend verticalAlign="bottom" height={36} wrapperStyle={{fontFamily: 'sans-serif', fontSize: '12px', color: '#cbd5e1'}}/>
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                 </div>

                 {/* Chart 2: Benchmark */}
                 <div className="bg-slate-900 p-6 rounded-xl border border-slate-700">
                    <h3 className="text-white font-bold text-center mb-4 font-space">Tus números vs. Ideal</h3>
                    <div className="h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={barData}
                          layout="vertical"
                          margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#334155" />
                          <XAxis type="number" stroke="#94a3b8" unit="%" fontFamily="monospace" />
                          <YAxis type="category" dataKey="name" stroke="#cbd5e1" width={80} style={{ fontSize: '12px', fontFamily: 'sans-serif' }} />
                          <Tooltip 
                            formatter={(value: number) => `${value.toFixed(1)}%`}
                            contentStyle={{ backgroundColor: '#021019', borderColor: '#334155', color: '#fff' }}
                            cursor={{fill: '#1e293b'}}
                          />
                          <Legend wrapperStyle={{fontFamily: 'sans-serif', fontSize: '12px', color: '#cbd5e1'}}/>
                          <Bar dataKey="Real" fill="#1FB6D5" radius={[0, 4, 4, 0]} />
                          <Bar dataKey="Ideal" fill="#475569" radius={[0, 4, 4, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                 </div>
              </div>

              {/* Block 3: Key Numbers */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                 <div className="bg-slate-900 p-6 rounded-xl border border-slate-700 text-center">
                    <p className="text-slate-500 text-xs uppercase font-bold tracking-wider mb-2">Costo Mercadería</p>
                    <p className={`text-3xl font-bold mb-2 font-mono ${getMetricColor(result.cogsPercentage, 'cogs')}`}>{formatPercent(result.cogsPercentage)}</p>
                    <span className="text-xs text-slate-500">Ideal: &lt; 35%</span>
                 </div>
                 <div className="bg-slate-900 p-6 rounded-xl border border-slate-700 text-center">
                    <p className="text-slate-500 text-xs uppercase font-bold tracking-wider mb-2">Mano de Obra</p>
                    <p className={`text-3xl font-bold mb-2 font-mono ${getMetricColor(result.laborPercentage, 'labor')}`}>{formatPercent(result.laborPercentage)}</p>
                    <span className="text-xs text-slate-500">Ideal: &lt; 25-30%</span>
                 </div>
                 <div className="bg-slate-900 p-6 rounded-xl border border-slate-700 text-center">
                    <p className="text-slate-500 text-xs uppercase font-bold tracking-wider mb-2">Margen Estimado</p>
                    <p className={`text-3xl font-bold mb-2 font-mono ${getMetricColor(result.marginPercentage, 'margin')}`}>{formatPercent(result.marginPercentage)}</p>
                    <span className="text-xs text-slate-500">Antes de impuestos</span>
                 </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 {/* Block 4: Strengths */}
                 <div className="bg-slate-900/50 p-6 rounded-xl border-l-4 border-[#1FA77A]">
                    <h3 className="text-white font-bold text-lg mb-4 flex items-center font-space">
                      <Star className="w-5 h-5 text-[#1FA77A] mr-2" fill="currentColor"/> 
                      Lo que hacés bien
                    </h3>
                    <ul className="space-y-3">
                       {result.strengths.map((str, idx) => (
                         <li key={idx} className="flex items-start text-slate-300 text-sm">
                           <CheckCircle className="w-4 h-4 text-[#1FA77A] mr-2 mt-0.5 flex-shrink-0" />
                           {str}
                         </li>
                       ))}
                    </ul>
                 </div>

                 {/* Block 5: Priorities */}
                 <div className="bg-slate-900/50 p-6 rounded-xl border-l-4 border-[#D64747]">
                    <h3 className="text-white font-bold text-lg mb-4 flex items-center font-space">
                      <TrendingUp className="w-5 h-5 text-[#D64747] mr-2" /> 
                      Prioridades Inmediatas
                    </h3>
                    <ul className="space-y-3">
                       {result.priorities.map((prio, idx) => (
                         <li key={idx} className="flex items-start text-slate-300 text-sm">
                           <ArrowRight className="w-4 h-4 text-[#D64747] mr-2 mt-0.5 flex-shrink-0" />
                           {prio}
                         </li>
                       ))}
                    </ul>
                 </div>
              </div>

              {/* Block 6: CTA */}
              <div className="flex flex-col gap-4 pt-6">
                <a href={getWhatsappLink()} target="_blank" rel="noreferrer" className="w-full">
                  <Button className="w-full justify-center py-4 text-lg bg-[#1FA77A] hover:bg-[#15805d] shadow-lg shadow-green-900/10 border-0">
                    <MessageCircle className="w-5 h-5 mr-2" /> Quiero que revisemos estos números juntos
                  </Button>
                </a>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Button variant="outline" className="justify-center py-3" onClick={() => alert("Simulación: PDF Generado y Descargado")}>
                    <Download className="w-5 h-5 mr-2" /> Descargar informe PDF
                  </Button>
                  
                  <Link to="/dashboard">
                    <Button variant="secondary" className="w-full justify-center py-3">
                      <Save className="w-5 h-5 mr-2" /> Ir al Dashboard
                    </Button>
                  </Link>
                </div>
              </div>

            </div>
          )}

        </div>
      </div>
    </Layout>
  );
};

export default QuickDiagnostic;
