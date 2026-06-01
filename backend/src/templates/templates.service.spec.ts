import { NotFoundException } from '@nestjs/common';
import { TemplatesService } from './templates.service';

describe('TemplatesService', () => {
  const prisma = {
    areas: {
      findUnique: jest.fn(),
    },
    template_states: {
      findUnique: jest.fn(),
    },
    templates: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
  };

  let service: TemplatesService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new TemplatesService(prisma as never);
  });

  it('filters deleted templates from the list query', async () => {
    prisma.templates.findMany.mockResolvedValue([]);

    await service.getAll();

    expect(prisma.templates.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          deleted_at: null,
        }),
      }),
    );
  });

  it('marks templates as deleted with deleted_at', async () => {
    prisma.templates.findFirst.mockResolvedValue({ id: 'template-id' });
    prisma.templates.update.mockResolvedValue({ id: 'template-id' });

    await service.delete('template-id');

    expect(prisma.templates.findFirst).toHaveBeenCalledWith({
      where: {
        id: 'template-id',
        deleted_at: null,
      },
      select: {
        id: true,
      },
    });
    expect(prisma.templates.update).toHaveBeenCalledWith({
      where: { id: 'template-id' },
      data: {
        deleted_at: expect.any(Date) as Date,
      },
    });
  });

  it('rejects deleting a missing or already deleted template', async () => {
    prisma.templates.findFirst.mockResolvedValue(null);

    await expect(service.delete('missing-template')).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(prisma.templates.update).not.toHaveBeenCalled();
  });

  it('updates a template with validated fields', async () => {
    prisma.templates.findFirst.mockResolvedValue({ id: 'template-id' });
    prisma.areas.findUnique.mockResolvedValue({ id: 'area-id' });
    prisma.template_states.findUnique.mockResolvedValue({ id: 'state-id' });
    prisma.templates.update.mockResolvedValue({ id: 'template-id' });

    await service.update('template-id', {
      name: 'Nuevo nombre',
      description: 'Nueva descripcion',
      area: 'COMUNICACION_INTERNA',
      state: 'ACTIVE',
      promptBase: 'Prompt base actualizado',
      orientation: 'PORTRAIT',
      layout: [
        {
          block_type: 'headerFull',
          content: 'Contenido',
          row: 0,
          grid_column: 0,
          display_order: 0,
        },
      ],
    });

    expect(prisma.templates.update).toHaveBeenCalledWith({
      where: { id: 'template-id' },
      data: expect.objectContaining({
        name: 'Nuevo nombre',
        description: 'Nueva descripcion',
        area_id: 'area-id',
        state_id: 'state-id',
        prompt_base: 'Prompt base actualizado',
        orientation: 'PORTRAIT',
        layout: expect.any(Array) as unknown[],
      }),
    });
  });
});
