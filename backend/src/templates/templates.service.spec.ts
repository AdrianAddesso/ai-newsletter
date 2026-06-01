import { NotFoundException } from '@nestjs/common';
import { TemplatesService } from './templates.service';

describe('TemplatesService', () => {
  const prisma = {
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
});
