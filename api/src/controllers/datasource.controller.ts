import { Request, Response } from 'express';

import { FabricService } from '../services/fabric.service';
import { FabricConfig } from '../types/datasource.types';

const fabricService = new FabricService();

export class DatasourceController {
  async list(_request: Request, response: Response): Promise<void> {
    const dataSources = await fabricService.listDataSources();
    response.status(200).json(dataSources);
  }

  async getConfig(_request: Request, response: Response): Promise<void> {
    const config = await fabricService.getConfig();
    response.status(200).json(config);
  }

  async updateConfig(request: Request<unknown, unknown, FabricConfig>, response: Response): Promise<void> {
    const config = await fabricService.updateConfig(request.body);
    response.status(200).json(config);
  }
}
