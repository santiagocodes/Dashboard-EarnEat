const express = require('express');
const path = require('path');
const server = express();
const connection = require('./conf');
const bodyParser = require('body-parser');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const jwt = require('jsonwebtoken');
const JwtStrategy = require('passport-jwt').Strategy;
const cookieParser = require('cookie-parser');
const sha1 = require('sha1');
const port = process.env.PORT || 8000;
const secret = 'cUb5jR$csB=+7xtr';
const salt = '0X(PkJ%49nm09 75NUN6I$2]]0m6h95x';

server.use(passport.initialize());
server.use(bodyParser.json());
server.use(cookieParser(secret));
passport.use(
   new LocalStrategy(
      {
         usernameField: 'email',
      },
      function (username, password, done) {
         const salt = '0X(PkJ%49nm09 75NUN6I$2]]0m6h95x';
         console.log('LOGGING IN...', { username, password });
         connection.query(
            'SELECT * FROM usuario WHERE email = ? AND hash = ?',
            [username, sha1(password + salt)],
            (err, results) => {
               console.log('LOGIN RESULT', results[0]);
               const user = results[0];
               done(err, user);
            }
         );
      }
   )
);

passport.use(
   new JwtStrategy(
      {
         jwtFromRequest: (req) => req.cookies && req.cookies.jwt,
         secretOrKey: secret,
      },
      function (payload, done) {
         console.log('Payload extraido', payload);
         done(payload ? null : 'no payload', payload.user);
      }
   )
);

server.set('port', port);
server.use('/', express.static(path.join(__dirname, '/build')));
server.use('/premios', express.static(path.join(__dirname, '/build')));
server.use('/mi-area', express.static(path.join(__dirname, '/build')));
server.use('/administrar-usuarios', express.static(path.join(__dirname, '/build')));
server.use('/administrar-premios', express.static(path.join(__dirname, '/build')));

// ?----------------------------- USER ----------------------------------------

// TODO: Documentar mas
server.get('/api', (req, res) => {
   res.write('GET    /api/usuarios                       List of users\n');
   res.write('GET    /api/usuarios/me                    Administrator\n');
   res.write('GET    /api/usuarios/:id                   User details.\n');
   res.write('GET    /api/newsfeed                       NF on profile\n');
   res.write('\n');
   res.write('POST   /api/premios                        Premios. \n');
   res.write('POST   /api/votos                          Votos. \n');
   res.write('POST   /api/login                          Log in profile.\n');
   res.write('POST   /api/logout                         Log out profile \n');
   res.end();
});

server.get(
   '/api/usuarios',
   passport.authenticate('jwt', {
      session: false,
   }),
   (req, res) => {
      if (!req.user || !req.user.admin) {
         console.log('Not a user.');
         res.sendStatus(401);
      } else {
         connection.query('SELECT * from usuario', (err, results) => {
            if (err) {
               res.sendStatus(500);
            } else {
               res.json(results);
            }
         });
      }
   }
);

server.get(
   '/api/usuarios/yo',
   passport.authenticate('jwt', {
      session: false,
   }),
   (req, res) => {
      console.log('terminado autentificación jwt', req.user);
      // Sabemos, si es usuario valido, y si es administrador
      res.json(req.user);
   }
);

// TODO: /api/usuarios
// 1. passport.authenticate
// 2. si es admin, puede pedir cualquier usuario
// 3. si es usuario normal solo puede pedirse a si mismo (o sale 401)
// 4. si no es usuario -> 401
server.get(
   '/api/usuarios/:id',
   passport.authenticate('jwt', {
      session: false,
   }),
   (req, res) => {
      if (req.user && (req.user.admin || req.user.id === req.params.id)) {
         connection.query('SELECT * from usuario WHERE id= ?', (err, results) => {
            if (err) {
               res.sendStatus(500);
            } else if (results.length === 0) {
               res.sendStatus(404);
            } else {
               res.json(results[0]);
            }
         });
      } else {
         res.sendStatus(401);
      }
   }
);

server.get(
   '/api/dropdown/usuarios',
   passport.authenticate('jwt', {
      session: false,
   }),
   (req, res) => {
      if (!req || !req.user) {
         res.sendStatus(401);
      } else {
         connection.query(
            'SELECT id AS `key`, id AS `value`, nombre AS `text` FROM usuario',
            (err, results) => {
               if (err) {
                  res.sendStatus(500);
               } else {
                  res.json(results);
               }
            }
         );
      }
   }
);

