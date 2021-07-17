'use strict';

const express = require('express');
const morgan = require('morgan'); // Middleware for debuggin purposes

// Express-validator which is used to perform validation
const { body, validationResult, param } = require('express-validator');

 // Login purposes
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy; // Require LocalStrategy for authentication with username and password
const session = require('express-session'); // Useful for session creation

//Require the dao module for accessing users in DB
const userDao = require('./user-dao');
//Require the dao module for accessing surveys in DB
const surveyDao = require('./survey-dao');


/*** Set up Passport ***/
// set up the "username and password" login strategy
// by setting a function to verify username and password
passport.use(new LocalStrategy(
    function (username, password, done) {
        userDao.getUser(username, password).then((user) => {
            if (!user)
                return done(null, false, { message: 'Incorrect username and/or password.' });

            return done(null, user);
        })
    }
));

// serialize and de-serialize the user (user object <-> session)
// we serialize the user id and we store it in the session: the session is very small in this way
passport.serializeUser((user, done) => {
    done(null, user.id);
});

// starting from the data in the session, we extract the current (logged-in) user
passport.deserializeUser((id, done) => {
    userDao.getUserById(id)
        .then(user => {
            done(null, user); // this will be available in req.user
        }).catch(err => {
            done(err, null);
        });
});


// init express
const app = new express();
app.use(morgan('dev'));
app.use(express.json());
const port = 3001;

// activate the server
app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});


// custom middleware: check if a given request is coming from an authenticated user
const isLoggedIn = (req, res, next) => {
  if (req.isAuthenticated())
      return next();

  return res.status(401).json({ error: 'not authenticated' });
}

// set up the session
app.use(session({
  // by default, Passport uses a MemoryStore to keep track of the sessions
  //a secret sentence not to share with anybody and anywhere, used to sign the session ID cookie
  secret: '0Ws0TQxSueD0eFNepQgrsE1j5RMU68xB89wOkgANHGAS4RwomWhYiX031QmrOqqT5B8GJ8nPmVHusvDuxVyWp1zZmTL$EdWqP2e4htDjDZabw0YOrAaam6w0pt7LkZcL',
  resave: false,
  saveUninitialized: false
}));

// then, init passport
app.use(passport.initialize());
app.use(passport.session());


/*** User APIs ***/

// POST /api/sessions 
// login
app.post('/api/sessions', function (req, res, next) {
  passport.authenticate('local', (err, user, info) => {
      if (err)
          return next(err);
      if (!user) {
          // display wrong login messages
          return res.status(401).json(info);
      }
      // success, perform the login
      req.login(user, (err) => {
          if (err)
              return next(err);

          // req.user contains the authenticated user, we send all the user info back
          // this is coming from userDao.getUser()
          return res.json(req.user);
      });
  })(req, res, next);
});

// DELETE /api/sessions/current 
// logout
app.delete('/api/sessions/current', (req, res) => {
  req.logout();
  res.end();
});

// GET /api/sessions/current
// check whether the user is logged in or not
app.get('/api/sessions/current', (req, res) => {
  if (req.isAuthenticated()) {
      res.status(200).json(req.user);
  }
  else
      res.status(401).json({ error: 'Unauthenticated user!' });;
});




/*** Surveys APIs ***/


// GET: Retrieve all opened surveys from db (doesn't require auth)
app.get('/api/surveys', (req, res) => {
    surveyDao.retrieveAll()
        .then(surveys => res.status(200).json(surveys))
        .catch(err => res.status(500).json(err));
});

// GET: Retrieve all user specific opened surveys from db (require auth)
app.get('/api/surveys/user', isLoggedIn, (req, res) => {
    surveyDao.retrieveSpecificUserSurveys(req.user.id)
        .then(surveys => res.status(200).json(surveys))
        .catch(err => res.status(500).json(err));
});

