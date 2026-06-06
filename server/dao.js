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

async function createGame(userId, startStationId, destinationStationId, minimumDistance) {
  const db = await dbPromise;

  const result = await db.run(
    `
      INSERT INTO games
        (user_id, start_station_id, destination_station_id, status, score, minimum_distance)
      VALUES (?, ?, ?, 'planning', 20, ?)
    `,
    userId,
    startStationId,
    destinationStationId,
    minimumDistance
  );

  return getGameById(result.lastID, userId);
}

async function getGameById(gameId, userId) {
  const db = await dbPromise;

  return db.get(
    `
    SELECT 
      g.id,
      g.user_id AS userId,
      g.start_station_id AS startStationId,
      start.name AS startStationName,
      g.destination_station_id AS destinationStationId,
      dest.name AS destinationStationName,
      g.status,
      g.score,
      g.created_at AS createdAt,
      g.minimum_distance AS minimumDistance
    FROM games g
    JOIN stations start ON g.start_station_id = start.id
    JOIN stations dest ON g.destination_station_id = dest.id
    WHERE g.id = ? AND g.user_id = ?
    `,
    gameId,
    userId
  );
}

function buildAdjacencyList(segments) {
  const adjacency = new Map();

  for (const segment of segments) {
    if (!adjacency.has(segment.station1Id)) {
      adjacency.set(segment.station1Id, []);
    }

    if (!adjacency.has(segment.station2Id)) {
      adjacency.set(segment.station2Id, []);
    }

    adjacency.get(segment.station1Id).push(segment.station2Id);
    adjacency.get(segment.station2Id).push(segment.station1Id);
  }

  return adjacency;
}

function getShortestDistance(startStationId, destinationStationId, segments) {
  const adjacency = buildAdjacencyList(segments);
  const queue = [{ stationId: startStationId, distance: 0 }];
  const visited = new Set([startStationId]);

  while (queue.length > 0) {
    const current = queue.shift();

    if (current.stationId === destinationStationId) {
      return current.distance;
    }

    const neighbors = adjacency.get(current.stationId) || [];

    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        queue.push({
          stationId: neighbor,
          distance: current.distance + 1
        });
      }
    }
  }

  return null;
}

async function selectRandomStartAndDestination() {
  const stations = await getStations();
  const segments = await getSegments();

  const validPairs = [];

  for (const start of stations) {
    for (const destination of stations) {
      if (start.id !== destination.id) {
        const distance = getShortestDistance(start.id, destination.id, segments);

        if (distance !== null && distance >= 3) {
          validPairs.push({
            startStationId: start.id,
            startStationName: start.name,
            destinationStationId: destination.id,
            destinationStationName: destination.name,
            distance
          });
        }
      }
    }
  }

  if (validPairs.length === 0) {
    throw new Error("No valid start/destination pair found");
  }

  const randomIndex = Math.floor(Math.random() * validPairs.length);
  return validPairs[randomIndex];
}

async function updateGameAsInvalid(gameId, userId) {
  const db = await dbPromise;

  await db.run(
    `
    UPDATE games
    SET status = 'invalid', score = 0
    WHERE id = ? AND user_id = ?
    `,
    gameId,
    userId
  );

  return getGameById(gameId, userId);
}

async function updateGameAsCompleted(gameId, userId, score) {
  const db = await dbPromise;

  const storedScore = Math.max(0, score);

  await db.run(
    `
    UPDATE games
    SET status = 'completed', score = ?
    WHERE id = ? AND user_id = ?
    `,
    storedScore,
    gameId,
    userId
  );

  return getGameById(gameId, userId);
}

function normalizeSegmentKey(stationAId, stationBId) {
  const first = Math.min(stationAId, stationBId);
  const second = Math.max(stationAId, stationBId);

  return `${first}-${second}`;
}

async function getLineIdBySegmentId(segmentId) {
  const db = await dbPromise;

  const row = await db.get(
    `
    SELECT line_id AS lineId
    FROM segment_lines
    WHERE segment_id = ?
    `,
    segmentId
  );

  return row ? row.lineId : null;
}

async function isInterchangeStation(stationId) {
  const db = await dbPromise;

  const row = await db.get(
    `
    SELECT COUNT(DISTINCT line_id) AS lineCount
    FROM line_stations
    WHERE station_id = ?
    `,
    stationId
  );

  return row.lineCount > 1;
}

async function validateLineChanges(selectedSegmentIds, visitedStations) {
  for (let i = 1; i < selectedSegmentIds.length; i++) {
    const previousSegmentId = selectedSegmentIds[i - 1];
    const currentSegmentId = selectedSegmentIds[i];

    const previousLineId = await getLineIdBySegmentId(previousSegmentId);
    const currentLineId = await getLineIdBySegmentId(currentSegmentId);

    if (previousLineId !== currentLineId) {
      const changeStationId = visitedStations[i];
      const canChangeLine = await isInterchangeStation(changeStationId);

      if (!canChangeLine) {
        return {
          valid: false,
          reason: "Line change is allowed only at interchange stations"
        };
      }
    }
  }

  return {
    valid: true,
    reason: "Line changes are valid"
  };
}