// 1. passport.authenticate
// 2. si es admin, puede pedir cualquier usuario
// 3. si es usuario normal solo puede pedirse a si mismo (o sale 401)
// 4. si no es usuario -> 401
server.get(
   '/api/usuarios/:id/puntos_saldo',
   passport.authenticate('jwt', {
      session: false,
   }),
   (req, res) => {
      if (req.user && (req.user.admin || req.user.id === req.params.id)) {
         connection.query(
            'SELECT * from puntos_saldo WHERE id= ?',
            [req.params.id],
            (err, results) => {
               if (err) {
                  res.sendStatus(500);
               } else if (results.length === 0) {
                  res.sendStatus(404);
               } else {
                  res.json(results[0]);
               }
            }
         );
      } else {
         res.sendStatus(401);
      }
   }
);

server.get(
   '/api/usuarios/:id/puntos_dados',
   passport.authenticate('jwt', {
      session: false,
   }),
   (req, res) => {
      if (req.user && (req.user.admin || req.user.id === req.params.id)) {
         connection.query(
            'SELECT * from puntos_dados WHERE id= ?',
            [req.params.id],
            (err, results) => {
               if (err) {
                  res.sendStatus(500);
               } else if (results.length === 0) {
                  res.sendStatus(404);
               } else {
                  res.json(results[0]);
               }
            }
         );
      } else {
         res.sendStatus(401);
      }
   }
);

// 1. passport.authenticate
// 2. si es admin, puede crear usuario
// 3. si es usuario normal -> 401
// 4. si no es usuario -> 401
server.post(
   '/api/usuarios',
   passport.authenticate('jwt', {
      session: false,
   }),
   (req, res) => {
      const user = req.body;
      console.log('user=', user);
      user.hash = sha1(user.password + salt);
      delete user.password;
      delete user.message;
      if (req.user && (req.user.admin || req.user.id)) {
         connection.query('INSERT INTO usuario SET ?', user, (err, results) => {
            if (err) {
               console.log(err);
               res.sendStatus(500);
            } else if (results.length === 0) {
               res.sendStatus(404);
            } else {
               console.log('results> ', results);
               res.json({ message: 'all good' });
            }
         });
      } else {
         res.sendStatus(401);
      }
   }
);

// 1. passport.authenticate
// 2. si es admin, puede cambiar cualquier usuario
// 3. si es usuario normal solo puede cambiarse a si mismo (o sale 401)
// 4. si no es usuario -> 401
server.patch(
   '/api/usuarios/:id',
   passport.authenticate('jwt', {
      session: false,
   }),
   (req, res) => {
      const user = {};
      if (req.user && (req.user.admin || req.user.id === req.params.id)) {
         const oldhash = sha1(req.body.old_password + salt);
         user.hash = sha1(req.body.new_password + salt);
         console.log(
            'UPDATE usuario SET ? WHERE id = ? AND hash = ?',
            user,
            req.body.id,
            oldhash
         );

         connection.query(
            'UPDATE usuario SET ? WHERE id = ? AND hash = ?',
            [user, req.body.id, oldhash],
            (err, results) => {
               if (err) {
                  console.log(err);
                  res.sendStatus(500);
               } else if (results.affectedRows === 0) {
                  console.log('results.affectedRows', results.affectedRows);
                  res.sendStatus(401);
               } else {
                  console.log('results.affectedRows', results.affectedRows);
                  res.status(200);
                  res.json(results);
               }
            }
         );
      } else {
         res.sendStatus(401);
      }
   }
);

// Editar la información del usuario como administrador ?????????????????????????????
server.patch(
   '/api/usuario/:id',
   passport.authenticate('jwt', {
      session: false,
   }),
   (req, res) => {
      delete req.body.message;
      if (!req.user || !req.user.admin) {
         res.sendStatus(401);
      } else {
         connection.query(
            'UPDATE `usuario` SET ? WHERE id = ?',
            [req.body, req.params.id],
            (err, results) => {
               if (err) {
                  console.log('err', err);
                  res.sendStatus(500);
               } else {
                  res.json(results);
               }
            }
         );
      }
   }
);