// POST: Save a new survey in the db (requires auth)
app.post('/api/surveys/user/new-survey', isLoggedIn, async (req, res) => {
    // Req Validation
    await Promise.all([
        // Survey title must be a string
        body('title').isString().withMessage("Must be a string").run(req),
        // Number of questions must be an integer
        body('nQuestions').isInt().withMessage("Must be an integer value").run(req),
        // The list of questions must contain at least a question
        body('questionsList').custom(() => {
            const obj = req.body;
            console.log(obj);
            if (obj.questionsList.length === 0)
                return false;
            else {
                for (let question of obj.questionsList) {
                    if (question.open === null || !(question.open === true || question.open === false))
                        return false;
                    if (question.title.length === 0)
                        return false;
                    if (question.max !== undefined)
                        if (question.min < 0 || question.max < 0 || question.max < question.min)
                            return false;
                    else 
                        if (question.min < 0)
                            return false;
                }
            }
            return true;
        }).withMessage("Errors with some questions").run(req)
    ]);
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({ errors: errors.array() });
    }

    let surveyId = -1;
    let questionId = 1; // Count the questions to enumerate them (track order)
    // Add new survey in surveys table
    await surveyDao.insertNewSurvey(req.body, req.user.id).then(newSurveyId => surveyId = newSurveyId).catch(err => console.log(err));
    if (surveyId !== -1) {
        // Add questions in related table (divided per type)
        for (let question of req.body.questionsList) {
            question.questionId = questionId;
            if (question.open === true)
                question.max = -1; 
            else
                question.max = parseInt(question.max);
            question.min = parseInt(question.min);
            await surveyDao.insertNewQuestion(surveyId, question);
            if (question.open === false) {
                let choiceId = 1;
                for (let choice of question.answers) {
                    await surveyDao.insertNewChoice(surveyId, question.questionId, choiceId, choice);
                    choiceId += 1;
                }
            }
            questionId += 1;
        }
        res.status(201).json({ok: "ok!"});
        return;
    }
    res.status(500).json({error: "Something was wrong."});
}); 

// GET: Retrieve a survey by its id (doesn't require auth) 
app.get('/api/surveys/:id', async (req, res) => {
    // id must be an integer
    await param('id').isInt().withMessage("Must be an integer value").run(req);
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        // If there are errors then return status 404 and the object with the array of errors
        return res.status(404).json({ errors: errors.array() });
    }
    surveyDao.retrieveSurveyById(req.params.id)
        .then(survey => res.status(200).json(survey))
        .catch(err => {
            if (err.errors)
                res.status(404).json(err);
            else
                res.status(500).json(err);
        });
});

// GET: Retrieve all survey questions by its survey id (doesn't require auth) 
app.get('/api/surveys/:surveyId/questions', async (req, res) => {
    // id must be an integer
    await param('surveyId').isInt().withMessage("Must be an integer value").run(req);
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        // If there are errors then return status 404 and the object with the array of errors
        return res.status(404).json({ errors: errors.array() });
    }
    surveyDao.retrieveQuestionsBySurveyId(req.params.surveyId)
        .then(survey => res.status(200).json(survey))
        .catch(err => {
            if (err.errors)
                res.status(404).json(err);
            else
                res.status(500).json(err);
        });
});

// GET: Retrieve all question choices by its survey id and question id (doesn't require auth) 
app.get('/api/surveys/:surveyId/questions/:questionId/choices', async (req, res) => {
    // id must be an integer
    await param('surveyId').isInt().withMessage("Must be an integer value").run(req);
    await param('questionId').isInt().withMessage("Must be an integer value").run(req);
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        // If there are errors then return status 404 and the object with the array of errors
        return res.status(404).json({ errors: errors.array() });
    }
    surveyDao.retrieveChoicesBySurveyIdAndQuestionId(req.params.surveyId, req.params.questionId)
        .then(survey => res.status(200).json(survey))
        .catch(err => {
            if (err.errors)
                res.status(404).json(err);
            else
                res.status(500).json(err);
        });
});


// POST: Save a new reply in the db (doesn't requires auth)
app.post('/api/surveys/new-reply', async (req, res) => {
    
    // Req Validation
    await Promise.all([
        // Survey title must be a string
        body('title').isString().withMessage("Must be a string").run(req),
        // Reply username must be a string
        body('username').isString().withMessage("Must be a string").run(req),
        body('nQuestions').isInt().withMessage("Must be an integer value").run(req),
        body('questionsList').custom(() => {
            if (req.body.questionsList.length === 0)
                return false;
            else {
                const obj = req.body;
                for (let question of obj.questionsList) {
                    if (question.open === null || (question.open !== true && question.open !== false))
                        return false;
                    if (question.title.length === 0)
                        return false;
                    if (question.max !== undefined)
                        if (question.min < 0 || question.max < 0 || question.max < question.min)
                            return false;
                    else 
                        if (question.min < 0)
                            return false;
                    if (question.max !== undefined)
                        for (let choice of question.answers)
                            if (choice.choice.length === 0)
                                return false;
                    // Check replies
                    if (question.min > 0)
                        if (question.reply.length === 0)    
                            return false;
                }
            }
            return true;
        }).withMessage("Must contain at least a question").run(req)
    ]);
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({ errors: errors.array() });
    }

    let replyId = -1;
    await surveyDao.insertNewReply(req.body.id, req.body.username).then(newReplyId => replyId = newReplyId).catch(err => res.status(500).json(err));
    if (replyId !== -1) {
        for (let question of req.body.questionsList) {  // Iterate over questions
            if (question.open === true) {
                await surveyDao.insertNewOpenReply(req.body.id, replyId, question.questionId, question.reply);
            } else {
                for (let reply of question.reply) { // Iterate over choiceId recorded as replies
                    await surveyDao.insertNewClosedReply(req.body.id, replyId, question.questionId, reply);
                }
            }
        }
        await surveyDao.upReply(req.body.id);
        res.status(201).json({ok: "ok!"});
        return;
    }
    res.status(500).json({error: "Something was wrong."});
});


