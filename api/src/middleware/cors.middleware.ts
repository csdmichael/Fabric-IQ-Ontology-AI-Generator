import cors from 'cors';

import { environment } from '../config/environment';

const allowedOrigins = environment.corsOrigin
  .split(',')
  .map((origin) => origin.trim())
  .filter((origin) => origin.length > 0);

export const corsMiddleware = cors({
  origin: (origin, callback) => {
    if (!origin) {
      callback(null, true);
      return;
    }

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true
});