server.delete(
   '/api/usuarios/:id',
   passport.authenticate('jwt', {
      session: false,
   }),
   (req, res) => {
      if (!req.user || !req.user.admin) {
         res.sendStatus(401);
      } else {
         connection.query(
            'DELETE FROM usuario WHERE id = ?',
            req.params.id,
            (err, results) => {
               console.log('id', req.params.id);
               if (err) {
                  console.log(err);
                  res.sendStatus(500);
               }
               res.json(results);
            }
         );
      }
   }
);

server.post(
   '/api/usuarios/:id/premios',
   passport.authenticate('jwt', {
      session: false,
   }),
   (req, res) => {
      if (!req.user || !req.user.admin) {
         res.sendStatus(401);
      } else {
         connection.query(
            `SELECT puntos_saldo - premio.puntos AS puntos_despues_de_canjear
            FROM puntos_saldo 
            JOIN premio ON premio.id = ?
            WHERE puntos_saldo.id = ?`,
            [req.body.premio_id, req.body.usuario_id],
            (err, results) => {
               if (err) {
                  console.log(err);
                  res.sendStatus(500);
               } else if (
                  results &&
                  results[0] &&
                  results[0].puntos_despues_de_canjear >= 0
               ) {
                  const data = {
                     usuario_id: req.body.usuario_id,
                     premio_id: req.body.premio_id,
                  };
                  connection.query(
                     'INSERT INTO premio_usuario SET ?',
                     data,
                     (err, results) => {
                        if (err) {
                           console.log(err);
                           res.sendStatus(500);
                        } else {
                           res.json(results);
                        }
                     }
                  );
               } else {
                  res.sendStatus(409);
               }
            }
         );
      }
   }
);

// ?----------------------------- NEWS FEED ----------------------------------------

server.get('/api/newsfeed', (req, res) => {
   connection.query(
      'SELECT * FROM newsfeed_plus ORDER BY fecha DESC LIMIT 20',
      (err, results) => {
         if (err) {
            res.sendStatus(500);
         } else {
            res.json(results);
         }
      }
   );
});

// ?---------------------------------- LOG IN/ LOG OUT -----------------------------------------

server.post('/api/login', (req, res, next) => {
   console.log('login starting');
   passport.authenticate('local', function (err, user) {
      console.log('login finish');
      if (!user) {
         res.status(401);
         res.json({
            message: 'There is a problem logging in as this is not a user.',
         });
      } else if (err) {
         res.status(401);
         res.json({ message: 'There is a problem logging in' });
      } else {
         jwt.sign({ user }, secret, (err, token) => {
            console.log('jwt generate', err, token);
            if (err) return res.status(500).json(err);
            res.cookie('jwt', token, {
               httpOnly: true,
            });
            res.status(200).send(user);
         });
      }
   })(req, res, next);
});

server.post('/api/logout', (req, res, nex) => {
   res.clearCookie('jwt').send();
});

// ?------------------------------------ VOTES ----------------------------------------

// TODO: passport.authenticate (solo usuarios pueden votar)
server.post(
   '/api/votos',
   passport.authenticate('jwt', {
      session: false,
   }),
   (req, res) => {
      if (!req.user) {
         res.sendStatus(401);
      }
      // inspeccionar lo que nos estan mandando (req.body)
      else if (
         !req.body.a_usuario_id ||
         !req.body.de_usuario_id ||
         !req.body.puntos ||
         !req.body.razon ||
         req.body.puntos < 0
      ) {
         res.sendStatus(400);
      } else {
         connection.query(
            'SELECT puntos_restantes FROM puntos_dados WHERE id=?',
            [req.user.id],
            (err, results) => {
               if (err) {
                  console.log(err);
                  return res.sendStatus(500);
               }
               const puntos_restantes =
                  results && results[0] && results[0].puntos_restantes;
               const noTieneLosPuntos = Number(req.body.puntos) >= puntos_restantes;
               //console.log('SELECT puntos_restantes FROM puntos_dados WHERE id=?', { err, puntos_restantes, "Number(req.body.puntos)": Number(req.body.puntos), noTieneLosPuntos })

               if (noTieneLosPuntos) {
                  /// tiene puntos suficientes? si no, manda 409 (o 403)
                  console.log('Lo siento. No tienes puntos suficientes');
                  res.sendStatus(403);
               } else {
                  const data = {
                     a_usuario_id: req.body.a_usuario_id,
                     de_usuario_id: req.body.de_usuario_id,
                     puntos: req.body.puntos,
                     razon: req.body.razon,
                  };
                  connection.query(
                     'INSERT INTO voto SET ?',
                     data,
                     (err, results) => {
                        if (err) {
                           console.log(err);
                           res.sendStatus(500);
                        } else {
                           res.json(results);
                        }
                     }
                  );
               }
            }
         );
      }
   }
);

