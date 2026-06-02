import { TemplatesController } from './templates.controller';
import { TemplatesService } from './templates.service';
import { Action } from '../modules/auth/enum/actions';
import { Resource } from '../modules/auth/enum/resources';

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

  it('requires template retire permission for delete', () => {
    const metadata = Reflect.getMetadata(
      'permissions_metadata',
      TemplatesController.prototype.delete,
    );

    expect(metadata).toEqual({
      action: Action.TEMPLATE_CREATE_RETIRE,
      entity: Resource.TEMPLATES,
    });
  });

  it('requires template edit permission for update', () => {
    const metadata = Reflect.getMetadata(
      'permissions_metadata',
      TemplatesController.prototype.update,
    );

    expect(metadata).toEqual({
      action: Action.TEMPLATE_EDIT,
      entity: Resource.TEMPLATES,
    });
  });
});
