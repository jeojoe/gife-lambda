import db from './libs/database';
import { success, failure } from './libs/httpResponse';

export const checkInvitationCode = async (event, context, callback) => {
  const { code } = event.pathParameters;
  // Check if invitation code exists
  try {
    await db.connect();
    const res = await db.query(`
      SELECT * FROM user_invitation
      WHERE user_invitation.code = '${code}'
    `);

    // No code -> has code but used -> available
    if (!res.rows.length) {
      // Close conn before ending lambda execution
      await db.end();
      callback(new Error('Invitation code not found!'), failure(400));
    } else if (res.rows[0].is_active !== 0) {
      await db.end();
      callback(new Error('Invitation code is already used!'), failure(400));
    } else {
      await db.query(`
        UPDATE user_invitation SET is_active = 1
        WHERE id = '${res.rows[0].id}'
      `);
      await db.end();
      callback(null, success());
    }
  } catch (err) {
    callback(new Error('Internal server error! Please try again'), failure(500));
  }
};