async function submitRoute(gameId, userId, selectedSegmentIds) {
  const game = await getGameById(gameId, userId);

  if (!game) {
    return {
      valid: false,
      reason: "Game not found",
      game: null
    };
  }

  if (game.status !== "planning") {
    return {
      valid: false,
      reason: "Game is not in planning status",
      game
    };
  }

  if (!Array.isArray(selectedSegmentIds) || selectedSegmentIds.length === 0) {
    const invalidGame = await updateGameAsInvalid(gameId, userId);

    return {
      valid: false,
      reason: "Route is empty",
      game: invalidGame
    };
  }

  const uniqueSegmentIds = new Set(selectedSegmentIds);

  if (uniqueSegmentIds.size !== selectedSegmentIds.length) {
    const invalidGame = await updateGameAsInvalid(gameId, userId);

    return {
      valid: false,
      reason: "A segment was selected more than once",
      game: invalidGame
    };
  }

  const allSegments = await getSegments();
  const segmentById = new Map(allSegments.map((segment) => [segment.id, segment]));

  const selectedSegments = [];

  for (const segmentId of selectedSegmentIds) {
    const segment = segmentById.get(segmentId);

    if (!segment) {
      const invalidGame = await updateGameAsInvalid(gameId, userId);

      return {
        valid: false,
        reason: `Segment ${segmentId} does not exist`,
        game: invalidGame
      };
    }

    selectedSegments.push(segment);
  }

  let currentStationId = game.startStationId;
  const visitedStations = [currentStationId];

  for (const segment of selectedSegments) {
    if (segment.station1Id === currentStationId) {
      currentStationId = segment.station2Id;
    } else if (segment.station2Id === currentStationId) {
      currentStationId = segment.station1Id;
    } else {
      const invalidGame = await updateGameAsInvalid(gameId, userId);

      return {
        valid: false,
        reason: "Selected segments are not connected in sequence",
        game: invalidGame
      };
    }

    visitedStations.push(currentStationId);
  }

  if (visitedStations[0] !== game.startStationId) {
    const invalidGame = await updateGameAsInvalid(gameId, userId);

    return {
      valid: false,
      reason: "Route does not start from the assigned start station",
      game: invalidGame
    };
  }

  if (currentStationId !== game.destinationStationId) {
    const invalidGame = await updateGameAsInvalid(gameId, userId);

    return {
      valid: false,
      reason: "Route does not reach the assigned destination station",
      game: invalidGame
    };
  }

    const lineChangeValidation = await validateLineChanges(
     selectedSegmentIds,
     visitedStations
   );

  if (!lineChangeValidation.valid) {
   const invalidGame = await updateGameAsInvalid(gameId, userId);

  return {
    valid: false,
    reason: lineChangeValidation.reason,
    game: invalidGame
    };
  }
    const execution = await executeValidRoute(
     gameId,
     userId,
     visitedStations,
        selectedSegmentIds
   );

    return {
        valid: true,
        reason: "Route is valid",
        game: execution.game,
        route: {
        segmentIds: selectedSegmentIds,
        stationIds: visitedStations
    },
  steps: execution.steps
    };
};
async function insertGameStep(
  gameId,
  stepNumber,
  fromStationId,
  toStationId,
  eventId,
  coinsAfterStep
) {
  const db = await dbPromise;

  await db.run(
    `
    INSERT INTO game_steps
      (game_id, step_number, from_station_id, to_station_id, event_id, coins_after_step)
    VALUES (?, ?, ?, ?, ?, ?)
    `,
    gameId,
    stepNumber,
    fromStationId,
    toStationId,
    eventId,
    coinsAfterStep
  );
}

async function getGameSteps(gameId) {
  const db = await dbPromise;

  return db.all(
    `
    SELECT
      gs.id,
      gs.game_id AS gameId,
      gs.step_number AS stepNumber,
      gs.from_station_id AS fromStationId,
      from_station.name AS fromStationName,
      gs.to_station_id AS toStationId,
      to_station.name AS toStationName,
      e.id AS eventId,
      e.description AS eventDescription,
      e.effect AS eventEffect,
      gs.coins_after_step AS coinsAfterStep
    FROM game_steps gs
    JOIN stations from_station ON gs.from_station_id = from_station.id
    JOIN stations to_station ON gs.to_station_id = to_station.id
    JOIN events e ON gs.event_id = e.id
    WHERE gs.game_id = ?
    ORDER BY gs.step_number
    `,
    gameId
  );
}

async function executeValidRoute(gameId, userId, routeStationIds, routeSegmentIds) {
  const events = await getEvents();

  if (events.length === 0) {
    throw new Error("No events available");
  }

  let coins = 20;

  for (let i = 0; i < routeSegmentIds.length; i++) {
    const randomIndex = Math.floor(Math.random() * events.length);
    const event = events[randomIndex];

    coins += event.effect;

    await insertGameStep(
      gameId,
      i + 1,
      routeStationIds[i],
      routeStationIds[i + 1],
      event.id,
      coins
    );
  }

  const completedGame = await updateGameAsCompleted(gameId, userId, coins);
  const steps = await getGameSteps(gameId);

  return {
    game: completedGame,
    steps
  };
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
  getRanking,
  createGame,
  getGameById,
  selectRandomStartAndDestination,
  getShortestDistance,
  buildAdjacencyList,
  updateGameAsInvalid,
  updateGameAsCompleted,
  normalizeSegmentKey,
  submitRoute,
  insertGameStep,
  getGameSteps,
  executeValidRoute,
  getLineIdBySegmentId,
  isInterchangeStation,
  validateLineChanges
};