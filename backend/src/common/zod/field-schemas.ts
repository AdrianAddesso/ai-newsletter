import { z } from 'zod';

export const uuidFieldSchema = z
  .string()
  .trim()
  .uuid('Debe ser un UUID valido.');

export const requiredStringFieldSchema = z
  .string()
  .trim()
  .min(1, 'Este campo es obligatorio.');

export const optionalStringFieldSchema = z.string().trim().optional();

export const optionalBooleanFieldSchema = z.boolean().optional();

export const optionalIntegerFieldSchema = z.int().optional();

export const optionalDateFieldSchema = z.coerce
  .date({
    error: 'Debe ser una fecha valida.',
  })
  .optional();

export const requiredUrlFieldSchema = z
  .string()
  .trim()
  .url('Debe ser una URL valida.');

export const optionalUrlFieldSchema = z
  .string()
  .trim()
  .url('Debe ser una URL valida.')
  .optional();

export const requiredJsonFieldSchema = z.object().required();
