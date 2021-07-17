import { useState, useEffect } from "react";
import { Container, Row, Col, Form, ListGroup, Button, Alert, Image, Pagination } from "react-bootstrap";
import { useHistory } from "react-router-dom";

import ModalForm from "./ModalForm";
import okQuestion from "../icons/check-circle-fill.svg";
import showQuestion from "../icons/search.svg";

// import APIs
import API from '../API';

// Button and Icon wrapper
function QuestionControl(props) {
    return (
        <div>
            <Button size="sm" variant="light-variant" as="img" src={showQuestion} onClick={ () => {
                // Update the modalQuestion state with the question and the related reply that will be passed to the modal form
                props.setModalQuestion(props.question); 
                // Set modal to true to create and open the modal form
                props.setModal(true);
            }} />
            { props.question.max === undefined  ? (props.question.reply !== "" ? <Image src={okQuestion} className="ml-2"/> : <></>) 
                :  (props.question.reply.length !== 0 ? <Image src={okQuestion} className="ml-2"/> : <></>) }
        </div>
    );
}

function Question(props) {
    return (
        <ListGroup.Item className="d-flex w-100 jusfity-content-between">
            <Col>{props.question.title + " "} {props.question.min > 0 ? <span className="required">*</span>: ""} </Col>
            <QuestionControl question={props.question} setModal={props.setModal} setModalQuestion={props.setModalQuestion} />
        </ListGroup.Item>
    );
}


// Component used to display the list of questions of the new survey IN CREATION
function Body(props) {

    return (
        <Container fluid>
            <ListGroup variant="flush" className="below-title">
                <ListGroup.Item>
                </ListGroup.Item>
                <ListGroup.Item>
                    <Form>
                        <Form.Group>
                            <Form.Row>
                                <Form.Label column="lg" xs={3} >Title</Form.Label>
                                <Col xs={9}>
                                <Form.Label column="lg" xs={9} >{props.survey.title}</Form.Label>
                                </Col>
                            </Form.Row>
                        </Form.Group>
                    </Form>
                    <Row>
                        <Alert xs={12} variant="primary">All fields and questions marked with (<span className="required">*</span>) are required!</Alert>
                    </Row>
                </ListGroup.Item>
                <ListGroup.Item>
                    <Form>
                        <Form.Group>
                            <Form.Row>
                                <Form.Label column xs={3}>Name<span className="required"> *</span></Form.Label>
                                <Col xs={9}>
                                <Form.Label column="lg" xs={9} >{props.username}</Form.Label>
                                </Col> 
                            </Form.Row>
                        </Form.Group>
                    </Form>
                </ListGroup.Item>
                {/* Show a summary of each question created */}
                { props.questionsList.map(question => <Question key={question.questionId} question={question} setModal={props.setModal} setModalQuestion={props.setModalQuestion} />)}
                <ListGroup.Item>
                </ListGroup.Item>
            </ListGroup>
            
        </Container>
    );
}

