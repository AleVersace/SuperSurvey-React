'use strict' ;

/* Data Access Object (DAO) module for accessing surveys */

const db = require('./db');

/**
 * Search for all surveys
 * @returns Promise with DB rows that matches
 */
exports.retrieveAll = () => {
    return new Promise((resolve, reject) => {
        const sql = "SELECT * FROM surveys";
        db.all(sql, (err, rows) => {
            if (err)
                reject(err);
            else
                resolve(rows);
        });
    });
}

/**
 * Search for a specific survey
 * @returns Promise with DB rows that matches
 */
 exports.retrieveSurveyById = (id) => {
    return new Promise((resolve, reject) => {
        const sql = "SELECT * FROM surveys WHERE id = ?";
        db.all(sql, id, (err, rows) => {
            if (err)
                reject(err);
            else
                resolve(rows[0]);
        });
    });
}

/**
 * Search for all questions given surveyId
 * @returns Promise with DB rows that matches
 */
exports.retrieveQuestionsBySurveyId = (surveyId) => {
    return new Promise((resolve, reject) => {
        const sql = "SELECT * FROM questions WHERE surveyId = ?";
        db.all(sql, surveyId, (err, rows) => {
            if (err)
                reject(err);
            else
                resolve(rows);
        });
    });
}

/**
 * Search for all choices given (surveyId, questionId)
 * @returns Promise with DB rows that matches
 */
exports.retrieveChoicesBySurveyIdAndQuestionId = (surveyId, questionId) => {
    return new Promise((resolve, reject) => {
        const sql = "SELECT * FROM closedQuestionChoices WHERE surveyId = ? AND questionId = ?";
        db.all(sql, [surveyId, questionId], (err, rows) => {
            if (err)
                reject(err);
            else
                resolve(rows);
        });
    });
}


/**
 * Search for all user specific surveys
 * @returns Promise with DB rows that matches
 */
exports.retrieveSpecificUserSurveys = (userId) => {
    return new Promise((resolve, reject) => {
        const sql = "SELECT * FROM surveys WHERE user = ?";
        db.all(sql, userId, (err, rows) => {
            if (err)
                reject(err);
            else
                resolve(rows);
        });
    });
}


/**
 * @param {NewSurvey obj} survey: NewSurvey object
 * @param {integer} user: user id logged
 * @returns Promise with error or number of inserted row ID
 */
exports.insertNewSurvey = (survey, user) => {
    return new Promise((resolve, reject) => {
        const sql = "INSERT INTO surveys (user, title, nQuestions) VALUES(?,?,?)";
        db.run(sql, [user, survey.title, survey.nQuestions], function (err) {
            if (err)
                reject(err);
            else 
                resolve(this.lastID);
        });
    });
}


/**
 * @param {integer} surveyId
 * @param {Question Obj} question: new question to be added
 * @returns Promise with error or number of inserted row ID
 */
 exports.insertNewQuestion = (surveyId, question) => {
    return new Promise((resolve, reject) => {
        const sql = "INSERT INTO questions (surveyId, questionId, questionTitle, min, max) VALUES(?,?,?,?,?)";
        db.run(sql, [surveyId, question.questionId, question.title, question.min, question.max], function (err) {
            if (err)
                reject(err);
            else 
                resolve(this.lastID);
        });
    });
}


/**
 * @param {integer} surveyId
 * @param {integer} questionId
 * @param {integer} choiceId
 * @param {string} choice: new choice to be added in closed-answer question
 * @returns Promise with error or number of inserted row ID
 */
 exports.insertNewChoice = (surveyId, questionId, choiceId, choice) => {
    return new Promise((resolve, reject) => {
        const sql = "INSERT INTO closedQuestionChoices (surveyId, questionId, choiceId, choice) VALUES(?,?,?,?)";
        db.run(sql, [surveyId, questionId, choiceId, choice], function (err) {
            if (err)
                reject(err);
            else 
                resolve(this.lastID);
        });
    });
}

/**
 * Retrieve the latest replyId used for the specific surveyId
 * @param {integer} surveyId 
 * @returns Promise that contains error or the MAX replyId used until that time for the specific surveyId, 0 if no records
 */
async function newReplyId(surveyId) {
    return new Promise((resolve, reject) => {
        const sql = "SELECT COALESCE(MAX(replyId), 0) AS newmax FROM replies WHERE surveyId = ?";
        db.get(sql, surveyId, (err, row) => {
            if (err)
                reject(err);
            else 
                resolve(row.newmax);
        });
    });
}

