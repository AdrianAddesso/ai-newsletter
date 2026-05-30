import { ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { AiService } from './ai.service';

type ConfigValues = Record<string, string | undefined>;

function createConfigService(values: ConfigValues): ConfigService {
  return {
    get: (key: string) => values[key],
  } as ConfigService;
}

function createService(
  values: ConfigValues = {},
  prismaOverrides: Partial<PrismaService> = {},
) {
  const prisma = {
    templates: {
      findFirst: jest.fn(),
    },
    brand_kit: {
      findFirst: jest.fn(),
    },
    ...prismaOverrides,
  } as unknown as PrismaService;

  return {
    service: new AiService(createConfigService(values), prisma),
    prisma,
  };
}

describe('AiService', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.resetAllMocks();
  });

  it('throws when GenIA credentials are not configured', async () => {
    const { service } = createService();

    await expect(
      service.improveText({ text: 'Texto de prueba' }),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
  });

  it('improves text with GenIA', async () => {
    const { service, prisma } = createService({
      CLIENT_ID: 'client-id',
      CLIENT_SECRET: 'client-secret',
      GENAI_URL: process.env.GENAI_URL,
    });

    (prisma.templates.findFirst as jest.Mock).mockResolvedValue({
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
    (prisma.brand_kit.findFirst as jest.Mock).mockResolvedValue({
      id: 'lumen-corporate',
      name: 'Lumen Corporate',
      brandkit_assets: [],
      color_palette: [],
      font_groups: null,
    });

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          candidates: [
            {
              content: {
                parts: [{ text: 'Texto mejorado' }],
              },
            },
          ],
        }),
    }) as typeof fetch;

    await expect(
      service.improveText({ text: 'Texto original' }),
    ).resolves.toEqual({
      originalText: 'Texto original',
      improvedText: 'Texto mejorado',
    });

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

    expect(url).toBe(process.env.GENAI_URL);
    expect(requestInit?.headers).toMatchObject({
      client_id: 'client-id',
      client_secret: 'client-secret',
      'Content-Type': 'application/json',
      Accept: 'application/json',
    });
    expect(fetchBody.contents[0].parts[0].text).toContain('Text to improve:');
    expect(fetchBody.generationConfig).toEqual({
      temperature: 0.1,
      topP: 0.8,
      topK: 20,
      maxOutputTokens: 4000,
    });
  });

  it('generates newsletter blocks with structured context through GenIA', async () => {
    const { service } = createService({
      CLIENT_ID: 'client-id',
      CLIENT_SECRET: 'client-secret',
      GENAI_URL: process.env.GENAI_URL,
    });

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          candidates: [
            {
              content: {
                parts: [
                  {
                    text: JSON.stringify({
                      blocks: [
                        {
                          blockId: 'headerLeft-0-0-0-0',
                          values: {
                            title: 'Nuevo titulo generado',
                            subtitle: 'Bajada generada',
                            logoAsset: '',
                            fontSize: '1rem',
                            typographyStyle: 'bold',
                            fontFamily: 'Arial',
                          },
                        },
                      ],
                    }),
                  },
                ],
              },
            },
          ],
        }),
    }) as typeof fetch;

    await expect(
      service.generateNewsletter({
        area: 'COMUNICACION_INTERNA',
        templateId: 'weekly-brief',
        brandKitId: 'lumen-corporate',
        topic: 'Seguridad',
        objective: 'Informar avances',
        audience: 'Equipo interno',
        keyMessages: ['Mensaje clave'],
        tone: 'Claro',
        linksOrSources: [],
        assetIds: [],
      }),
    ).resolves.toMatchObject({
      blocks: [
        {
          id: 'headerLeft-0-0-0-0',
          type: 'headerLeft',
        },
      ],
    });

    const fetchMock = global.fetch as jest.MockedFunction<typeof fetch>;
    const requestInit = fetchMock.mock.calls[0]?.[1];
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

    expect(fetchBody.contents[0].parts[0].text).toContain(
      '"topic":"Seguridad"',
    );
    expect(fetchBody.contents[0].parts[0].text).toContain(
      '"templateId":"weekly-brief"',
    );
    expect(fetchBody.contents[0].parts[0].text).toContain(
      '"brandKitId":"lumen-corporate"',
    );
    expect(fetchBody.generationConfig).toEqual({
      temperature: 0.5,
      topP: 0.8,
      topK: 20,
      maxOutputTokens: 4000,
    });
  });
});
