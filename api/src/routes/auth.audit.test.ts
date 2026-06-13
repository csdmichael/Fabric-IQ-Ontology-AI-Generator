import request from 'supertest';

import { app } from '../index';

describe('auth login audit', () => {
  it('records failed and successful OTP logins', async () => {
    const email = 'myaacoub@microsoft.com';

    const otpRequest = await request(app)
      .post('/api/auth/otp/request')
      .send({ email });

    expect(otpRequest.status).toBe(200);
    expect(otpRequest.body.previewCode).toEqual(expect.any(String));

    const wrongCode = otpRequest.body.previewCode === '000000' ? '999999' : '000000';
    const failedLogin = await request(app)
      .post('/api/auth/otp/verify')
      .send({ email, code: wrongCode });

    expect(failedLogin.status).toBe(401);

    const successfulLogin = await request(app)
      .post('/api/auth/otp/verify')
      .send({ email, code: otpRequest.body.previewCode });

    expect(successfulLogin.status).toBe(200);
    expect(successfulLogin.body.token).toEqual(expect.any(String));

    const audit = await request(app)
      .get('/api/auth/audit')
      .set('Authorization', `******;

    expect(audit.status).toBe(200);
    expect(audit.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          email,
          method: 'otp',
          outcome: 'failure',
          reason: 'invalid_or_expired_otp'
        }),
        expect.objectContaining({
          email,
          method: 'otp',
          outcome: 'success',
          userId: expect.any(String)
        })
      ])
    );
  });
});
