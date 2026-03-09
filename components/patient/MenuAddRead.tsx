import React, { useState, useEffect } from 'react';
import { Patient, VetCalculation, MacrosRecord, PortionsRecord } from '../../types';
import { store } from '../../services/store';
import { Calculator, Eye, EyeOff, ArrowLeft, Edit2, BookOpen } from 'lucide-react';
import { MenuAddReadSec1 } from './MenuAddReadSec1';
import { MenuAddReadSec2 } from './MenuAddReadSec2';
import { MenuAddReadSec3 } from './MenuAddReadSec3';
import { MenuPlanData } from '../menus_components/MenuDesignTemplates';

interface MenuAddReadProps {
  patient: Patient;
  onUpdate: (p: Patient) => void;
  editingMenuId: string | null;
  onClose: () => void;
}

export const MenuAddRead: React.FC<MenuAddReadProps> = ({ patient, onUpdate, editingMenuId, onClose }) => {
  const [menuName, setMenuName] = useState('');
  const [isEditingName, setIsEditingName] = useState(false);
  const [isCalculationVisible, setIsCalculationVisible] = useState(true);

  const defaultVet: VetCalculation = {
    age: patient.clinical?.age || 0,
    weight: parseFloat(patient.clinical?.initialWeight || '0') || 0,
    height: parseFloat(patient.clinical?.initialHeight || '0') || 0,
    sex: (patient.clinical?.sex === 'Femenino' || patient.clinical?.sex === 'Masculino') ? patient.clinical.sex : 'Femenino',
    activityLevel: 'Moderado',
    activityFactor: 0,
    kcal: 0,
    kcalReal: 0,
    kcalToWork: 0
  };

  const defaultMacros: MacrosRecord = {
    cho: { pct: 50, kcal: 0, g: 0, notes: '' },
    chon: { pct: 20, kcal: 0, g: 0, notes: '' },
    fat: { pct: 30, kcal: 0, g: 0, notes: '' },
    totalKcal: 0
  };

  const defaultPortions: PortionsRecord = {
    lec: 0, lecDesc: 0, fru: 0, veg: 0, cer: 0, carMagra: 0, carSemi: 0, carAlta: 0, gra: 0, azu: 0
  };

  const [vetData, setVetData] = useState<VetCalculation>(defaultVet);
  const [macros, setMacros] = useState<MacrosRecord>(defaultMacros);
  const [portions, setPortions] = useState<PortionsRecord>(defaultPortions);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("base_v1");
  const [selectedReferenceIds, setSelectedReferenceIds] = useState<string[]>([]);
  const [aiDraftText, setAiDraftText] = useState<string>("");
  const [aiRationale, setAiRationale] = useState<string>("");
  const [menuPreviewData, setMenuPreviewData] = useState<MenuPlanData | null>(null);
  const [zoom, setZoom] = useState<number>(1);

  useEffect(() => {
    if (editingMenuId) {
      const allMenus = [...(patient.menus || []), ...(patient.dietary?.menus || [])];
      const menu = allMenus.find(m => m.id === editingMenuId);
      if (menu) {
        setVetData(menu.vet || defaultVet);
        setMacros(menu.macros || defaultMacros);
        setPortions(menu.portions || defaultPortions);
        setMenuName(menu.name || `Menú para ${patient.firstName} ${new Date().toLocaleDateString()}`);
        setSelectedTemplateId(menu.selectedTemplateId || "base_v1");
        setSelectedReferenceIds(menu.selectedReferenceIds || []);
        setAiDraftText(menu.content || "");
        setAiRationale(menu.aiRationale || "");
        setMenuPreviewData(menu.menuPreviewData || null);
      }
    } else {
      setVetData(defaultVet);
      setMacros(defaultMacros);
      setPortions(defaultPortions);
      setMenuName(`Menú para ${patient.firstName} ${new Date().toLocaleDateString()}`);
    }
  }, [editingMenuId, patient]);

  const handleSaveAndClose = () => {
    const rootMenus = patient.menus || [];
    const dietaryMenus = patient.dietary?.menus || [];
    
    // Create a unified list for editing/adding
    const uniqueMenus = new Map<string, any>();
    [...rootMenus, ...dietaryMenus].forEach(m => {
      if (m && m.id) uniqueMenus.set(m.id, m);
    });

    let updatedMenus = Array.from(uniqueMenus.values());

    if (editingMenuId) {
      updatedMenus = updatedMenus.map(m => m.id === editingMenuId ? {
        ...m,
        vet: vetData,
        macros: macros,
        portions: portions,
        name: menuName || `Menú ${vetData.kcalToWork} kcal`,
        selectedTemplateId,
        selectedReferenceIds,
        content: aiDraftText,
        aiRationale,
        menuPreviewData
      } : m);
    } else {
      updatedMenus.push({
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        basedOnMeasurementDate: new Date().toISOString(),
        content: aiDraftText,
        vet: vetData,
        macros: macros,
        portions: portions,
        name: menuName || `Menú ${vetData.kcalToWork} kcal`,
        selectedTemplateId,
        selectedReferenceIds,
        aiRationale,
        menuPreviewData
      });
    }

    const updatedPatient = {
      ...patient,
      // Save to root menus as primary location
      menus: updatedMenus,
      // Clear dietary.menus to avoid confusion in future, 
      // but keep it as empty array to satisfy type if needed
      dietary: {
        ...patient.dietary,
        menus: []
      }
    };
    onUpdate(updatedPatient);
    store.updatePatient(updatedPatient);
    onClose();
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      {/* Top Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-500"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 group cursor-pointer" onClick={() => setIsEditingName(true)}>
            {isEditingName ? (
              <input 
                autoFocus
                type="text"
                value={menuName}
                onChange={(e) => setMenuName(e.target.value)}
                onBlur={() => setIsEditingName(false)}
                onKeyDown={(e) => e.key === 'Enter' && setIsEditingName(false)}
                className="text-lg font-bold text-slate-800 bg-slate-50 border-b-2 border-emerald-500 outline-none px-2 py-1"
              />
            ) : (
              <>
                <h1 className="text-lg font-bold text-slate-800">{menuName}</h1>
                <Edit2 className="w-4 h-4 text-slate-300 group-hover:text-emerald-500 transition-colors" />
              </>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={onClose}
            className="px-4 py-2 text-sm font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition-all"
          >
            Regresar
          </button>
          <button 
            onClick={handleSaveAndClose}
            className="bg-emerald-600 text-white font-bold px-6 py-2 rounded-xl shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 transition-all flex items-center gap-2"
          >
            Guardar y Cerrar
          </button>
        </div>
      </div>

      {/* Info Section */}
      <section className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-8">
        {/* Row 1: Menu Details */}
        <div className="grid grid-cols-1 gap-8">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Nombre del Menú</label>
            <input 
              type="text"
              value={menuName}
              onChange={(e) => setMenuName(e.target.value)}
              className="w-full text-sm font-bold text-slate-700 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
            />
          </div>
        </div>

        {/* Row 2: Patient Details */}
        <div className="pt-6 border-t border-slate-100">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Menu para:</label>
            <div className="text-sm font-bold text-slate-700 bg-slate-50 px-4 py-2 rounded-xl border border-slate-100 inline-block min-w-[300px]">
              {patient.firstName} {patient.lastName}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-100 p-2 rounded-xl">
              <Calculator className="w-5 h-5 text-emerald-600" />
            </div>
            <h2 className="text-lg font-bold text-slate-800">Cálculo Nutricional</h2>
            <button 
              onClick={() => setIsCalculationVisible(!isCalculationVisible)}
              className="p-1.5 hover:bg-white rounded-lg transition-colors text-slate-400 hover:text-emerald-600"
            >
              {isCalculationVisible ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {isCalculationVisible && (
          <MenuAddReadSec1 
            vetData={vetData}
            setVetData={setVetData}
            macros={macros}
            setMacros={setMacros}
            portions={portions}
            setPortions={setPortions}
          />
        )}
      </section>

      <MenuAddReadSec2 
        selectedTemplateId={selectedTemplateId}
        setSelectedTemplateId={setSelectedTemplateId}
        selectedReferenceIds={selectedReferenceIds}
        setSelectedReferenceIds={setSelectedReferenceIds}
      />

      <MenuAddReadSec3 
        patient={patient}
        vetData={vetData}
        macros={macros}
        portions={portions}
        selectedTemplateId={selectedTemplateId}
        selectedReferenceIds={selectedReferenceIds}
        aiDraftText={aiDraftText}
        setAiDraftText={setAiDraftText}
        aiRationale={aiRationale}
        setAiRationale={setAiRationale}
        menuPreviewData={menuPreviewData}
        setMenuPreviewData={setMenuPreviewData}
        zoom={zoom}
        setZoom={setZoom}
      />
    </div>
  );
};