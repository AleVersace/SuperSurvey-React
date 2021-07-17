const url = "http://localhost:3000";

/**
 * Constructor obj for errors in requests
 * @param {string} msg with message error of HTTP request 
 */
function ResponseExcetion(msg) {
    this.msg = msg;
}

/**
 * Async Function that performs an async GET request to retrieve all Opened Surveys using the proxy call to reach the API server
 * @returns Promise to be consumed with the list of Surveys with useful info
 */
async function loadOpenedSurveys() {
    const response = await fetch(url + "/api/surveys");

    if (!response.ok) {
        throw new ResponseExcetion(response.status + " " + response.statusText);
    }

    const surveys = await response.json();

    return surveys.map(s => {
        s = ({ ...s });
        delete s.user;
        return s;
    });
}

/**
 * Async Function that performs an async GET request to retrieve all Opened Surveys of the specific logged user using the proxy call to reach the API server
 * @returns Promise to be consumed with list of logged user's surveys
 */
async function loadUserSurveys() {
    const response = await fetch(url + "/api/surveys/user");

    if (!response.ok) {
        throw new ResponseExcetion(response.status + " " + response.statusText);
    }

    const surveys = await response.json();

    return surveys.map(s => {
        s = ({ ...s });
        delete s.user;
        return s;
    });
}

/**
 * @param {integer} surveyId 
 * @returns Promise to be consumed with the exact required survey given the id
 */
 async function loadSurveyToCompile(surveyId) {
    const response = await fetch(url + "/api/surveys/" + surveyId);

    if (!response.ok) {
        throw new ResponseExcetion(response.status + " " + response.statusText);
    }

    const survey = await response.json();
    delete survey.user;
    return survey;
}

/**
 * @param {integer} surveyId
 * @returns Promise to be consumed with the list of questions related to the given survey id
 */
async function loadQuestions(surveyId) {
    const response = await fetch(url + "/api/surveys/" + surveyId + "/questions/");

    if (!response.ok) {
        throw new ResponseExcetion(response.status + " " + response.statusText);
    }

    const questions = await response.json();
    return questions;
}

/**
 * @param {integer} surveyId 
 * @param {integer} questionId
 * @returns Promise to be consumed with the list of choices related to the given (surveyId, questionId)
 */
async function loadChoices(surveyId, questionId) {
    const response = await fetch(url + "/api/surveys/" + surveyId + "/questions/" + questionId + "/choices");

    if (!response.ok) {
        throw new ResponseExcetion(response.status + " " + response.statusText);
    }

    const choices = await response.json();
    return choices;
}

/**
 * Async function that performs a POST request to the backend to store a new published survey 
 * @param {NewSurvey} newSurvey : object that contains all useful information for a new survey
 */
async function addNewSurvey(newSurvey, title, questionsList) {
    newSurvey.title = title;
    newSurvey.questionsList = questionsList;
    newSurvey.nQuestions = questionsList.length;
    const response = await fetch(url + "/api/surveys/user/new-survey", {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSurvey)
    });

    const result = await response.json();
    return new Promise((resolve, reject) => {
        if(result.ok)
            resolve(true);
        else 
            reject(false);
    });
}

/**
 * Async function that performs a POST request to the backend to store a new reply from a user
 * @param {NewSurvey} newReply : object that contains all useful information of a survey + replies + username of the user that filled it  
 */
async function addNewReply(newReply) {
    const response = await fetch(url + "/api/surveys/new-reply", {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newReply)
    });

    const result = await response.json();
    if (result.ok) return true;
    return false;
}

async function getUsername(surveyId, replyId) {
    const response = await fetch(url + "/api/surveys/" + surveyId + "/replies/" + replyId + "/username");

    if (!response.ok) {
        throw new ResponseExcetion(response.status + " " + response.statusText);
    }

    const username = await response.json();
    return username;
}

async function loadReplies(surveyId, replyId, questionId, open) {
    let response;
    if (open)
        response = await fetch(url + "/api/surveys/" + surveyId + "/replies/" + replyId + "/questions/" + questionId);
    else
        response = await fetch(url + "/api/surveys/" + surveyId + "/replies/" + replyId + "/questions/" + questionId +"/closed");

    if (!response.ok) {
        throw new ResponseExcetion(response.status + " " + response.statusText);
    }

    const replies = await response.json();
    return replies;
}


/*** AUTH Client Request APIs ***/

/**
 * Function that performs the login through a POST request to the server
 * @param {object} credentials object with username and password of the user that wants to log in 
 * @returns an object with the user name and the user id
 */
 async function logIn(credentials) {
    let response = await fetch(url + '/api/sessions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
    });
    if (response.ok) {
        const user = await response.json();
        return { name: user.name, id: user.id };
    }
    else {
        try {
            const errDetail = await response.json();
            throw errDetail.message;
        }
        catch (err) {
            throw err;
        }
    }
}

/**
 * Function that performs the logout through a DELETE request to the server
 */
async function logOut() {
    await fetch(url + '/api/sessions/current', { method: 'DELETE' });
}

/**
 * Function that checks wheather a user is logged in or not through a GET request to the server
 * @returns an object with the user info (id, username, name)
 */
async function getUserInfo() {
    const response = await fetch(url + '/api/sessions/current');
    const userInfo = await response.json();
    if (response.ok) {
        return userInfo;
    } else {
        throw userInfo;  // an object with the error coming from the server
    }
}

const API = { getUserInfo, logIn, logOut, loadOpenedSurveys, loadUserSurveys, addNewSurvey, loadSurveyToCompile, loadQuestions, loadChoices, addNewReply, getUsername, loadReplies };

export default API;