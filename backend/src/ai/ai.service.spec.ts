import { NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ai_config_type } from '@prisma/client';
import { AiService } from './ai.service';
import { PrismaService } from '../prisma/prisma.service';

// ─── Test helpers ─────────────────────────────────────────────────────────────

type ConfigValues = Record<string, string | undefined>;
function dec(value: number) {
    return { toNumber: () => value };
}

function createConfigService(values: ConfigValues): ConfigService {
    return { get: (key: string) => values[key] } as ConfigService;
}

const mockPrisma = {
    ai_config: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
    },
    prompt_commands: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
    },
    templates: {
        findFirst: jest.fn(),
    },
    brand_kit: {
        findFirst: jest.fn(),
    },
};

function createService(values: ConfigValues = {}) {
    return new AiService(
        createConfigService(values),
        mockPrisma as unknown as PrismaService,
    );
}

    // ─── Fixture factories ────────────────────────────────────────────────────────

    function makeAiConfigRow(type: ai_config_type) {
    return {
        id: `config-${type}`,
        name:
            type === ai_config_type.CREATE
            ? 'Newsletter Generation'
            : 'Text Improvement',
        type,
        temperature: dec(type === ai_config_type.CREATE ? 0.5 : 0.1),
        top_p: dec(0.8),
        top_k: 20,
        max_output_tokens: 4000,
        created_at: new Date('2026-01-01'),
        updated_at: new Date('2026-01-01'),
        deleted_at: null,
    };
    }

    function makePromptCommandRows(type: ai_config_type) {
    if (type === ai_config_type.REGENERATE) {
        return [
        {
            id: 'cmd-1',
            name: 'System instruction',
            type,
            display_order: 0,
            instruction:
            'You are a Spanish copy editor for internal Nestle newsletters. Return only the improved text.',
            created_at: new Date('2026-01-01'),
            updated_at: new Date('2026-01-01'),
            deleted_at: null,
        },
        ];
    }

    return [
        {
        id: 'cmd-2',
        name: 'Role definition',
        type,
        display_order: 1,
        instruction:
            'You are a Spanish copywriter for internal Nestle newsletters.',
        created_at: new Date(),
        updated_at: new Date(),
        deleted_at: null,
        },
        {
        id: 'cmd-3',
        name: 'Task instruction',
        type,
        display_order: 2,
        instruction: 'Generate concise, brand-safe newsletter copy in Spanish.',
        created_at: new Date(),
        updated_at: new Date(),
        deleted_at: null,
        },
        {
        id: 'cmd-4',
        name: 'Output format instruction',
        type,
        display_order: 3,
        instruction: 'Return only valid JSON with this exact shape:',
        created_at: new Date(),
        updated_at: new Date(),
        deleted_at: null,
        },
        {
        id: 'cmd-5',
        name: 'JSON schema example',
        type,
        display_order: 4,
        instruction:
            '{"blocks":[{"id":"header","name":"Encabezado","text":"...","backgroundColor":"#FFFFFF"}]}',
        created_at: new Date(),
        updated_at: new Date(),
        deleted_at: null,
        },
        {
        id: 'cmd-6',
        name: 'Format constraints',
        type,
        display_order: 5,
        instruction:
            'Do not include markdown, comments, explanations, HTML, or fields not shown in the schema.',
        created_at: new Date(),
        updated_at: new Date(),
        deleted_at: null,
        },
        {
        id: 'cmd-7',
        name: 'Source material constraint',
        type,
        display_order: 6,
        instruction:
            'Use the supplied structured context as the only source material.',
        created_at: new Date(),
        updated_at: new Date(),
        deleted_at: null,
        },
    ];
    }

    const CONFIGURED_ENV = {
    CLIENT_ID: 'client-id',
    CLIENT_SECRET: 'client-secret',
    NESTLE_GENIA_URL:
        'https://eur-sdr-int-pub.nestle.com/api/dv-exp-sandbox-openai-api/1/genai/GCP/gemini-2.0-flash-001/generateContent',
    };

