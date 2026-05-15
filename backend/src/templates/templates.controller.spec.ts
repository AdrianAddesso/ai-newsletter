import { TemplatesController } from './templates.controller';
import { TemplatesService } from './templates.service';

describe('TemplatesController', () => {
  let controller: TemplatesController;

  beforeEach(() => {
    const templatesService = {
      getAll: jest.fn(),
    } as unknown as TemplatesService;

    controller = new TemplatesController(templatesService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
