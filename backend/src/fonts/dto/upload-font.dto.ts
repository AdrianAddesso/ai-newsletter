export interface UploadedFontFile {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

export interface UploadedFontDto {
  id: string;
  name: string;
  url: string;
  style: string;
  groupName: string;
  file_name: string;
  extension: string | null;
  size_bytes: number | null;
  created_at: Date;
}

export interface UploadFontsResponseDto {
  fonts: UploadedFontDto[];
}

export interface UploadedFontUpdateDto {
  name: string;
  style: string;
}
