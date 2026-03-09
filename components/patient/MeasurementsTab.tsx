
import React, { useState } from 'react';
import { Patient } from '../../types';
import { AnthropometryTable } from './AnthropometryTable';
import { SomatocartaModule } from './SomatocartaModule';
import { NewMeasurementForm } from './NewMeasurementForm';

export const MeasurementsTab: React.FC<{ patient: Patient; onUpdate: (p: Patient) => void }> = ({ patient, onUpdate }) => {
  const [view, setView] = useState<'list' | 'detail' | 'new'>('list');

  return (
    <div className="space-y-8">
      <NewMeasurementForm 
        patient={patient} 
        onUpdate={onUpdate} 
        onViewChange={setView}
      />
      {view === 'list' && (
        <>
          <AnthropometryTable patient={patient} onUpdate={onUpdate} />
          <SomatocartaModule patient={patient} onUpdate={onUpdate} />
        </>
      )}
    </div>
  );
};
