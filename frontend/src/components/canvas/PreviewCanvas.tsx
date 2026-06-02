import React, { useMemo } from 'react';
import { TemplateCreator } from './TemplateCreator';
import { mapLayoutItemsToRows } from '../../utils/canvas.utils';
import type { TemplateLayoutItem } from '../../types/newsletter';

export interface PreviewCanvasProps {
  layout: TemplateLayoutItem[];
}

export const PreviewCanvas: React.FC<PreviewCanvasProps> = ({ layout }) => {
  const rows = useMemo(() => mapLayoutItemsToRows(layout), [layout]);

  return (
    <TemplateCreator
      mode="readonly"
      rows={rows}
      isSkeletonView={false}
      selectedBlockId={null}
    />
  );
};
