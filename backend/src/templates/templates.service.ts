import { Injectable } from '@nestjs/common';

@Injectable()
export class TemplatesService {
  constructor() {}

  getAll(): string {
    return 'Desde templates';
  }

  getById(id: string) {
    return 'Desde templates con ID' + id;
  }

  create() {
    return 'Desde templates';
  }

  update(id: string) {
    return 'Desde update templates con ID' + id;
  }

  delete(id: string) {
    return 'Desde delete templates con ID' + id;
  }

  updateStatus(id: string) {
    return 'Desde update status templates con ID' + id;
  }

  defineBlocks(id: string) {
    return 'Desde define blocks templates con ID' + id;
  }

  getAssets(templateId: string) {
    return `Desde assets templates con ID ${templateId}`;
  }

  addAsset(templateId: string) {
    return `Desde add asset templates con ID ${templateId}`;
  }

  updateAsset(templateId: string, assetId: string) {
    return `Desde update asset templates con ID ${templateId} y asset ID ${assetId}`;
  }
}
