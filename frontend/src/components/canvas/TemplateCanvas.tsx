import React from 'react';
import { useTemplateStore } from '../../stores/templates.store';
import { NewsletterCanvas } from './NewsletterCanvas';

export const TemplateCanvas: React.FC = () => {
  const { 
    rows, 
    isSkeletonView, 
    selectedBlockId, 
    setSelectedBlockId, 
    updateColumnBlock 
  } = useTemplateStore();

  return (
    <NewsletterCanvas
      mode="edit"
      rows={rows}
      isSkeletonView={isSkeletonView}
      selectedBlockId={selectedBlockId}
      onBlockSelect={setSelectedBlockId}
      onBlockDelete={(rowId, colId) => updateColumnBlock(rowId, colId, null)}
    />
  );
};