function mockAiProviderResponse(text: string) {
    (mockPrisma.templates.findFirst as jest.Mock).mockResolvedValue({
      id: 'weekly-brief',
      layout: [
        {
          block_type: 'headerLeft',
          row: 0,
          grid_column: 0,
          display_order: 0,
        },
      ],
    });
    (mockPrisma.brand_kit.findFirst as jest.Mock).mockResolvedValue({
      id: 'nestle-corporate',
      name: 'Nestle Corporate',
      brandkit_assets: [],
      color_palette: [],
      font_groups: null,
    });

    global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () =>
        Promise.resolve({
            candidates: [{ content: { parts: [{ text }] } }],
        }),
    }) as typeof fetch;
    }

    // ─── Tests ────────────────────────────────────────────────────────────────────

    describe('AiService', () => {
    const originalFetch = global.fetch;

    beforeEach(() => {
        jest.resetAllMocks();
    });

    afterEach(() => {
        global.fetch = originalFetch;
    });

    // ── improveText ──────────────────────────────────────────────────────────

    describe('improveText', () => {
        it('throws ServiceUnavailableException when credentials are not configured', async () => {
        const service = createService();
        mockPrisma.ai_config.findFirst.mockResolvedValue(
            makeAiConfigRow(ai_config_type.REGENERATE),
        );
        mockPrisma.prompt_commands.findMany.mockResolvedValue(
            makePromptCommandRows(ai_config_type.REGENERATE),
        );

        await expect(
            service.improveText({ text: 'Texto de prueba' }),
        ).rejects.toBeInstanceOf(ServiceUnavailableException);
        });

        it('throws BadRequestException for empty text', async () => {
        const service = createService(CONFIGURED_ENV);

        await expect(service.improveText({ text: '   ' })).rejects.toThrow(
            'El texto es requerido y no puede estar vacío',
        );
        });

        it('throws BadRequestException when text exceeds 3000 characters', async () => {
        const service = createService(CONFIGURED_ENV);

        await expect(
            service.improveText({ text: 'a'.repeat(3001) }),
        ).rejects.toThrow('El texto debe tener 3000 caracteres o menos');
        });

        it('improves text using prompt and config loaded from DB', async () => {
        const service = createService(CONFIGURED_ENV);

        mockPrisma.ai_config.findFirst.mockResolvedValue(
            makeAiConfigRow(ai_config_type.REGENERATE),
        );
        mockPrisma.prompt_commands.findMany.mockResolvedValue(
            makePromptCommandRows(ai_config_type.REGENERATE),
        );
        mockAiProviderResponse('Texto mejorado por Nestle');

        await expect(
            service.improveText({ text: 'Texto original' }),
        ).resolves.toEqual({
            originalText: 'Texto original',
            improvedText: 'Texto mejorado por Nestle',
        });

        const fetchMock = global.fetch as jest.MockedFunction<typeof fetch>;
        const [url, requestInit] = fetchMock.mock.calls[0] ?? [];
        const body = JSON.parse((requestInit?.body as string) ?? '{}') as {
            contents: Array<{ parts: Array<{ text: string }> }>;
            generationConfig: {
            temperature: number;
            topP: number;
            topK: number;
            maxOutputTokens: number;
            };
        };

        expect(url).toBe(CONFIGURED_ENV.NESTLE_GENIA_URL);
        expect(requestInit?.headers).toMatchObject({
            client_id: 'client-id',
            client_secret: 'client-secret',
            'Content-Type': 'application/json',
            Accept: 'application/json',
        });
        expect(body.contents[0].parts[0].text).toContain('Text to improve:');
        expect(body.generationConfig).toEqual({
            temperature: 0.1,
            topP: 0.8,
            topK: 20,
            maxOutputTokens: 4000,
        });
        });

        it('uses hardcoded fallback when no REGENERATE config exists in DB', async () => {
        const service = createService(CONFIGURED_ENV);

        mockPrisma.ai_config.findFirst.mockResolvedValue(null);
        mockPrisma.prompt_commands.findMany.mockResolvedValue(
            makePromptCommandRows(ai_config_type.REGENERATE),
        );
        mockAiProviderResponse('Texto mejorado');

        await service.improveText({ text: 'Texto original' });

        const fetchMock = global.fetch as jest.MockedFunction<typeof fetch>;
        const requestInit = fetchMock.mock.calls[0]?.[1];
        const body = JSON.parse((requestInit?.body as string) ?? '{}') as {
            generationConfig: { temperature: number };
        };

        expect(body.generationConfig.temperature).toBe(0.1);
        });
    });

    // ── generateNewsletter ───────────────────────────────────────────────────

    describe('generateNewsletter', () => {
        const baseRequest = {
        area: 'COMUNICACION_INTERNA' as const,
        templateId: 'weekly-brief',
        brandKitId: 'nestle-corporate',
        topic: 'Seguridad',
        objective: 'Informar avances',
        audience: 'Equipo interno',
        keyMessages: ['Mensaje clave'],
        tone: 'Claro',
        linksOrSources: [] as string[],
        assetIds: [] as string[],
        };

        it('generates newsletter blocks using prompt and config from DB', async () => {
        const service = createService(CONFIGURED_ENV);

        mockPrisma.ai_config.findFirst.mockResolvedValue(
            makeAiConfigRow(ai_config_type.CREATE),
        );
        mockPrisma.prompt_commands.findMany.mockResolvedValue(
            makePromptCommandRows(ai_config_type.CREATE),
        );

        const generatedBlocks = [
            {
            id: 'headline',
            name: 'Titulo principal',
            text: 'Nuevo titulo generado',
            backgroundColor: '#97CAEB',
            },
        ];
        mockAiProviderResponse(JSON.stringify({ blocks: generatedBlocks }));

        const result = await service.generateNewsletter(baseRequest);

        expect(result.blocks).toHaveLength(1);
        expect(result.blocks[0]).toMatchObject({
            id: 'headerLeft-0-0-0-0',
            type: 'headerLeft',
            name: 'Header Solo Izquierda',
        });
        expect(JSON.parse(result.blocks[0]?.content ?? '{}')).toMatchObject({
            title: 'Nuevo titulo generado',
        });

        const fetchMock = global.fetch as jest.MockedFunction<typeof fetch>;
        const requestInit = fetchMock.mock.calls[0]?.[1];
        const body = JSON.parse((requestInit?.body as string) ?? '{}') as {
            contents: Array<{ parts: Array<{ text: string }> }>;
            generationConfig: {
            temperature: number;
            topP: number;
            topK: number;
            maxOutputTokens: number;
            };
        };

        expect(body.contents[0].parts[0].text).toContain('"topic":"Seguridad"');
        expect(body.contents[0].parts[0].text).toContain(
            '"templateId":"weekly-brief"',
        );
        expect(body.generationConfig).toEqual({
            temperature: 0.5,
            topP: 0.8,
            topK: 20,
            maxOutputTokens: 4000,
        });
        });

        it('uses hardcoded fallback when no CREATE config exists in DB', async () => {
        const service = createService(CONFIGURED_ENV);

        mockPrisma.ai_config.findFirst.mockResolvedValue(null);
        mockPrisma.prompt_commands.findMany.mockResolvedValue(
            makePromptCommandRows(ai_config_type.CREATE),
        );
        mockAiProviderResponse(
            JSON.stringify({
            blocks: [
                { id: 'h', name: 'n', text: 't', backgroundColor: '#FFFFFF' },
            ],
            }),
        );

        await service.generateNewsletter(baseRequest);

        const fetchMock = global.fetch as jest.MockedFunction<typeof fetch>;
        const requestInit = fetchMock.mock.calls[0]?.[1];
        const body = JSON.parse((requestInit?.body as string) ?? '{}') as {
            generationConfig: { temperature: number };
        };

        expect(body.generationConfig.temperature).toBe(0.5);
        });
    });

    // ── getAiConfigs ─────────────────────────────────────────────────────────

    describe('getAiConfigs', () => {
        it('returns all non-deleted ai_config rows mapped to DTOs', async () => {
        const service = createService();
        const rows = [
            makeAiConfigRow(ai_config_type.CREATE),
            makeAiConfigRow(ai_config_type.REGENERATE),
        ];
        mockPrisma.ai_config.findMany.mockResolvedValue(rows);

        const result = await service.getAiConfigs();

        expect(result).toHaveLength(2);
        expect(result[0]).toMatchObject({
            type: ai_config_type.CREATE,
            temperature: 0.5,
            top_p: 0.8,
            top_k: 20,
        });
        });
    });

    // ── updateAiConfig ───────────────────────────────────────────────────────

    describe('updateAiConfig', () => {
        it('returns updated DTO on success', async () => {
        const service = createService();
        const existing = makeAiConfigRow(ai_config_type.CREATE);
        const updatedRow = {
            ...existing,
            temperature: dec(0.7),
            updated_at: new Date(),
        };

        mockPrisma.ai_config.findFirst.mockResolvedValue(existing);
        mockPrisma.ai_config.update.mockResolvedValue(updatedRow);

        const result = await service.updateAiConfig('config-CREATE', {
            temperature: 0.7,
            top_p: 0.8,
            top_k: 20,
            max_output_tokens: 4000,
        });

        expect(result.temperature).toBe(0.7);
        expect(mockPrisma.ai_config.update).toHaveBeenCalledWith(
            expect.objectContaining({ where: { id: 'config-CREATE' } }),
        );
        });

        it('throws NotFoundException when id does not exist', async () => {
        const service = createService();
        mockPrisma.ai_config.findFirst.mockResolvedValue(null);

        await expect(
            service.updateAiConfig('non-existent', {
            temperature: 0.5,
            top_p: 0.8,
            top_k: 20,
            max_output_tokens: 4000,
            }),
        ).rejects.toBeInstanceOf(NotFoundException);
        });
    });

    // ── getPromptCommands ────────────────────────────────────────────────────

    describe('getPromptCommands', () => {
        it('returns all prompt commands when no type filter is given', async () => {
        const service = createService();
        const rows = [
            ...makePromptCommandRows(ai_config_type.CREATE),
            ...makePromptCommandRows(ai_config_type.REGENERATE),
        ];
        mockPrisma.prompt_commands.findMany.mockResolvedValue(rows);

        const result = await service.getPromptCommands();

        expect(result).toHaveLength(rows.length);
        expect(mockPrisma.prompt_commands.findMany).toHaveBeenCalledWith(
            expect.objectContaining({ where: { deleted_at: null } }),
        );
        });

        it('passes type filter to Prisma when provided', async () => {
        const service = createService();
        mockPrisma.prompt_commands.findMany.mockResolvedValue(
            makePromptCommandRows(ai_config_type.CREATE),
        );

        await service.getPromptCommands(ai_config_type.CREATE);

        expect(mockPrisma.prompt_commands.findMany).toHaveBeenCalledWith(
            expect.objectContaining({
            where: { deleted_at: null, type: ai_config_type.CREATE },
            }),
        );
        });
    });

    // ── createPromptCommand ──────────────────────────────────────────────────

    describe('createPromptCommand', () => {
        it('creates and returns a new prompt command', async () => {
        const service = createService();
        const dto = {
            name: 'Nueva instrucción',
            type: ai_config_type.CREATE,
            display_order: 7,
            instruction: 'Instrucción personalizada.',
        };
        const created = {
            id: 'new-cmd',
            ...dto,
            created_at: new Date(),
            updated_at: new Date(),
            deleted_at: null,
        };
        mockPrisma.prompt_commands.create.mockResolvedValue(created);

        const result = await service.createPromptCommand(dto);

        expect(result).toMatchObject({
            id: 'new-cmd',
            name: 'Nueva instrucción',
        });
        expect(mockPrisma.prompt_commands.create).toHaveBeenCalledWith({
            data: dto,
        });
        });
    });

    // ── updatePromptCommand ──────────────────────────────────────────────────

    describe('updatePromptCommand', () => {
        it('updates and returns the prompt command', async () => {
        const service = createService();
        const existing = makePromptCommandRows(ai_config_type.CREATE)[0];
        const updated = { ...existing, instruction: 'Instrucción actualizada.' };

        mockPrisma.prompt_commands.findFirst.mockResolvedValue(existing);
        mockPrisma.prompt_commands.update.mockResolvedValue(updated);

        const result = await service.updatePromptCommand(existing.id, {
            instruction: 'Instrucción actualizada.',
        });

        expect(result.instruction).toBe('Instrucción actualizada.');
        });

        it('throws NotFoundException when command does not exist', async () => {
        const service = createService();
        mockPrisma.prompt_commands.findFirst.mockResolvedValue(null);

        await expect(
            service.updatePromptCommand('non-existent', { instruction: 'x' }),
        ).rejects.toBeInstanceOf(NotFoundException);
        });
    });

    // ── deletePromptCommand ──────────────────────────────────────────────────

    describe('deletePromptCommand', () => {
        it('soft-deletes the prompt command', async () => {
        const service = createService();
        const existing = makePromptCommandRows(ai_config_type.CREATE)[0];

        mockPrisma.prompt_commands.findFirst.mockResolvedValue(existing);
        mockPrisma.prompt_commands.update.mockResolvedValue({
            ...existing,
            deleted_at: new Date(),
        });

        await expect(
            service.deletePromptCommand(existing.id),
        ).resolves.toBeUndefined();
        expect(mockPrisma.prompt_commands.update).toHaveBeenCalledWith(
            expect.objectContaining({
            where: { id: existing.id },
            data: expect.objectContaining({ deleted_at: expect.any(Date) }),
            }),
        );
        });

        it('throws NotFoundException when command does not exist', async () => {
        const service = createService();
        mockPrisma.prompt_commands.findFirst.mockResolvedValue(null);

        await expect(
            service.deletePromptCommand('non-existent'),
        ).rejects.toBeInstanceOf(NotFoundException);
        });
    });
});
