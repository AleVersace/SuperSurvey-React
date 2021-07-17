import SurveyToCompile from "../surveyToCompile/SurveyToCompile";
import { Container, Row, Col, Button, Alert } from "react-bootstrap";
import { Switch, Route, Link } from "react-router-dom";
import { useState, useEffect } from "react";

import NewSurveyWrapper from "../newSurvey/NewSurvey";
import NewAnswerWrapper from "../surveyToCompile/NewAnswer";
import ShowResultsWrapper from "../showReplies/ShowResults";

// import APIs
import API from '../API';

function UserSurveys(props) {

    // Handle state error during HTTP request
    const [error, setError] = useState(false);
    // Handle state error during HTTP request
    const [errorText, setErrorText] = useState(false);

    const Survey = props.constr;

    const [userSurveyList, setUserSurveyList] = useState([]);

    // Request to get specific User Surveys using APIs
    useEffect(() => {
        API.loadUserSurveys()
            .then(newSurveyList => {
                newSurveyList = newSurveyList.map(s => new Survey(s.id, s.title, s.nAnswers, s.nQuestions));
                setUserSurveyList(newSurveyList);
            })
            .catch(err => { setErrorText(err.msg); setError(true); });
    }, [Survey, setUserSurveyList]);

    return (
        <Container fluid>
            <Row>
                <h1 className="display-4 col-md-9 below-title" >Your Surveys: </h1>
                <Link to="/new-survey" className="col-md-3 text-right below-title"><Button className="col" variant="success" size="md">Create New Survey</Button></Link>
            </Row>
            <Row xs={1} md={3} className="g-4 below-title">
                {error ? (<Alert key={1} variant="danger">{errorText}</Alert>) :
                    userSurveyList.map(survey => (<Col className="below-title" key={survey.id}><SurveyToCompile id={survey.id} title={survey.title} nAnswers={survey.nAnswers} /></Col>))
                }
            </Row>
        </Container>
    );
}

function OpenedSurveys(props) {

    // Handle state error during HTTP request
    const [error, setError] = useState(false);
    // Handle state error during HTTP request
    const [errorText, setErrorText] = useState(false);

    const setSurveyList = props.setSurveyList;
    const Survey = props.constr;

     // Request to get Opened Surveys using APIs
     useEffect(() => {
            API.loadOpenedSurveys()
                .then(newSurveyList => {
                    newSurveyList = newSurveyList.map(s => new Survey(s.id, s.title, s.nAnswers, s.nQuestions));
                    setSurveyList(newSurveyList);
                })
                .catch(err => { setErrorText(err.msg); setError(true); });
    }, [Survey, setSurveyList]);

    return (
        <Container fluid>
            <Row><h1 className="display-4 below-title">Opened Surveys: </h1></Row>
            <Row xs={1} md={3} className="g-4 below-title">
                {error ? (<Alert key={1} variant="danger">{errorText}</Alert>) : 
                    props.surveyList.map((survey) => <Col className="below-title" key={survey.id}><SurveyToCompile title={survey.title} id={survey.id} nQuestions={survey.nQuestions} /></Col>)
                }
            </Row>
        </Container>
    );
}

function MainContent(props) {
    return (
        <main className="col-sm-12 col-12 below-nav">
            <Switch>

                <Route exact path="/">
                    <OpenedSurveys surveyList={props.surveyList} setSurveyList={props.setSurveyList} constr={props.constr} />
                </Route>

                <Route exact path="/my-surveys">
                    { props.loggedIn === true ? <UserSurveys constr={props.constr}/> : <></> }
                </Route>
                
                <Route exact path="/new-survey">
                    { props.loggedIn === true ? <NewSurveyWrapper constrOpenQuestion={props.constrOpenQuestion} constrClosedQuestion={props.constrClosedQuestion} constrNewSurvey={props.constrNewSurvey} /> : <></> }
                </Route>

                <Route exact path="/new-answer/:id" render={({match}) => ( 
                    <NewAnswerWrapper surveyId={match.params.id} constrOpenQuestion={props.constrOpenQuestion} constrClosedQuestion={props.constrClosedQuestion} constrNewSurvey={props.constrNewSurvey} constrChoice={props.constrChoice}/>
                )} />

                <Route exact path="/show-results/:surveyId/:nReply/:replyId" render={({match}) => ( 
                    <ShowResultsWrapper surveyId={match.params.surveyId} numberOfReplies={match.params.nReply} replyId={match.params.replyId} constrOpenQuestion={props.constrOpenQuestion} constrClosedQuestion={props.constrClosedQuestion} constrNewSurvey={props.constrNewSurvey} constrChoice={props.constrChoice}/>
                )} />

            </Switch>
        </main>
    );
}

export {MainContent};