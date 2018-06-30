import { newDbClient } from './libs/database';
// import firebase from './libs/firebase';
import { success, failure } from './libs/httpResponse';

export const getChallenge = async (event, context, callback) => {
  const { challengeId } = event.pathParameters;
  if (!challengeId) {
    callback(null, failure(400, { msg: 'Please provide place id!' }));
    return;
  }

  const dbClient = newDbClient();
  try {
    await dbClient.connect();
    const resChallenge = await dbClient.query(`
      SELECT
        challenges.id as id,
        challenges.created_at as created_at,
        challenges.updated_at as updated_at,
        start_date,
        end_date,
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
      WHERE challenges.id = $1;
    `, [challengeId]);

    const resPlaces = await dbClient.query(`
      SELECT
        places.id as id,
        places.created_at as created_at,
        places.updated_at as updated_at,
        place_subregions.name as subregion_name,
        place_regions.name as region_name,
        place_provinces.name as province_name,
        place_types.title as type_title,
        places.name as name,
        places.rating as rating,
        places.banner_image_url as banner_image_url,
        price_min,
        price_max,
        open_hours,
        is_required,
        mission_description,
        has_special_gife_points,
        gife_points,
        challenge_places.is_sponsored as is_sponsored
      FROM challenges
        INNER JOIN challenge_places
          ON challenges.id = challenge_places.challenge_id
        INNER JOIN places
          ON places.id = challenge_places.place_id
        INNER JOIN place_subregions
          ON places.subregion_id = place_subregions.id
        INNER JOIN place_regions
          ON place_subregions.region_id = place_regions.id
        INNER JOIN place_provinces
          ON place_regions.province_id = place_provinces.id
        INNER JOIN place_types
          ON places.type_id = place_types.id
      WHERE challenges.id = $1;
    `, [challengeId]);

    callback(null, success({
      challenge: resChallenge.rows[0] || null,
      places: resPlaces.rows[0] ? resPlaces.rows : null,
    }));
  } catch (err) {
    console.log('Error: getExplore', err);
    callback(null, failure(500));
  } finally {
    await dbClient.end();
  }
};

export const getExplore = async (event, context, callback) => {
  const dbClient = newDbClient();
  try {
    await dbClient.connect();
    // Query spotlight & types
    const [spotlightResult, typesResult] = await dbClient.query(`
      -- Get spotlight --
      SELECT
        challenges.id as id,
        challenges.created_at as created_at,
        challenges.updated_at as updated_at,
        start_date,
        end_date,
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
      WHERE is_spotlight = true
      ;
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
          end_date,
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
    callback(err);
  } finally {
    await dbClient.end();
  }
};

export const startChallenge = async (event, context, callback) => {
  // Connect with database
  const db = newDbClient();
  try {
    const { challengeId, token, temp } = JSON.parse(event.body);
    if (!token && challengeId) {
      callback(null, failure(400, {
        msg: 'Please provide required data',
      }));
      return;
    }

    await db.connect();
    // const { uid } = await firebase.auth().verifyIdToken(token);
    const { uid } = temp;

    // Check if challenge is already started!
    const hasChallenge = await db.query(`
      SELECT * FROM user_challenges
      WHERE challenge_id = $1
        AND user_id = $2
      `, [challengeId, uid]);

    // No rows -> lets start challenge!
    if (!hasChallenge.rows.length) {
      // Insert challenge
      const challenge = await db.query(`
        INSERT INTO user_challenges(challenge_id, user_id)
        VALUES($1, $2)
        RETURNING id
      `, [challengeId, uid]);

      // Get places in challenge
      const places = await db.query(`
        SELECT * FROM challenge_places
        WHERE challenge_id = $1
      `, [challengeId]);

      // Insert places in challenge
      const insertPromises = places.rows.map(place => (
        db.query(`
            INSERT INTO user_challenge_places(user_challenge_id, place_id)
            VALUES($1, $2)
            RETURNING id
        `, [challenge.rows[0].id, place.place_id])
      ));

      await Promise.all(insertPromises);

      await db.end();
      callback(null, success());
    } else { // Have rows -> challenge already started!
      await db.end();
      callback(null, failure(400, { msg: 'Challenge is already started!' }));
    }
  } catch (err) {
    console.log('Error: startChallenge', err);
    await db.end();
    callback(null, failure(500, { msg: 'Internal server error! Please try again' }));
  }
};

export const test = (event, context, callback) => {
  callback(null, 'Hi');
};
