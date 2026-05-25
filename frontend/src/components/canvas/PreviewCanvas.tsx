import React, { useMemo } from 'react';
import { NewsletterCanvas } from './NewsletterCanvas';
import { mapLayoutItemsToRows } from '../../utils/canvas.utils';
import type { TemplateLayoutItem } from '../../types/newsletter';

export interface PreviewCanvasProps {
  layout: TemplateLayoutItem[];
}

export const PreviewCanvas: React.FC<PreviewCanvasProps> = ({ layout }) => {
  const rows = useMemo(() => mapLayoutItemsToRows(layout), [layout]);

  return (
    <NewsletterCanvas
      mode="readonly"
      rows={rows}
      isSkeletonView={false}
    />
  );
};
