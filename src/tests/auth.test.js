import * as Auth from '../auth';

test('checkInvitationCode', (done) => {
  expect.assertions(2);

  const event = {
    body: { code: '000000' },
  };
  const context = 'context';
  const callback = (err, response) => {
    expect(err).toBeNull();
    expect(response.statusCode).toBe(200);
    done();
  };

  Auth.checkInvitationCode(event, context, callback);
});