// GET: Retrieve the username of a survey reply given surveyId and replyId (requires auth) 
app.get('/api/surveys/:id/replies/:rid/username', isLoggedIn, async (req, res) => {

    // id must be integers
    await param('id').isInt().withMessage("Must be an integer value").run(req);
    await param('rid').isInt().withMessage("Must be an integer value").run(req);
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        // If there are errors then return status 404 and the object with the array of errors
        return res.status(404).json({ errors: errors.array() });
    }

    // Check if admin that do the request is the owner of the specified survey
    await surveyDao.retrieveSurveyById(req.params.id).then(survey => {
        if (survey.user !== req.user.id) 
            res.status(401).json({ error: 'Unauthorized.' });
    }).catch(err => {
        if (err.errors)
            res.status(404).json(err);
        else
            res.status(500).json(err);
    });

    if (res.headersSent)    // If the response is already sent terminate the execution
        return;

    surveyDao.retrieveReplyUsername(req.params.id, req.params.rid)
        .then(username => res.status(200).json(username))
        .catch(err => {
            if (err.errors)
                res.status(404).json(err);
            else
                res.status(500).json(err);
        });
});


// GET: Retrieve replies of a CLOSED question given surveyId, replyId, questionId (requires auth) 
app.get('/api/surveys/:id/replies/:rid/questions/:qid/closed', isLoggedIn, async (req, res) => {
    // id must be integers
    await param('id').isInt().withMessage("Must be an integer value").run(req);
    await param('rid').isInt().withMessage("Must be an integer value").run(req);
    await param('qid').isInt().withMessage("Must be an integer value").run(req);
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        // If there are errors then return status 404 and the object with the array of errors
        return res.status(404).json({ errors: errors.array() });
    }

    // Check if admin that do the request is the owner of the specified survey
    await surveyDao.retrieveSurveyById(req.params.id).then(survey => {
        if (survey.user !== req.user.id) 
            res.status(401).json({ error: 'Unauthorized.' });
    }).catch(err => {
        if (err.errors)
            res.status(404).json(err);
        else
            res.status(500).json(err);
    });

    if (res.headersSent)    // If the response is already sent terminate the execution
        return;

    surveyDao.retrieveReplies(req.params.id, req.params.rid, req.params.qid)
        .then(replies => res.status(200).json(replies))
        .catch(err => {
            if (err.errors)
                res.status(404).json(err);
            else
                res.status(500).json(err);
        });
});


// GET: Retrieve replies of a OPEN question given surveyId, replyId, questionId (requires auth) 
app.get('/api/surveys/:id/replies/:rid/questions/:qid', isLoggedIn, async (req, res) => {
    // id must be integers
    await param('id').isInt().withMessage("Must be an integer value").run(req);
    await param('rid').isInt().withMessage("Must be an integer value").run(req);
    await param('qid').isInt().withMessage("Must be an integer value").run(req);
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        // If there are errors then return status 404 and the object with the array of errors
        return res.status(404).json({ errors: errors.array() });
    }

    // Check if admin that do the request is the owner of the specified survey
    await surveyDao.retrieveSurveyById(req.params.id).then(survey => {
        if (survey.user !== req.user.id) 
            res.status(401).json({ error: 'Unauthorized.' });
    }).catch(err => {
        if (err.errors)
            res.status(404).json(err);
        else
            res.status(500).json(err);
    });

    if (res.headersSent)    // If the response is already sent terminate the execution
        return;

    surveyDao.retrieveReply(req.params.id, req.params.rid, req.params.qid)
        .then(replies => res.status(200).json(replies))
        .catch(err => {
            if (err.errors)
                res.status(404).json(err);
            else
                res.status(500).json(err);
        });
});