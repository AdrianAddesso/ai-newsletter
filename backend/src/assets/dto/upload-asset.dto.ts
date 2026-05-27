import { asset_type } from '@prisma/client';

export interface UploadedAssetFile {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

export interface UploadedAssetDto {
  id: string;
  name: string;
  description?: string | null;
  created_at: string;
  updated_at: string;
  url: string;
  type: asset_type;
  svgTemplate?: string | null;
  maxChars?: number | null;
}

export interface UploadAssetsResponseDto {
  assets: UploadedAssetDto[];
}

export interface UpdateAssetDto {
  name: string;
  description?: string | null;
  type: asset_type;
}

export interface UploadAssetMetadataDto {
  name?: string;
  description?: string | null;
}
