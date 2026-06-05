import sqlite3 from "sqlite3";
import { open } from "sqlite";
import crypto from "crypto";

const DB_FILE = "./last-race.sqlite";

function hashPassword(password, salt) {
  return crypto
    .pbkdf2Sync(password, salt, 100000, 64, "sha512")
    .toString("hex");
}

async function createSchema(db) {
  await db.exec(`
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      salt TEXT NOT NULL,
      password_hash TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS stations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      x INTEGER NOT NULL,
      y INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS lines (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      color TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS line_stations (
      line_id INTEGER NOT NULL,
      station_id INTEGER NOT NULL,
      position INTEGER NOT NULL,
      PRIMARY KEY (line_id, station_id),
      UNIQUE (line_id, position),
      FOREIGN KEY (line_id) REFERENCES lines(id),
      FOREIGN KEY (station_id) REFERENCES stations(id)
    );

    CREATE TABLE IF NOT EXISTS segments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      station1_id INTEGER NOT NULL,
      station2_id INTEGER NOT NULL,
      UNIQUE (station1_id, station2_id),
      FOREIGN KEY (station1_id) REFERENCES stations(id),
      FOREIGN KEY (station2_id) REFERENCES stations(id),
      CHECK (station1_id <> station2_id)
    );

    CREATE TABLE IF NOT EXISTS segment_lines (
      segment_id INTEGER NOT NULL,
      line_id INTEGER NOT NULL,
      PRIMARY KEY (segment_id, line_id),
      FOREIGN KEY (segment_id) REFERENCES segments(id),
      FOREIGN KEY (line_id) REFERENCES lines(id)
    );

    CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      description TEXT NOT NULL,
      effect INTEGER NOT NULL CHECK (effect >= -4 AND effect <= 4)
    );

    CREATE TABLE IF NOT EXISTS games (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      start_station_id INTEGER NOT NULL,
      destination_station_id INTEGER NOT NULL,
      status TEXT NOT NULL,
      score INTEGER NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (start_station_id) REFERENCES stations(id),
      FOREIGN KEY (destination_station_id) REFERENCES stations(id)
    );

    CREATE TABLE IF NOT EXISTS game_steps (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      game_id INTEGER NOT NULL,
      step_number INTEGER NOT NULL,
      from_station_id INTEGER NOT NULL,
      to_station_id INTEGER NOT NULL,
      event_id INTEGER NOT NULL,
      coins_after_step INTEGER NOT NULL,
      FOREIGN KEY (game_id) REFERENCES games(id),
      FOREIGN KEY (from_station_id) REFERENCES stations(id),
      FOREIGN KEY (to_station_id) REFERENCES stations(id),
      FOREIGN KEY (event_id) REFERENCES events(id)
    );
  `);
}

async function seedUsers(db) {
  const users = [
    {
      id: 1,
      username: "alice@example.com",
      name: "Alice",
      password: "Password123!"
    },
    {
      id: 2,
      username: "bob@example.com",
      name: "Bob",
      password: "Password123!"
    },
    {
      id: 3,
      username: "charlie@example.com",
      name: "Charlie",
      password: "Password123!"
    }
  ];

  for (const user of users) {
    const existing = await db.get(
      "SELECT id FROM users WHERE username = ?",
      user.username
    );

    if (!existing) {
      const salt = crypto.randomBytes(16).toString("hex");
      const passwordHash = hashPassword(user.password, salt);

      await db.run(
        `
        INSERT INTO users (id, username, name, salt, password_hash)
        VALUES (?, ?, ?, ?, ?)
        `,
        user.id,
        user.username,
        user.name,
        salt,
        passwordHash
      );
    }
  }
}

async function seedStations(db) {
  const stations = [
    [1, "Central Station", 100, 100],
    [2, "Museum Gate", 250, 100],
    [3, "Old Market", 400, 100],
    [4, "River Park", 550, 100],

    [5, "North Square", 250, 20],
    [6, "City Hall", 250, 250],
    [7, "East Terminal", 400, 250],

    [8, "West Garden", 100, 350],
    [9, "University", 400, 350],
    [10, "South Bridge", 550, 350],

    [11, "Harbor Point", 100, 250],
    [12, "Airport Road", 550, 250]
  ];

  for (const station of stations) {
    await db.run(
      `
      INSERT OR IGNORE INTO stations (id, name, x, y)
      VALUES (?, ?, ?, ?)
      `,
      station
    );
  }
}

