import { ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ai_config_type } from '@prisma/client';
import type { area_name } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AiService } from './ai.service';
import { GenAIGenerateContentResponse } from './ai.types';

type ConfigValues = Record<string, string | undefined>;

function dec(value: number) {
  return { toNumber: () => value };
}

function createConfigService(values: ConfigValues): ConfigService {
  return {
    get: (key: string) => values[key],
  } as ConfigService;
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

function createService(values: ConfigValues = {}): AiService {
  return new AiService(
    createConfigService(values),
    mockPrisma as unknown as PrismaService,
  );
}

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
          'You are a Spanish copy editor for internal newsletters. Return only the improved text.',
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
        'You are a Spanish copywriter for internal newsletters.',
      created_at: new Date('2026-01-01'),
      updated_at: new Date('2026-01-01'),
      deleted_at: null,
    },
    {
      id: 'cmd-3',
      name: 'Task instruction',
      type,
      display_order: 2,
      instruction: 'Generate concise, brand-safe newsletter copy in Spanish.',
      created_at: new Date('2026-01-01'),
      updated_at: new Date('2026-01-01'),
      deleted_at: null,
    },
  ];
}

function mockAiProviderResponse(text: string): void {
  mockAiProviderJsonResponse({
    candidates: [
      {
        content: {
          parts: [{ text }],
        },
      },
    ],
  });
}

function mockAiProviderChunkedResponse(chunks: string[]): void {
  mockAiProviderJsonResponse(
    chunks.map((text) => ({
      candidates: [
        {
          content: {
            parts: [{ text }],
          },
        },
      ],
    })),
  );
}

function mockAiProviderJsonResponse(
  body: GenAIGenerateContentResponse,
): void {
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: () => Promise.resolve(body),
  }) as typeof fetch;
}

function mockAiProviderErrorResponse(status: number, error: unknown): void {
  global.fetch = jest.fn().mockResolvedValue({
    ok: false,
    status,
    json: () => Promise.resolve(error),
  }) as typeof fetch;
}

