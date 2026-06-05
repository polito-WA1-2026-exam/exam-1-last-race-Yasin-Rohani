import express from "express";
import cors from "cors";
import session from "express-session";
import SQLiteStoreFactory from "connect-sqlite3";

import { passport, configurePassport, isLoggedIn } from "./auth.js";
import { dbPromise } from "./db.js";
import {
  getFullNetwork,
  getPlanningNetwork,
  getRanking
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

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

await dbPromise;

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});