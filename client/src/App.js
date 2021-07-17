// import logo from './logo.svg';
import './App.css';

// import bootstrap CSS
import 'bootstrap/dist/css/bootstrap.min.css';
import { Container, Row } from 'react-bootstrap';

import React, { useState, useEffect } from 'react';

import { BrowserRouter as Router } from 'react-router-dom';
import { Route, Switch, Redirect } from 'react-router-dom';

import LoginForm from './login/LoginForm';
import NavbarCustom from './customNavbar/NavbarCustom';
import {MainContent} from './mainContent/MainContent';

// import APIs
import API from './API';

/**
 * SurveyOverview Constructor Obj
 * @param {int} id required
 * @param {string} title required
 * @param {int} nAnswer # of received answers
 * @param {int} nQuestions # of questions in the survey
 */
function SurveyOverview(id, title, nAnswers = 0, nQuestions = 0) {
  this.id = id;
  this.title = title;
  this.nAnswers = nAnswers;
  this.nQuestions = nQuestions;
}

/**
 * Open Ended question obj
 * @param {*} questionId 
 * @param {*} title 
 * @param {*} min 
 */
function OpenQuestion (questionId, title, min = 0) {
  this.questionId = questionId;
  this.title = title;
  this.open = true;
  this.min = min;
  this.max = undefined;
  this.reply = '';
}

/**
 * Single choice for Closed Answer obj  (Used only while compiling/showing answers not while creating a New Survey)
 * @param {*} choiceId 
 * @param {*} choice 
 */
function Choice (choiceId, choice) {
  this.choiceId = choiceId;
  this.choice = choice;
}

/**
 * Closed Answer question obj
 * @param {*} questionId 
 * @param {*} title 
 * @param {*} min 
 * @param {*} max 
 */
function ClosedQuestion (questionId, title = '', min = 0, max = 1) {
  this.questionId = questionId;
  this.title = title;
  this.open = false;
  this.min = min;
  this.max = max;
  this.answers = []; // Choices
  this.reply = [];  // User Answer[s]
  this.addAnswer = (answer) => {  // Add new string (each string is a choice at creation survey time) or new Choice obj (at compile/show time) 
    this.answers.push(answer);
  }
}

/**
 * New Survey obj
 * @param {*} id 
 * @param {*} title 
 * @param {*} nQuestions 
 */
function NewSurvey(id = 0, title = '', nQuestions = 0) {
  this.id = id;
  this.title = title;
  this.nQuestions = nQuestions;
  this.questionsList = [];

  this.replyId = -1; // Used while retrieving replies as admin
  this.username = ''; // Used while compile it

  this.questionsUp = () => {
    this.nQuestions += 1;
  };

  this.questionsDown = () => {
    this.nQuestions -= 1;
  }

  this.addQuestion = (question) => {
    this.questionsList.push(question);
  };

  this.getLastId = () => {
    return this.questionsList.length;
  }
}

function App() {

  // State to handle the logged in - logged out
  const [loggedIn, setLoggedIn] = useState(undefined);
  // Save user info to display them if needed (in the navbar)
  const [username, setUsername] = useState('');
  // Handle login response message
  const [message, setMessage] = useState('');

  // List of opened/available surveys that can be filled
  const [surveyList, setSurveyList] = useState([]);

  // Useful to maintain knowledge of auth state if going to a new page or refreshing while already authenticated
  useEffect(() => {
    API.getUserInfo().then(user => { setLoggedIn(true); setUsername(user.name); }).catch(err => {console.error(err.error); setLoggedIn(false)});
  }, []);

  // Handle login
  const doLogIn = async (credentials) => {
    try {
      const user = await API.logIn(credentials);
      setUsername(user.name);
      setLoggedIn(true);
      setMessage({ msg: "Welcome, " + user.name + "!", type: "success" });
    } catch (err) {
      setMessage({ msg: err, type: "danger" });
    }
  }

  // Handle logout
  const doLogOut = async () => {
    await API.logOut();
    setLoggedIn(false);
    setUsername('');
    setMessage('');
  }

  return (
    <Router>
      <Container fluid>
        <Switch>
          <Route exact path="/login" render={() => 
              <>
                {loggedIn === true ? 
                  <Redirect to="/my-surveys" /> : 
                  <LoginForm login={doLogIn} message={message} setMessage={setMessage}/>}
              </>
            }>
          </Route>
        </Switch>

        <NavbarCustom loggedIn={loggedIn} username={username} logout={doLogOut}/>

        <Row className="vheight-100">
          <MainContent surveyList={surveyList} setSurveyList={setSurveyList} constr={SurveyOverview} loggedIn={loggedIn} constrOpenQuestion={OpenQuestion} constrClosedQuestion={ClosedQuestion} constrNewSurvey={NewSurvey} constrChoice={Choice}/>
        </Row>
        {loggedIn === false ? <Redirect to="/" /> : <></>}
        
      </Container>
    </Router>
  );
}

export default App;
