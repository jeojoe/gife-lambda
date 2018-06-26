import { newDbClient } from './libs/database';
// import firebase from './libs/firebase';
import { success, failure } from './libs/httpResponse';

export const checkInvitationCode = async (event, context, callback) => {
  if (event.queryStringParameters && event.queryStringParameters.code) {
    const { code } = event.queryStringParameters;
    // Check if invitation code exists in db
    const db = newDbClient();
    try {
      await db.connect();
      const res = await db.query(
        `SELECT * FROM user_invitation
        WHERE code = $1`,
        [code],
      );
      // No code -> has code but used -> available
      if (!res.rows.length) {
        // Close conn before ending lambda execution
        await db.end();
        callback(null, failure(400, { msg: 'Invitation code not found!' }));
      } else if (res.rows[0].is_used) {
        await db.end();
        callback(null, failure(400, { msg: 'Invitation code is already used!' }));
      } else {
        await db.query(`
          UPDATE user_invitation SET is_used = true
          WHERE id = $1
        `, [res.rows[0].id]);
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

export const loginOAuth = async (event, context, callback) => {
  const dbClient = newDbClient();
  try {
    const { token, temp } = JSON.parse(event.body); // Temp uid
    if (!token) {
      callback(null, failure(400, {
        msg: 'Please provide required credentials',
      }));
      return;
    }
    await dbClient.connect();
    // const { uid } = await firebase.auth().verifyIdToken(token);
    const { uid } = temp;
    const res = await dbClient.query(`
      SELECT exists(SELECT 1 FROM users WHERE id = $1)
    `, [uid]);
    // If not exist -> insert new user
    if (!res.rows[0].exists) {
      await dbClient.query(`
        INSERT INTO users (id, username)
          VALUES ($1, $1)
      `, [uid]);
    }
    callback(null, success());
  } catch (err) {
    console.log(err);
    callback(null, failure(400, {
      msg: 'Invalid token',
    }));
  } finally {
    await dbClient.end();
  }
};
