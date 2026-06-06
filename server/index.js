import express from "express";
import cors from "cors";
import session from "express-session";
import SQLiteStoreFactory from "connect-sqlite3";

import { passport, configurePassport, isLoggedIn } from "./auth.js";
import { dbPromise } from "./db.js";
import {
  getFullNetwork,
  getPlanningNetwork,
  getRanking,
  createGame,
  getGameById,
  selectRandomStartAndDestination,
  submitRoute
} from "./dao.js";

const app = express();
const port = 3001;

const SQLiteStore = SQLiteStoreFactory(session);

configurePassport();

app.use(express.json());

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true
  })
);

app.use(
  session({
    store: new SQLiteStore({
      db: "sessions.sqlite",
      dir: "."
    }),
    secret: "last-race-development-secret",
    resave: false,
    saveUninitialized: false
  })
);

app.use(passport.initialize());
app.use(passport.session());

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.post("/api/sessions", (req, res, next) => {
  passport.authenticate("local", (err, user, info) => {
    if (err) {
      return next(err);
    }

    if (!user) {
      return res.status(401).json({
        error: info?.message || "Invalid username or password"
      });
    }

    req.login(user, (loginErr) => {
      if (loginErr) {
        return next(loginErr);
      }

      return res.json(req.user);
    });
  })(req, res, next);
});

app.get("/api/sessions/current", (req, res) => {
  if (req.isAuthenticated()) {
    return res.json(req.user);
  }

  return res.status(401).json({ error: "Not authenticated" });
});

app.delete("/api/sessions/current", isLoggedIn, (req, res) => {
  req.logout(() => {
    res.status(204).end();
  });
});

app.get("/api/network", isLoggedIn, async (req, res) => {
  try {
    const network = await getFullNetwork();
    res.json(network);
  } catch {
    res.status(500).json({ error: "Cannot load network" });
  }
});

app.get("/api/planning-network", isLoggedIn, async (req, res) => {
  try {
    const network = await getPlanningNetwork();
    res.json(network);
  } catch {
    res.status(500).json({ error: "Cannot load planning network" });
  }
});

app.get("/api/ranking", isLoggedIn, async (req, res) => {
  try {
    const ranking = await getRanking();
    res.json(ranking);
  } catch {
    res.status(500).json({ error: "Cannot load ranking" });
  }
});
app.get("/api/network/full", isLoggedIn, async (req, res) => {
  try {
    const network = await getFullNetwork();
    res.json(network);
  } catch (err) {
    console.error("GET /api/network/full failed:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/api/network/planning", isLoggedIn, async (req, res) => {
  try {
    const network = await getPlanningNetwork();
    res.json(network);
  } catch (err) {
    console.error("GET /api/network/planning failed:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/api/games", isLoggedIn, async (req, res) => {
  try {
    const pair = await selectRandomStartAndDestination();

    const game = await createGame(
      req.user.id,
      pair.startStationId,
      pair.destinationStationId,
      pair.distance
    );

    res.status(201).json({
      ...game,
      minimumDistance: pair.distance
    });
   } catch (err) {
    console.error("POST /api/games failed:", err);
    return res.status(500).json({ error: "Cannot create game" });
  }
});

app.get("/api/games/:gameId", isLoggedIn, async (req, res) => {
  try {
    const gameId = Number(req.params.gameId);

    if (!Number.isInteger(gameId) || gameId <= 0) {
      return res.status(400).json({ error: "Invalid game id" });
    }

    const game = await getGameById(gameId, req.user.id);

    if (!game) {
      return res.status(404).json({ error: "Game not found" });
    }

    return res.json(game);
  } catch (err) {
    console.error("POST /api/games/:id/route failed:", err);
    return res.status(500).json({ error: "Cannot submit route" });
  }
});

app.post("/api/games/:gameId/route", isLoggedIn, async (req, res) => {
  try {
    const gameId = Number(req.params.gameId);

    if (!Number.isInteger(gameId) || gameId <= 0) {
      return res.status(400).json({ error: "Invalid game id" });
    }

    const { selectedSegmentIds } = req.body;

    if (!Array.isArray(selectedSegmentIds)) {
      return res.status(400).json({ error: "selectedSegmentIds must be an array" });
    }

    const parsedSegmentIds = selectedSegmentIds.map((id) => Number(id));

    if (
      parsedSegmentIds.some(
        (id) => !Number.isInteger(id) || id <= 0
      )
    ) {
      return res.status(400).json({ error: "All segment ids must be positive integers" });
    }

    const result = await submitRoute(gameId, req.user.id, parsedSegmentIds);

    if (!result.game) {
      return res.status(404).json(result);
    }

    return res.json(result);
  } catch (err) {
     console.error("POST /api/games/:gameId/route failed:", err);
     return res.status(500).json({ error: "Cannot submit route" });
 }
});
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

await dbPromise;

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});