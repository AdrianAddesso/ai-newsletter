import { ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AiService } from './ai.service';

type ConfigValues = Record<string, string | undefined>;

function createConfigService(values: ConfigValues): ConfigService {
  return {
    get: (key: string) => values[key],
  } as ConfigService;
}

function createService(values: ConfigValues = {}) {
  return {
    service: new AiService(createConfigService(values)),
  };
}

describe('AiService', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.resetAllMocks();
  });

  it('throws when Nestle GenIA credentials are not configured', async () => {
    const { service } = createService();

    await expect(
      service.improveText({ text: 'Texto de prueba' }),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
  });

  it('improves text with Nestle GenIA', async () => {
    const { service } = createService({
      CLIENT_ID: 'client-id',
      CLIENT_SECRET: 'client-secret',
      NESTLE_GENIA_URL:
        'https://eur-sdr-int-pub.nestle.com/api/dv-exp-sandbox-openai-api/1/genai/GCP/gemini-2.0-flash-001/generateContent',
    });

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          candidates: [
            {
              content: {
                parts: [{ text: 'Texto mejorado por Nestle' }],
              },
            },
          ],
        }),
    }) as typeof fetch;

    await expect(
      service.improveText({ text: 'Texto original' }),
    ).resolves.toEqual({
      originalText: 'Texto original',
      improvedText: 'Texto mejorado por Nestle',
    });

    const fetchMock = global.fetch as jest.MockedFunction<typeof fetch>;
    const [url, requestInit] = fetchMock.mock.calls[0] ?? [];
    const fetchBody = JSON.parse((requestInit?.body as string | undefined) ?? '{}') as {
      contents: Array<{ parts: Array<{ text: string }> }>;
      generationConfig: { temperature: number; topP: number; topK: number; maxOutputTokens: number };
    };

    expect(url).toBe(
      'https://eur-sdr-int-pub.nestle.com/api/dv-exp-sandbox-openai-api/1/genai/GCP/gemini-2.0-flash-001/generateContent',
    );
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

  it('generates newsletter blocks with structured context through Nestle GenIA', async () => {
    const { service } = createService({
      CLIENT_ID: 'client-id',
      CLIENT_SECRET: 'client-secret',
      NESTLE_GENIA_URL:
        'https://eur-sdr-int-pub.nestle.com/api/dv-exp-sandbox-openai-api/1/genai/GCP/gemini-2.0-flash-001/generateContent',
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
                          id: 'headline',
                          name: 'Titulo principal',
                          text: 'Nuevo titulo generado',
                          backgroundColor: '#97CAEB',
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
        brandKitId: 'nestle-corporate',
        topic: 'Seguridad',
        objective: 'Informar avances',
        audience: 'Equipo interno',
        keyMessages: ['Mensaje clave'],
        tone: 'Claro',
        linksOrSources: [],
        assetIds: [],
      }),
    ).resolves.toEqual({
      blocks: [
        {
          id: 'headline',
          name: 'Titulo principal',
          text: 'Nuevo titulo generado',
          backgroundColor: '#97CAEB',
        },
      ],
    });

    const fetchMock = global.fetch as jest.MockedFunction<typeof fetch>;
    const requestInit = fetchMock.mock.calls[0]?.[1];
    const fetchBody = JSON.parse((requestInit?.body as string | undefined) ?? '{}') as {
      contents: Array<{ parts: Array<{ text: string }> }>;
      generationConfig: { temperature: number; topP: number; topK: number; maxOutputTokens: number };
    };

    expect(fetchBody.contents[0].parts[0].text).toContain('"topic":"Seguridad"');
    expect(fetchBody.contents[0].parts[0].text).toContain(
      '"templateId":"weekly-brief"',
    );
    expect(fetchBody.contents[0].parts[0].text).toContain(
      '"brandKitId":"nestle-corporate"',
    );
    expect(fetchBody.generationConfig).toEqual({
      temperature: 0.5,
      topP: 0.8,
      topK: 20,
      maxOutputTokens: 4000,
    });
  });
});
