import cors from 'cors';

import { environment } from '../config/environment';

export const corsMiddleware = cors({
  origin: environment.corsOrigin.split(',').map((origin) => origin.trim()),
  credentials: true
});
