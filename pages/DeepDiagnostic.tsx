
import React, { useState } from 'react';
import Layout from '../components/Layout';
import Input from '../components/ui/Input';
import CurrencyInput from '../components/ui/CurrencyInput';
import Button from '../components/ui/Button';
import { DeepDiagnosticInput } from '../types';
import { calculateDeepDiagnostic } from '../services/calculations';
import { saveDeepDiagnosticResult } from '../services/storage';
import { Save, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const DeepDiagnostic = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);
  const [data, setData] = useState<DeepDiagnosticInput>({
    month: new Date().toISOString().slice(0, 7),
    salesFood: 0, salesBeverage: 0, salesOther: 0, discounts: 0,
    costFood: 0, costBeverage: 0, inventoryAdjustment: 0,
    laborKitchen: 0, laborService: 0, laborSocial: 0, laborOther: 0,
    services: 0, rent: 0, taxes: 0, fees: 0, otherFixed: 0
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setData(prev => ({
      ...prev,
      [name]: type === 'number' ? Number(value) : value
    }));
  };

  const handleCurrencyValueChange = (name: string, value: number) => {
    setData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    const result = calculateDeepDiagnostic(data);
    const success = saveDeepDiagnosticResult(result);
    
    if (success) {
        // No alert needed, just redirect for smooth UX
        navigate('/dashboard');
    } else {
        alert("Hubo un error al guardar los datos.");
    }
  };

  const TABS = ['Ventas', 'Costo Mercadería', 'Mano de Obra', 'Gastos Fijos'];

  return (
    <Layout user={{ name: "User" }}>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6 flex justify-between items-end">
           <div>
             <h1 className="text-2xl font-bold text-white">Nuevo Diagnóstico Profundo</h1>
             <p className="text-slate-400 text-sm">Cargá los datos de tu P&L para obtener un análisis detallado.</p>
           </div>
           <Input 
              label="Mes Analizado" 
              type="month" 
              name="month" 
              value={data.month} 
              onChange={handleChange} 
              className="mb-0 w-48"
           />
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-700 mb-6 overflow-x-auto">
          {TABS.map((tab, idx) => (
            <button
              key={tab}
              onClick={() => setActiveTab(idx)}
              className={`px-6 py-3 text-sm font-medium transition-colors whitespace-nowrap ${
                activeTab === idx 
                ? 'border-b-2 border-cyan-500 text-cyan-400' 
                : 'text-slate-400 hover:text-white'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 shadow-lg min-h-[400px]">
          {activeTab === 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
              <CurrencyInput label="Ventas Alimentos" prefix="$" name="salesFood" value={data.salesFood} onValueChange={handleCurrencyValueChange} />
              <CurrencyInput label="Ventas Bebidas" prefix="$" name="salesBeverage" value={data.salesBeverage} onValueChange={handleCurrencyValueChange} />
              <CurrencyInput label="Otros Ingresos" prefix="$" name="salesOther" value={data.salesOther} onValueChange={handleCurrencyValueChange} />
              <CurrencyInput label="Descuentos y Cortesías" prefix="$" name="discounts" value={data.discounts} onValueChange={handleCurrencyValueChange} className="border-red-900/50 text-red-200" />
            </div>
          )}

          {activeTab === 1 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
              <div className="col-span-2 p-3 bg-blue-900/20 border border-blue-900 rounded mb-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0" />
                <p className="text-sm text-blue-200">Tip: El costo debe ser el consumo real (Inventario Inicial + Compras - Inventario Final). Si solo ponés compras, el número puede mentir.</p>
              </div>
              <CurrencyInput label="Compras Alimentos" prefix="$" name="costFood" value={data.costFood} onValueChange={handleCurrencyValueChange} />
              <CurrencyInput label="Compras Bebidas" prefix="$" name="costBeverage" value={data.costBeverage} onValueChange={handleCurrencyValueChange} />
              <CurrencyInput label="Ajuste de Inventario" prefix="$" name="inventoryAdjustment" value={data.inventoryAdjustment} onValueChange={handleCurrencyValueChange} placeholder="Opcional" />
            </div>
          )}

          {activeTab === 2 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
              <CurrencyInput label="Sueldos Cocina" prefix="$" name="laborKitchen" value={data.laborKitchen} onValueChange={handleCurrencyValueChange} />
              <CurrencyInput label="Sueldos Salón/Barra" prefix="$" name="laborService" value={data.laborService} onValueChange={handleCurrencyValueChange} />
              <CurrencyInput label="Cargas Sociales (931/Sindicato)" prefix="$" name="laborSocial" value={data.laborSocial} onValueChange={handleCurrencyValueChange} />
              <CurrencyInput label="Otros (Extras, Uniformes)" prefix="$" name="laborOther" value={data.laborOther} onValueChange={handleCurrencyValueChange} />
            </div>
          )}

          {activeTab === 3 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
               <CurrencyInput label="Alquiler" prefix="$" name="rent" value={data.rent} onValueChange={handleCurrencyValueChange} />
               <CurrencyInput label="Servicios (Luz, Gas, Agua, Internet)" prefix="$" name="services" value={data.services} onValueChange={handleCurrencyValueChange} />
               <CurrencyInput label="Impuestos (IIBB, Municipal)" prefix="$" name="taxes" value={data.taxes} onValueChange={handleCurrencyValueChange} />
               <CurrencyInput label="Honorarios / Sistemas" prefix="$" name="fees" value={data.fees} onValueChange={handleCurrencyValueChange} />
               <CurrencyInput label="Otros Gastos Operativos" prefix="$" name="otherFixed" value={data.otherFixed} onValueChange={handleCurrencyValueChange} />
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-between">
          <Button variant="secondary" onClick={() => setActiveTab(Math.max(0, activeTab - 1))} disabled={activeTab === 0}>
            Anterior
          </Button>
          
          {activeTab < TABS.length - 1 ? (
             <Button onClick={() => setActiveTab(activeTab + 1)}>
               Siguiente
             </Button>
          ) : (
            <Button onClick={handleSave} className="bg-green-600 hover:bg-green-500">
               <Save className="w-4 h-4 mr-2" /> Calcular y Guardar
            </Button>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default DeepDiagnostic;
