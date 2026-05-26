import React from 'react';
import { useTemplateStore } from '../../stores/templates.store';
import { TemplateCreator } from './TemplateCreator';

export const Template: React.FC = () => {
  const { 
    rows, 
    isSkeletonView, 
    selectedBlockId, 
    setSelectedBlockId, 
    updateColumnBlock 
  } = useTemplateStore();

  return (
    <TemplateCreator
      mode="edit"
      rows={rows}
      isSkeletonView={isSkeletonView}
      selectedBlockId={selectedBlockId}
      onBlockSelect={setSelectedBlockId}
      onBlockDelete={(rowId, colId) => updateColumnBlock(rowId, colId, null)}
    />
  );
};
