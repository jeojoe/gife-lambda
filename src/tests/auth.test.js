import * as Auth from '../auth';
import mockEvent from '../mocks/checkInvitationCode.json';

test('checkInvitationCode', (done) => {
  expect.assertions(2);

  const event = mockEvent;
  const context = 'context';
  const callback = (err, response) => {
    expect(err).toBeNull();
    expect(response.statusCode).toBe(200);
    done();
  };

  Auth.checkInvitationCode(event, context, callback);
});
