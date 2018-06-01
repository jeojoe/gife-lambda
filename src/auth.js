import db from './libs/database';
import { success, failure } from './libs/httpResponse';

export const checkInvitationCode = async (event, context, callback) => {
  await db.connect();
  const res = await db.query('SELECT * FROM user_invitation');
  await db.end();

  console.log('this is result. | ', res.rows);
  callback(null, success());
};
