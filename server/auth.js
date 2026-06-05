import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { getUserByUsername, getUserById } from "./dao.js";
import { hashPassword } from "./db.js";

function configurePassport() {
  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await getUserByUsername(username);

        if (!user) {
          return done(null, false, { message: "Invalid username or password" });
        }

        const passwordHash = hashPassword(password, user.salt);

        if (passwordHash !== user.password_hash) {
          return done(null, false, { message: "Invalid username or password" });
        }

        const safeUser = {
          id: user.id,
          username: user.username,
          name: user.name
        };

        return done(null, safeUser);
      } catch (err) {
        return done(err);
      }
    })
  );

  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id, done) => {
    try {
      const user = await getUserById(id);

      if (!user) {
        return done(null, false);
      }

      return done(null, user);
    } catch (err) {
      return done(err);
    }
  });
}

function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }

  return res.status(401).json({ error: "Not authenticated" });
}

export { passport, configurePassport, isLoggedIn };