/**
 * Insert in DB an new reply for a specific survey inside replies table
 * @param {integer} surveyId 
 * @param {string} username 
 * @returns Promise with error or new replyId generated
 */
exports.insertNewReply = async (surveyId, username) => {
    let replyId = -1;
    await newReplyId(surveyId).then(newReplyId => replyId = newReplyId+1).catch(err => console.log(err));
    return new Promise((resolve, reject) => {
        if (replyId === -1)
            reject({err: "Problems generating the new replyId..."});
        const sql = "INSERT INTO replies (surveyId, replyId, username) VALUES(?,?,?)";
        db.run(sql, [surveyId, replyId, username], function (err) {
            if (err)
                reject(err);
            else 
                resolve(replyId);
        });
    });
}

/**
 * 
 * @param {integer} surveyId 
 * @param {integer} replyId 
 * @param {integer} questionId 
 * @param {string} reply 
 * @returns Promise with error or number of inserted row ID
 */
exports.insertNewOpenReply = (surveyId, replyId, questionId, reply) => {
    return new Promise((resolve, reject) => {
        const sql = "INSERT INTO openReplies (surveyId, replyId, questionId, reply) VALUES(?,?,?,?)";
        db.run(sql, [surveyId, replyId, questionId, reply], function (err) {
            if (err)
                reject(err);
            else 
                resolve(this.lastID);
        });
    });
}

/**
 * 
 * @param {integer} surveyId 
 * @param {integer} replyId 
 * @param {integer} questionId 
 * @param {integer} choiceId 
 * @returns Promise with error or number of inserted row ID
 */
exports.insertNewClosedReply = (surveyId, replyId, questionId, choiceId) => {
    return new Promise((resolve, reject) => {
        const sql = "INSERT INTO closedReplies (surveyId, replyId, questionId, choiceId) VALUES(?,?,?,?)";
        db.run(sql, [surveyId, replyId, questionId, choiceId], function (err) {
            if (err)
                reject(err);
            else 
                resolve(this.lastID);
        });
    });
}


/**
 * Update number of replies of a certain survey
 * @param {integer} surveyId 
 * @returns Promise with error or number of inserted row ID
 */
exports.upReply = (surveyId) => {
    return new Promise((resolve, reject) => {
        const sql = "UPDATE surveys SET nAnswers = nAnswers + 1 WHERE id = ?";
        db.run(sql, surveyId, function (err) {
            if (err)
                reject(err);
            else 
                resolve(this.lastID);
        });
    });
}

/**
 * Select username from specific reply given surveyId and replyId
 * @param {integer} surveyId 
 * @param {integer} replyId
 * @returns Promise with error or username related to specific reply
 */
exports.retrieveReplyUsername = (surveyId, replyId) => {
    return new Promise((resolve, reject) => {
        const sql = "SELECT username FROM replies WHERE surveyId = ? AND replyId = ?";
        db.get(sql, [surveyId, replyId], function (err, row) {
            if (err)
                reject(err);
            else 
                resolve(row.username);
        });
    });
}


/**
 * Select username from specific reply given surveyId and replyId
 * @param {integer} surveyId 
 * @param {integer} replyId
 * @returns Promise with error or username related to specific reply
 */
 exports.retrieveReply = (surveyId, replyId, questionId) => {
    return new Promise((resolve, reject) => {
        const sql = "SELECT reply FROM openReplies WHERE surveyId = ? AND replyId = ? AND questionId = ?";
        db.get(sql, [surveyId, replyId, questionId], function (err, row) {
            if (err)
                reject(err);
            else 
                resolve(row.reply);
        });
    });
}


/**
 * Select username from specific reply given surveyId and replyId
 * @param {integer} surveyId 
 * @param {integer} replyId
 * @returns Promise with error or username related to specific reply
 */
 exports.retrieveReplies = (surveyId, replyId, questionId) => {
    return new Promise((resolve, reject) => {
        const sql = "SELECT choiceId FROM closedReplies WHERE surveyId = ? AND replyId = ? AND questionId = ?";
        db.all(sql, [surveyId, replyId, questionId], function (err, rows) {
            if (err)
                reject(err);
            else 
                resolve(rows);
        });
    });
}