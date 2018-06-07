import { newDbClient } from './libs/database';
import { success, failure } from './libs/httpResponse';

export const getExplore = async (event, context, callback) => {
  const dbClient = newDbClient();
  try {
    await dbClient.connect();
    // Query spotlight & types
    const [spotlightResult, typesResult] = await dbClient.query(`
      -- Get spotlight --
      SELECT * FROM challenges WHERE is_spotlight = true;
      -- Get types
      SELECT * FROM challenge_types;
    `);
    // Query challenges grouped by type
    const challengesInTypesResult = await Promise.all(typesResult.rows.map(async (type) => {
      const challenges = await dbClient.query(`
        SELECT
          challenges.id as id,
          challenges.created_at as created_at,
          challenges.updated_at as updated_at,
          start_date,
          goal_description,
          banner_image_url,
          location_label,
          rating,
          reward_gife_points,
          reward_id,
          is_spotlight,
          is_sponsored,
          minimum_completed,
          challenges.title as title,
          challenge_types.title as type_title,
          challenge_durations.title as duration_title,
          duration_in_hours
        FROM challenges
          INNER JOIN challenge_types
            ON challenges.challenge_type_id = challenge_types.id
          INNER JOIN challenge_durations
            ON challenge_durations.id = challenges.challenge_duration_id
        WHERE challenges.challenge_type_id = $1
      `, [type.id]);

      return {
        type_id: type.id,
        type_title: type.title,
        challenges_count: challenges.rowCount,
        challenges: challenges.rows,
      };
    }));

    callback(null, success({
      spotlight: spotlightResult.rows,
      types: challengesInTypesResult,
    }));
  } catch (err) {
    console.log('Error: getExplore', err);
    callback(null, failure(500, {
      msg: 'Oops, Something went wrong! Please try again',
    }));
  } finally {
    await dbClient.end();
  }
};
