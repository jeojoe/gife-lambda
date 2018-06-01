import * as Auth from '../auth';

test('checkInvitationCode', async (done) => {
  const event = {
    body: { code: '000000' },
  };
  const context = 'context';
  const callback = (err, response) => {
    expect(err).toBeNull();
    expect(response.statusCode).toBe(200);
    done();
  };

  await Auth.checkInvitationCode(event, context, callback);
});