// ?------------------------------- PREMIOS ---------------------------------------------

server.get('/api/premios', (req, res) => {
   connection.query('SELECT * from premio', (err, results) => {
      if (err) {
         console.log(err);
         res.status(500).send(err.message);
      } else {
         res.json(results);
      }
   });
});

// TODO: premios area personal
server.get(
   '/api/usuarios/:id/premios_canjeados',
   passport.authenticate('jwt', {
      session: false,
   }),
   (req, res) => {
      if (req.user && (req.user.admin || req.user.id === req.params.id)) {
         connection.query(
            'SELECT * from premios_canjeados WHERE usuario_id = ?',
            [req.params.id],
            (err, results) => {
               if (err) {
                  res.sendStatus(500);
               } else {
                  res.json(results);
               }
            }
         );
      } else {
         res.sendStatus(401);
      }
   }
);

//TODO: Premios en mi area personal. Este API permite marcarlos como utilizados.
server.patch(
   '/api/usuarios/:usuario_id/premios/:premio_usuario_id',
   passport.authenticate('jwt', {
      session: false,
   }),
   (req, res) => {
      delete req.body.message;
      if (!req.user || req.user.id != req.params.usuario_id) {
         res.sendStatus(403);
      } else {
         connection.query(
            'UPDATE `premio_usuario` SET `utilizado`= 1 WHERE id = ? AND usuario_id = ?',
            [req.params.premio_usuario_id, req.params.usuario_id],
            (err, results) => {
               if (err) {
                  res.sendStatus(500);
               } else {
                  res.json(results);
               }
            }
         );
      }
   }
);

// TODO: passport.authenticate (solo usuarios pueden escoger premios)
// server.post('/api/premios/add', passport.authenticate('jwt', {
//     session: false}), (req, res) => {
//         if ( !req.user || !req.user.admin) {
//             res.sendStatus(401)
//         } else {
//             connection.query('INSERT into premio SET ?',req.body, (err, results) => {
//         if (err) {
//             console.log(err);
//             res.sendStatus(500);
//         }
//             res.json(results);
//         });
//     }
// });

// TODO: passport.authenticate (solo administrador puede crear premios)
server.post(
   '/api/premios',
   passport.authenticate('jwt', {
      session: false,
   }),
   (req, res) => {
      const total = req.body;
      delete total.message;
      if (req.user || req.user.admin) {
         console.log('admin ok');
         connection.query('INSERT into premio SET ?', total, (err, results) => {
            if (err) {
               console.log('ERROR: ', err);
               res.sendStatus(500);
            } else if (results.length === 0) {
               res.sendStatus(404);
            } else {
               res.json({ message: 'all good' });
            }
         });
      } else {
         res.sendStatus(401);
      }
   }
);

// TODO: Solo administrador puede cambiar premios
server.patch(
   '/api/premios/:id',
   passport.authenticate('jwt', {
      session: false,
   }),
   (req, res) => {
      delete req.body.message;
      if (!req.user || !req.user.admin) {
         res.sendStatus(401);
      } else {
         connection.query(
            'UPDATE `premio` SET ? WHERE id = ?',
            [req.body, req.params.id],
            (err, results) => {
               if (err) {
                  res.sendStatus(500);
               } else {
                  res.json(results);
               }
            }
         );
      }
   }
);

server.delete(
   '/api/premios/:id',
   passport.authenticate('jwt', {
      session: false,
   }),
   (req, res) => {
      if (!req.user || !req.user.admin) {
         res.sendStatus(401);
      } else {
         connection.query(
            'DELETE FROM premio WHERE id = ?',
            req.params.id,
            (err, results) => {
               if (err) {
                  res.sendStatus(500);
               }
               res.json(results);
            }
         );
      }
   }
);

server.on('error', (e) => console.log(e));

server.listen(port, () => {
   console.log('This is on port ' + port);
});

// TODO: tests con mocha y supertest
