import { dbPromise } from "./db.js";

async function getUserByUsername(username) {
  const db = await dbPromise;

  return db.get(
    `
    SELECT id, username, name, salt, password_hash
    FROM users
    WHERE username = ?
    `,
    username
  );
}

async function getUserById(id) {
  const db = await dbPromise;

  return db.get(
    `
    SELECT id, username, name
    FROM users
    WHERE id = ?
    `,
    id
  );
}

async function getStations() {
  const db = await dbPromise;

  return db.all(
    `
    SELECT id, name, x, y
    FROM stations
    ORDER BY id
    `
  );
}

async function getLines() {
  const db = await dbPromise;

  return db.all(
    `
    SELECT id, name, color
    FROM lines
    ORDER BY id
    `
  );
}

async function getLineStations() {
  const db = await dbPromise;

  return db.all(
    `
    SELECT 
      ls.line_id AS lineId,
      l.name AS lineName,
      l.color AS lineColor,
      ls.station_id AS stationId,
      s.name AS stationName,
      s.x,
      s.y,
      ls.position
    FROM line_stations ls
    JOIN lines l ON ls.line_id = l.id
    JOIN stations s ON ls.station_id = s.id
    ORDER BY ls.line_id, ls.position
    `
  );
}

async function getSegments() {
  const db = await dbPromise;

  return db.all(
    `
    SELECT 
      seg.id,
      seg.station1_id AS station1Id,
      s1.name AS station1Name,
      seg.station2_id AS station2Id,
      s2.name AS station2Name
    FROM segments seg
    JOIN stations s1 ON seg.station1_id = s1.id
    JOIN stations s2 ON seg.station2_id = s2.id
    ORDER BY seg.id
    `
  );
}

async function getSegmentLines() {
  const db = await dbPromise;

  return db.all(
    `
    SELECT 
      sl.segment_id AS segmentId,
      sl.line_id AS lineId,
      l.name AS lineName,
      l.color AS lineColor
    FROM segment_lines sl
    JOIN lines l ON sl.line_id = l.id
    ORDER BY sl.segment_id, sl.line_id
    `
  );
}

async function getEvents() {
  const db = await dbPromise;

  return db.all(
    `
    SELECT id, description, effect
    FROM events
    ORDER BY id
    `
  );
}

async function getFullNetwork() {
  const stations = await getStations();
  const lines = await getLines();
  const lineStations = await getLineStations();
  const segments = await getSegments();
  const segmentLines = await getSegmentLines();

  return {
    stations,
    lines,
    lineStations,
    segments,
    segmentLines
  };
}

async function getPlanningNetwork() {
  const stations = await getStations();
  const segments = await getSegments();

  return {
    stations,
    segments
  };
}

async function getRanking() {
  const db = await dbPromise;

  return db.all(
    `
    SELECT 
      u.id AS userId,
      u.username,
      u.name,
      MAX(g.score) AS bestScore
    FROM users u
    JOIN games g ON u.id = g.user_id
    WHERE g.status = 'completed'
    GROUP BY u.id, u.username, u.name
    ORDER BY bestScore DESC, u.name ASC
    `
  );
}

export {
  getUserByUsername,
  getUserById,
  getStations,
  getLines,
  getLineStations,
  getSegments,
  getSegmentLines,
  getEvents,
  getFullNetwork,
  getPlanningNetwork,
  getRanking
};