describe('AiService', () => {
  const originalFetch = global.fetch;
  const corporateArea = 'CORPORATE' as area_name;
  const configuredEnv = {
    AI_PROVIDER_CLIENT_ID: 'provider-client-id',
    AI_PROVIDER_CLIENT_SECRET: 'provider-client-secret',
    AI_PROVIDER_URL:
      'https://provider.example/v1/models/default-model/generateContent',
  };

  beforeEach(() => {
    jest.resetAllMocks();
    global.fetch = originalFetch;
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  it('improves text with the configured AI provider', async () => {
    const service = createService(configuredEnv);
    mockPrisma.prompt_commands.findMany.mockResolvedValue(
      makePromptCommandRows(ai_config_type.REGENERATE),
    );
    mockPrisma.ai_config.findFirst.mockResolvedValue(
      makeAiConfigRow(ai_config_type.REGENERATE),
    );
    mockAiProviderResponse('Texto mejorado');

    await expect(service.improveText({ text: 'Texto original' })).resolves.toEqual(
      {
        originalText: 'Texto original',
        improvedText: 'Texto mejorado',
      },
    );

    const fetchMock = global.fetch as jest.MockedFunction<typeof fetch>;
    const [url, requestInit] = fetchMock.mock.calls[0] ?? [];
    const fetchBody = JSON.parse(
      (requestInit?.body as string | undefined) ?? '{}',
    ) as {
      contents: Array<{ parts: Array<{ text: string }> }>;
      generationConfig: {
        temperature: number;
        topP: number;
        topK: number;
        maxOutputTokens: number;
      };
    };

    expect(url).toBe(configuredEnv.AI_PROVIDER_URL);
    expect(requestInit?.headers).toMatchObject({
      client_id: 'provider-client-id',
      client_secret: 'provider-client-secret',
      'Content-Type': 'application/json',
      Accept: 'application/json',
    });
    expect(fetchBody.contents[0]?.parts[0]?.text).toContain(
      'internal newsletters',
    );
  });

  it('requires provider url and credentials', async () => {
    const service = createService({
      AI_PROVIDER_CLIENT_ID: 'provider-client-id',
    });
    mockPrisma.prompt_commands.findMany.mockResolvedValue(
      makePromptCommandRows(ai_config_type.REGENERATE),
    );
    mockPrisma.ai_config.findFirst.mockResolvedValue(null);

    await expect(service.improveText({ text: 'Texto original' })).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });

  it('improves text with chunked provider responses', async () => {
    const service = createService(configuredEnv);
    mockPrisma.prompt_commands.findMany.mockResolvedValue(
      makePromptCommandRows(ai_config_type.REGENERATE),
    );
    mockPrisma.ai_config.findFirst.mockResolvedValue(
      makeAiConfigRow(ai_config_type.REGENERATE),
    );
    mockAiProviderChunkedResponse(['Texto ', 'mejorado']);

    await expect(service.improveText({ text: 'Texto original' })).resolves.toEqual(
      {
        originalText: 'Texto original',
        improvedText: 'Texto mejorado',
      },
    );
  });

  it('generates newsletter blocks with structured context through the provider', async () => {
    const service = createService(configuredEnv);

    mockPrisma.templates.findFirst.mockResolvedValue({
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
    mockPrisma.brand_kit.findFirst.mockResolvedValue({
      id: 'lumen-corporate',
      name: 'Lumen Corporate',
      brandkit_assets: [],
      color_palette: [],
      font_groups: null,
    });
    mockPrisma.ai_config.findFirst.mockResolvedValue(
      makeAiConfigRow(ai_config_type.CREATE),
    );
    mockPrisma.prompt_commands.findMany.mockResolvedValue(
      makePromptCommandRows(ai_config_type.CREATE),
    );
    mockAiProviderResponse(
      JSON.stringify({
        blocks: [
          {
            blockId: 'headerLeft-0-0-0-0',
            values: {
              title: 'Nuevo titulo generado',
            },
          },
        ],
      }),
    );

    const result = await service.generateNewsletter({
      area: corporateArea,
      templateId: 'weekly-brief',
      brandKitId: 'lumen-corporate',
      topic: 'Seguridad',
      objective: 'Informar avances',
      audience: 'Equipo interno',
      keyMessages: ['Mensaje clave'],
      tone: 'Claro',
      linksOrSources: [],
      assetIds: [],
    });

    expect(result.blocks).toHaveLength(1);
    expect(JSON.parse(result.blocks[0]?.content ?? '{}')).toMatchObject({
      title: 'Nuevo titulo generado',
    });
  });

  it('falls back to user content when the provider returns 404', async () => {
    const service = createService(configuredEnv);

    mockPrisma.templates.findFirst.mockResolvedValue({
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
    mockPrisma.brand_kit.findFirst.mockResolvedValue({
      id: 'lumen-corporate',
      name: 'Lumen Corporate',
      brandkit_assets: [],
      color_palette: [],
      font_groups: null,
    });
    mockPrisma.ai_config.findFirst.mockResolvedValue(
      makeAiConfigRow(ai_config_type.CREATE),
    );
    mockPrisma.prompt_commands.findMany.mockResolvedValue(
      makePromptCommandRows(ai_config_type.CREATE),
    );
    mockAiProviderErrorResponse(404, {
      error: 'Not Found',
    });

    const result = await service.generateNewsletter({
      area: corporateArea,
      templateId: 'weekly-brief',
      brandKitId: 'lumen-corporate',
      topic: 'Seguridad',
      objective: 'Informar avances',
      audience: 'Equipo interno',
      keyMessages: ['Mensaje clave'],
      tone: 'Claro',
      linksOrSources: [],
      assetIds: [],
    });

    expect(result.blocks).toHaveLength(1);
    expect(JSON.parse(result.blocks[0]?.content ?? '{}')).toMatchObject({
      title: 'Seguridad',
    });
  });
});