async function seedLines(db) {
  const lines = [
    [1, "Red Line", "red"],
    [2, "Blue Line", "blue"],
    [3, "Green Line", "green"],
    [4, "Yellow Line", "gold"]
  ];

  for (const line of lines) {
    await db.run(
      `
      INSERT OR IGNORE INTO lines (id, name, color)
      VALUES (?, ?, ?)
      `,
      line
    );
  }
}

async function seedLineStations(db) {
  const lineStations = [
    // Red Line
    [1, 1, 1],
    [1, 2, 2],
    [1, 3, 3],
    [1, 4, 4],

    // Blue Line
    [2, 5, 1],
    [2, 2, 2],
    [2, 6, 3],
    [2, 7, 4],

    // Green Line
    [3, 8, 1],
    [3, 3, 2],
    [3, 9, 3],
    [3, 10, 4],

    // Yellow Line
    [4, 11, 1],
    [4, 6, 2],
    [4, 9, 3],
    [4, 12, 4]
  ];

  for (const item of lineStations) {
    await db.run(
      `
      INSERT OR IGNORE INTO line_stations (line_id, station_id, position)
      VALUES (?, ?, ?)
      `,
      item
    );
  }
}

async function seedSegments(db) {
  const segments = [
    [1, 1, 2],
    [2, 2, 3],
    [3, 3, 4],

    [4, 2, 5],
    [5, 2, 6],
    [6, 6, 7],

    [7, 3, 8],
    [8, 3, 9],
    [9, 9, 10],

    [10, 6, 11],
    [11, 6, 9],
    [12, 9, 12]
  ];

  for (const segment of segments) {
    await db.run(
      `
      INSERT OR IGNORE INTO segments (id, station1_id, station2_id)
      VALUES (?, ?, ?)
      `,
      segment
    );
  }

  const segmentLines = [
    [1, 1],
    [2, 1],
    [3, 1],

    [4, 2],
    [5, 2],
    [6, 2],

    [7, 3],
    [8, 3],
    [9, 3],

    [10, 4],
    [11, 4],
    [12, 4]
  ];

  for (const segmentLine of segmentLines) {
    await db.run(
      `
      INSERT OR IGNORE INTO segment_lines (segment_id, line_id)
      VALUES (?, ?)
      `,
      segmentLine
    );
  }
}

async function seedEvents(db) {
  const events = [
    [1, "Quiet journey", 0],
    [2, "Wrong platform", -2],
    [3, "Kind passenger", 1],
    [4, "Ticket inspection fine", -4],
    [5, "Fast connection bonus", 2],
    [6, "Crowded train delay", -1],
    [7, "Lucky shortcut", 3],
    [8, "Lost wallet", -3]
  ];

  for (const event of events) {
    await db.run(
      `
      INSERT OR IGNORE INTO events (id, description, effect)
      VALUES (?, ?, ?)
      `,
      event
    );
  }
}

async function seedPreviousGames(db) {
  const existingGames = await db.get("SELECT COUNT(*) AS count FROM games");

  if (existingGames.count === 0) {
    await db.run(
      `
      INSERT INTO games 
        (id, user_id, start_station_id, destination_station_id, status, score)
      VALUES
        (1, 1, 1, 10, 'completed', 24),
        (2, 1, 5, 12, 'completed', 18),
        (3, 2, 11, 4, 'completed', 21)
      `
    );
  }
}

async function initDatabase(db) {
  await createSchema(db);
  await seedUsers(db);
  await seedStations(db);
  await seedLines(db);
  await seedLineStations(db);
  await seedSegments(db);
  await seedEvents(db);
  await seedPreviousGames(db);

  return db;
}

const dbPromise = open({
  filename: DB_FILE,
  driver: sqlite3.Database
}).then(initDatabase);

export { dbPromise, hashPassword };