// Component Wrapper to display the body of a new survey in creation and the related buttons to add new questions
function ShowResults(props) {

    // Survey to be displayed
    const [survey, setSurvey] = useState(new props.constrNewSurvey());
    const [username, setUsername] = useState("");
    const [questionsList, setQuestionsList] = useState([]);

    // Define a loading state that will be true at mounting time (of the component) 
    // and will be set to false as soon as the survey is retrieved from the server.
    const [loading, setLoading] = useState(true);
    //State used to register that an error has occurred during a HTTP request
    const [error, setError] = useState(false);
    //State used to store the error message of the HTTP request
    const [errorText, setErrorText] = useState(""); 


    // Retrieve through server APIs all infos about the survey to be compiled
    
    // Retrieve survey overview
    useEffect(() => {
        async function exec() {
            if(props.surveyId != null && props.replyId != null) {
                let toBeCompiled;
                await API.loadSurveyToCompile(props.surveyId)
                    .then(survey => toBeCompiled = new props.constrNewSurvey(survey.id, survey.title, survey.nQuestions))
                    .catch(err => { setErrorText(err.msg); setError(true); });
                if (!error)
                    setSurvey(toBeCompiled);
            }
        }
        exec();
    }, [props.constrNewSurvey, props.surveyId, props.replyId, props.constrClosedQuestion, props.constrOpenQuestion, props.constrChoice, error]);

    // Retrieve all questions
    useEffect(() => {
        async function exec() {
            let toBeLoaded = [];
            await API.loadQuestions(props.surveyId).then(questionsList => {
                questionsList.forEach( async question => { 
                    if (question.max === -1) {    // Open ended
                        toBeLoaded.push(new props.constrOpenQuestion(question.questionId, question.questionTitle, question.min));
                    }
                    else {
                        const closed = new props.constrClosedQuestion(question.questionId, question.questionTitle, question.min, question.max);
                        toBeLoaded.push(closed);
                    }
                });
                setQuestionsList(toBeLoaded);
            }).catch(err => { setErrorText(err.msg); setError(true); });
        }
        exec();
    }, [props.constrOpenQuestion, props.constrClosedQuestion, props.surveyId, survey]);

    // Retrieve reply's username
    useEffect(() => {
        async function exec() {
            if(props.surveyId != null && props.replyId != null) {
                let username = await API.getUsername(props.surveyId, props.replyId).catch(err => {
                    props.history.push('/');
                });
                if (username && !username.msg)
                    setUsername(username);
            }
        }
        exec();
    }, [props.history, props.constrNewSurvey, props.surveyId, props.replyId, props.constrClosedQuestion, props.constrOpenQuestion, props.constrChoice, error]);
    
    // Retrieve questions' choices
    useEffect(() => {
        async function exec() {
            if(props.surveyId != null && props.replyId != null) {
                for (let question of questionsList) {
                    if (question.open === false)
                        API.loadChoices(props.surveyId, question.questionId).then(choiceList =>
                            choiceList.forEach(choice => { 
                                question.addAnswer(new props.constrChoice(choice.choiceId, choice.choice));
                            }));
                }
            }
        }
        exec();
    }, [props.surveyId, props.replyId, props.constrChoice, error, questionsList]);

    // Retrieve all related replies
    useEffect(() => {
        async function exec() {
                if(props.surveyId != null && props.replyId != null) {
                    for (let question of questionsList) {
                        API.loadReplies(props.surveyId, props.replyId, question.questionId, question.open).then(repliesList => {
                            if (question.open === false)
                                repliesList.forEach(reply =>
                                    question.reply.push(reply.choiceId));
                            else 
                                question.reply = repliesList;
                        }).catch(err => {
                            props.history.push('/');
                        });
                    }
                }
        }
        exec();
        setLoading(false);
    }, [props.history, props.surveyId, props.replyId, props.constrChoice, error, questionsList]);
    
    
    // Modal state to show/unshow it
    const [modal, setModal] = useState(false);
    // Set up 2 state to contian all the info related to the specific survey to be compiled
    const [modalQuestion, setModalQuestion] = useState(undefined);

    return (
        <>
        <Container fluid>
        <Row>
                <h1 className="col-md-9 display-4 below-title">Show Results</h1>
                <div className="col text-right below-title"><Pagination>{props.pagination}</Pagination></div>
        </Row>
        </Container>
        { props.error ? (<Alert variant="danger">{errorText}</Alert>) : (loading ? "" : <Body survey={survey} username={username} questionsList={questionsList} setModal={setModal} setModalQuestion={setModalQuestion} />) }
        { modal && (<ModalForm modalQuestion={modalQuestion} setModal={setModal} /> ) }
        </>
    );
}


function ShowResultsWrapper(props) {

    const history = useHistory();

    // Handle pagination to navigate replies using (surveyId, repliesId)
    const [pagination, setPagination] = useState();

    useEffect(() => {
        let items = [];
        for (let n = 1; n <= props.numberOfReplies; n++) {
            items.push(
                <Pagination.Item key={n} active={n === parseInt(props.replyId)} onClick={() => history.push("/show-results/"+props.surveyId+"/"+props.numberOfReplies+"/"+n)}>
                    {n}
                </Pagination.Item>
            );
        }
        setPagination(items);
    }, [props.numberOfReplies, history, props.surveyId, props.replyId]);

    return (
        <ShowResults surveyId={props.surveyId} replyId={props.replyId} pagination={pagination} constrOpenQuestion={props.constrOpenQuestion} constrClosedQuestion={props.constrClosedQuestion} constrNewSurvey={props.constrNewSurvey} constrChoice={props.constrChoice} history={history} />
    );
}

export default ShowResultsWrapper;