import { useState, useEffect } from "react";
import { Container, Row, Col, Form, ListGroup, Button, Alert, Image } from "react-bootstrap";
import { useHistory } from "react-router-dom";

import ModalForm from "./ModalForm";
import okQuestion from "../icons/check-circle-fill.svg";
import fillQuestion from "../icons/pencil.svg";

// import APIs
import API from '../API';

// Button and Icon wrapper
function QuestionControl(props) {
    return (
        <div>
            <Button size="sm" variant="light-variant" as="img" src={fillQuestion} onClick={ () => {
                // Update the modalQuestion state with a question that will be passed to the modal form
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
            <Col>{props.question.title + " "} {props.question.min > 0 ? <span className="required">*</span>: ""} {(props.question.open === true) ? <>Open</> : <>Closed</>}</Col>
            <QuestionControl question={props.question} setModal={props.setModal} setModalQuestion={props.setModalQuestion} />
        </ListGroup.Item>
    );
}


// Component used to display the list of questions of the new survey IN CREATION
function Body(props) {

    let emptyMandatory = (props.validated === true && props.emptyMandatory === true);
    const emptyMandatoryMessage = (props.validated === true && props.emptyMandatory === true) ?
        "Please be sure to fill all required questions before submitting" : "";
    const emptyUsernameMessage = (props.validated === true && props.emptyUsername === true) ?
        (<Form.Control.Feedback type="invalid">Please provide a name.</Form.Control.Feedback>) : "";
    let invalidUsername = (props.validated === true && props.emptyUsername === true);

    return (
        <Container fluid>
            <Row>
                <h1 className="col-md-9 display-4 below-title">Compile it!</h1>
                <div className="col-md-3 text-right below-title"><Button className="col" variant="success" size="md" onClick={props.handleSubmit} >Send Answer</Button></div>
            </Row>
            <ListGroup variant="flush" className="below-title">
                <ListGroup.Item>
                { emptyMandatory ? (<Row>
                            <Alert xs={12} variant="danger">{emptyMandatoryMessage}</Alert>
                        </Row>) : <></> }
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
                                <Form.Label column xs={3}>Insert your name<span className="required"> *</span></Form.Label>
                                <Col xs={9}>
                                <Form.Control type="text" placeholder="You can call me..." value={props.username} onChange={event => props.setUsername(event.target.value)} isInvalid={invalidUsername}/>
                                {emptyUsernameMessage}
                                </Col> 
                            </Form.Row>
                        </Form.Group>
                    </Form>
                </ListGroup.Item>
                {/* Show a summary of each question created */}
                { props.survey.questionsList.map(question => <Question key={question.questionId} question={question} setModal={props.setModal} setModalQuestion={props.setModalQuestion} />)}
                <ListGroup.Item>
                </ListGroup.Item>
            </ListGroup>
            
        </Container>
    );
}

// Component Wrapper to display the body of a new survey in creation and the related buttons to add new questions
function NewAnswer(props) {

    // Modal state to show/unshow it
    const [modal, setModal] = useState(false);
    // Set up 2 state to contian all the info related to the specific survey to be compiled
    const [modalQuestion, setModalQuestion] = useState(undefined);

    return (
        <>
        { props.error ? (<Alert variant="danger">{props.errorText}</Alert>) : (props.loading ? "" : <Body username={props.username} setUsername={props.setUsername} validated={props.validated} emptyUsername={props.emptyUsername} emptyMandatory={props.emptyMandatory} survey={props.survey} handleSubmit={props.handleSubmit} setModal={setModal} setModalQuestion={setModalQuestion}/>) }
        { modal && (<ModalForm modalQuestion={modalQuestion} setModal={setModal} /> ) }
        </>
    );
}


function NewAnswerWrapper(props) {

    const history = useHistory();
    
    // Set up 2 state to give an initial value to be shown when starting adding a new survey or a new question
    const [survey, setSurvey] = useState(new props.constrNewSurvey());
    // username that will be used to mark this reply
    const [username, setUsername] = useState("");

    // emptyTitle : true if the question title is empty, false otherwise
    const [emptyUsername, setEmptyUsername] = useState(true);
    // emptyMandatory : true if some mandatory question is not filled
    const [emptyMandatory, setEmptyMandatory] = useState(true);
    // validated : becomes true after the first submit so that error messages are shown
    const [validated, setValidated] = useState(false);

    // Define a loading state that will be true at mounting time (of the component) 
    // and will be set to false as soon as the survey is retrieved from the server.
    const [loading, setLoading] = useState(true);
    //State used to register that an error has occurred during a HTTP request
    const [error, setError] = useState(false);
    //State used to store the error message of the HTTP request
    const [errorText, setErrorText] = useState("");

    

    // Callback to submit a New Survey to backend using APIs
    const saveReply = async () => {
        for (let question of survey.questionsList)
            console.log(question.reply);
        
        setSurvey(old => { old.username = username; return old; }); // Set Reply Username
        let response = API.addNewReply(survey);
        if (response)
            history.push("/");
        else
            console.log("Error with request.");
    }

    // Validation on required answers
    const handleSubmit = (event) => {
        event.preventDefault();

        let required = 0;
        for (let question of survey.questionsList) {
            if (question.min > 0) { // If mandatory
                if (question.max === undefined && question.reply.length === 0) {    // If not answered required = 1
                    required = 1;
                    break;
                }
                if (question.max > 0 && question.reply.length === 0) {  // If not answered required = 1
                    required = 1;
                    break;
                }
            }
        }

        if (username.length > 0 && required === 0) 
            saveReply();
        else {
            if (username.length === 0)
                setEmptyUsername(true);
            else 
                setEmptyUsername(false);
            if (required === 1)
                setEmptyMandatory(true);
            else
                setEmptyMandatory(false);
        }
        setValidated(true);
    }
    

    // Retrieve through server APIs all infos about the survey to be compiled
    useEffect(() => {
        if(props.surveyId != null) {
            let toBeCompiled;
            API.loadSurveyToCompile(props.surveyId)
                .then(survey => toBeCompiled = new props.constrNewSurvey(survey.id, survey.title, survey.nQuestions))
                .catch(err => { setErrorText(err.msg); setError(true); })
            if (!error) {
                API.loadQuestions(props.surveyId).then(questionsList => {
                    questionsList.forEach(question => { 
                        if (question.max === -1)    // Open ended
                            toBeCompiled.addQuestion(new props.constrOpenQuestion(question.questionId, question.questionTitle, question.min));
                        else {
                            const closed = new props.constrClosedQuestion(question.questionId, question.questionTitle, question.min, question.max);
                            API.loadChoices(props.surveyId, closed.questionId).then(choiceList =>
                                choiceList.forEach(choice => closed.addAnswer(new props.constrChoice(choice.choiceId, choice.choice))));
                            toBeCompiled.addQuestion(closed);
                        }
                    });
                    setSurvey(toBeCompiled);
                }).catch(err => { setErrorText(err.msg); setError(true); }).finally(() => setLoading(false));
            }
        }
    }, [props.constrNewSurvey, props.surveyId, props.constrClosedQuestion, props.constrOpenQuestion, props.constrChoice, error]);

    return (
        <NewAnswer validated={validated} survey={survey} username={username} setUsername={setUsername} handleSubmit={handleSubmit} constrOpenQuestion={props.constrOpenQuestion} constrClosedQuestion={props.constrClosedQuestion} constrNewSurvey={props.constrNewSurvey} 
            error={error} errorText={errorText} loading={loading} emptyUsername={emptyUsername} emptyMandatory={emptyMandatory} />
    );
}

export default NewAnswerWrapper;