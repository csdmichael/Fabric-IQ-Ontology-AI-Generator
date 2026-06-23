import { Request, Response } from 'express';

import { FabricService } from '../services/fabric.service';
import { DataSource, FabricConfig } from '../types/datasource.types';

const fabricService = new FabricService();

export class DatasourceController {
  async list(_request: Request, response: Response): Promise<void> {
    const dataSources = await fabricService.listDataSources();
    response.status(200).json(dataSources);
  }

  async create(request: Request<unknown, unknown, Omit<DataSource, 'id'>>, response: Response): Promise<void> {
    const { name, type, itemName } = request.body;
    if (!name || !type || !itemName) {
      response.status(400).json({ message: 'name, type, and itemName are required.' });
      return;
    }
    const dataSource = await fabricService.createDataSource(request.body);
    response.status(201).json(dataSource);
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
