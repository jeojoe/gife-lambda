import db from './libs/database';
import { success, failure } from './libs/httpResponse';

export const checkInvitationCode = async (event, context, callback) => {
  if (event.queryStringParameters && event.queryStringParameters.code) {
    const { code } = event.queryStringParameters;
    // Check if invitation code exists in db
    try {
      await db.connect();
      const res = await db.query(
        `SELECT * FROM user_invitation
        WHERE user_invitation.code = $1`,
        [code],
      );
      // No code -> has code but used -> available
      if (!res.rows.length) {
        // Close conn before ending lambda execution
        await db.end();
        callback(null, failure(400, { msg: 'Invitation code not found!' }));
      } else if (res.rows[0].is_active !== 0) {
        await db.end();
        callback(null, failure(400, { msg: 'Invitation code is already used!' }));
      } else {
        await db.query(`
          UPDATE user_invitation SET is_active = 1
          WHERE id = '${res.rows[0].id}'
        `);
        await db.end();
        callback(null, success());
      }
    } catch (err) {
      callback(null, failure(500, { msg: 'Internal server error! Please try again' }));
    }
  } else {
    callback(null, failure(400, { msg: 'No invitation code provided!' }));
  }
};
