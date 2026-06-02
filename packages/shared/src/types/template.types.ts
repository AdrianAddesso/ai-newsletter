export interface TemplateBlock {
  type: string | null;
  content: string | null;
  row: number;
  grid_column: number;
  display_order: number;
  mustFill: boolean;
}

export interface TemplatePayload {
  id: string;
  name: string;
  description: string;
  area_id: string;
  layout: TemplateBlock[];
  orientation: 'PORTRAIT' | 'LANDSCAPE';
  state_id: string;
  prompt_base: string;
  created_by_user_id: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface CreateTemplateResponse {
  message: string;
  newTemplate: {
    payload: TemplatePayload;
  };
  status: number;
}

export interface TemplateMutationResponse {
  message: string;
  status: number;
  newTemplate?: {
    payload: TemplatePayload;
  };
  updatedTemplate?: {
    payload: TemplatePayload;
  };
}
