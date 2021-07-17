import { useState } from "react";
import { Container, Row, Col, Form, ListGroup, Button, Navbar, Alert } from "react-bootstrap";
import { useHistory } from "react-router-dom";

import ModalForm from "./ModalForm";
import deleteButton from "../icons/trash-fill.svg";
import iconUp from "../icons/caret-up-fill.svg";
import iconDown from "../icons/caret-down-fill.svg";

// import APIs
import API from '../API';


// Button and Icon wrapper
function QuestionControl(props) {
    return (
        <div>
            { props.id === props.firstId() ? "" : <Button size="sm" variant="light-variant" as="img" src={iconUp} onClick={() => props.moveUp(props.id)}/> }
            { props.id === props.lastId() ? "" : <Button size="sm" variant="light-variant" as="img" src={iconDown} onClick={() => props.moveDown(props.id)}/> }
            <Button size="sm" variant="light-variant" as="img" src={deleteButton} onClick={() => props.deleteQuestion(props.id) } />
        </div>
    );
}


// Question wrapper
function Question(props) {
    return (
        <ListGroup.Item className="d-flex w-100 jusfity-content-between">
            <Col>{props.question.title + " "} {props.question.min > 0 ? <span className="required">*</span>: ""} {(props.question.open === true) ? <>Open</> : <>Closed</>}</Col>
            <QuestionControl question={props.question} id={props.id} firstId={props.firstId} lastId={props.lastId} deleteQuestion={props.deleteQuestion} moveUp={props.moveUp} moveDown={props.moveDown} />
        </ListGroup.Item>
    );
}

// Component used to display the list of questions of the new survey IN CREATION
function Body(props) {

    let emptyQuestions = (props.validated === true && props.emptyQuestions === true);
    const emptyQuestionsMessage = (props.validated === true && props.emptyQuestions === true) ?
        "Please be sure to create at least a question before submitting" : "";
    const emptySurveyTitleErrorMessage = (props.validated === true && props.emptySurveyTitle === true) ?
        (<Form.Control.Feedback type="invalid">Please provide a survey title.</Form.Control.Feedback>) : "";
    let invalidSurveyTitle = (props.validated === true && props.emptySurveyTitle === true);

    return (
        <Container fluid>
            <Row>
                <h1 className="col-md-9 display-4 below-title">Survey Creation</h1>
                <div className="col-md-3 text-right below-title"><Button className="col" variant="success" size="md" onClick={props.handleSubmit} >Publish Survey</Button></div>
            </Row>
            <ListGroup variant="flush" className="below-title">
                <ListGroup.Item>
                    { emptyQuestions ? (<Row>
                            <Alert xs={12} variant="danger">{emptyQuestionsMessage}</Alert>
                        </Row>) : <></> }
                </ListGroup.Item>
                <ListGroup.Item>
                <Form>
                    <Form.Group>
                        <Form.Row>
                            <Form.Label column="lg" xs={3} >Title*</Form.Label>
                            <Col xs={9}>
                                <Form.Group>
                                    <Form.Control size="lg" type="text" placeholder="Survey title here..." value={props.surveyTitle} onChange={event => props.setSurveyTitle(event.target.value)} isInvalid={invalidSurveyTitle} />
                                    {emptySurveyTitleErrorMessage}
                                </Form.Group>
                            </Col>
                        </Form.Row>
                    </Form.Group>
                    <Form.Group>
                        <Form.Row>
                            <Form.Label column xs={3}>Insert your name*</Form.Label>
                            <Col xs={9}>
                            <Form.Control type="text" placeholder="The user will insert his/her name here, so you can keep track of their answers..." disabled></Form.Control>
                            </Col>
                        </Form.Row>
                    </Form.Group>
                </Form>
                </ListGroup.Item>
                {/* Show a summary of each question created */}
                { props.questionsList.map((question, idx) => <Question key={idx+1} question={question} id={question.questionId} firstId={props.firstId} lastId={props.lastId} deleteQuestion={props.deleteQuestion} moveUp={props.moveUp} moveDown={props.moveDown} />) }
                <ListGroup.Item>
                </ListGroup.Item>
            </ListGroup>
            
        </Container>
    );
}

// Component Wrapper to display the body of a new survey in creation and the related buttons to add new questions
function NewSurvey(props) {

    // Modal state to show/unshow it
    const [modal, setModal] = useState(false);
    const [modalQuestion, setModalQuestion] = useState(undefined);

    // Return the maximum questionId inside the questionList
    const lastId = () => {
        let max = 0;
        for (let q of props.questionsList)
            if (q.questionId > max)
                max = q.questionId;
        return max;
    }

    const firstId = () => {
        let min = -1;
        let i = 0;
        for (let q of props.questionsList) {
            if (i === 0)
                min = q.questionId;
            if (q.questionId < min)
                min = q.questionId;
            i += 1;
        }
        return min;
    }

    // Delete a question
    const deleteQuestion = (id) => {
        props.setQuestionsList(old => {

            // Remove the correct question
            const list = old.filter(question => {
                if(question.questionId !== id) {
                    return true;
                }
                return false;
            });
            return list;
        });
    }

    // Move up the question of one position
    const moveUp = (id) => {
        props.setQuestionsList(old => {
            // Set the new questionIds (swap or nothing)
            if (id === firstId())
                return old;
            let list = [];
            let temp = -1;
            let i = 0;
            for (let q of old) {
                if (q.questionId === id) {
                    temp = JSON.parse(JSON.stringify(list[i-1]));
                    list[i-1] = JSON.parse(JSON.stringify(old[i]));
                    list[i-1].questionId = temp.questionId; 
                    list[i] = JSON.parse(JSON.stringify(temp));
                    list[i].questionId = old[i].questionId;
                } else 
                    list[i] = q;
                i++;
            }
            return list;
        });
    }

    // Move down the question of one position
    const moveDown = (id) => {
        props.setQuestionsList(old => {
            // Set the new questionIds (swap or nothing)
            if (id === lastId())
                return old;
            let list = [];
            let temp = -1;
            let nextId = -1;
            let i = 0;
            for (let q of old) {
                if (q.questionId === id) {
                    temp = JSON.parse(JSON.stringify(old[i+1]));
                    nextId = temp.questionId;
                    list[i+1] = JSON.parse(JSON.stringify(old[i]));
                    list[i+1].questionId = temp.questionId; 
                    list[i] = JSON.parse(JSON.stringify(temp));
                    list[i].questionId = old[i].questionId;
                } else if (nextId === q.questionId) {
                    i += 1;
                    continue; 
                }
                else 
                    list[i] = q;
                i += 1;
            }
            return list;
        });
    }

    return (
        <>
        <Body surveyTitle={props.surveyTitle} setSurveyTitle={props.setSurveyTitle} emptySurveyTitle={props.emptySurveyTitle} emptyQuestions={props.emptyQuestions} validated={props.validated} questionsList={props.questionsList} firstId={firstId} lastId={lastId} handleSubmit={props.handleSubmit} deleteQuestion={deleteQuestion} moveUp={moveUp} moveDown={moveDown} />
        { modal && (<ModalForm modalQuestion={modalQuestion} setModal={setModal} constrOpenQuestion={props.constrOpenQuestion} constrClosedQuestion={props.constrClosedQuestion} setQuestionsList={props.setQuestionsList} /> ) }
        <Navbar fixed="bottom panthom">
            <Button type="button" variant="success" className="mr-4" onClick={() => {
                    // Add button
                    // Update the modalQuestion state with an empty question that will be passed to the modal form
                    setModalQuestion({
                        title: "",
                        min: 0,
                        max: 1
                    });

                    // Set modal to true to create and open the modal form
                    setModal(true);
                }}>Add Closed-Answer Question
            </Button>
            <Button type="button" variant="success" onClick={() => {
                    // Add button
                    // Update the modalQuestion state with an empty question that will be passed to the modal form
                    setModalQuestion({
                        title: "",
                        min: 0,
                        max: undefined
                    });

                    // Set modal to true to create and open the modal form
                    setModal(true);
                }}>Add Open-Ended Question
            </Button>
        </Navbar>
        </>
    );
}

function NewSurveyWrapper(props) {

    const history = useHistory();
    
    // Set up 2 state to give an initial value to be shown when starting adding a new survey or a new question
    const [survey, setSurvey] = useState(new props.constrNewSurvey());
    const [surveyTitle, setSurveyTitle] = useState("");
    // State to contain array of new questions (useful to avoid nested components here)
    const [questionsList, setQuestionsList] = useState([]);

    // emptyTitle : true if the question title is empty, false otherwise
    const [emptySurveyTitle, setEmptySurveyTitle] = useState(true);
    // emptyQuestions : true if the list of questions is empty
    const [emptyQuestions, setEmptyQuestions] = useState(true);
    // validated : true after the first submit so that error messages are shown
    const [validated, setValidated] = useState(false);

    // Callback to submit a New Survey to backend using APIs
    const saveSurvey = async () => {
        setSurvey(old => { old.title = surveyTitle; old.questionsList = questionsList; old.nQuestions = questionsList.length; return old; }); // Set Survey Title, questions list and number of questions
        let response = await API.addNewSurvey(survey, surveyTitle, questionsList);
        if (response)
            history.push("/my-surveys");
        else
            console.log("Error with request.");
    }

    const handleSubmit = (event) => {
        event.preventDefault();
        if (surveyTitle.length > 0 && questionsList.length > 0)
            saveSurvey();
        else {
            if (surveyTitle.length === 0)
                setEmptySurveyTitle(true);
            else 
                setEmptySurveyTitle(false);
            if (questionsList.length === 0)
                setEmptyQuestions(true);
            else
                setEmptyQuestions(false);
        }
        setValidated(true);
    }

    return (
        <NewSurvey surveyTitle={surveyTitle} setSurveyTitle={setSurveyTitle} emptySurveyTitle={emptySurveyTitle} emptyQuestions={emptyQuestions} validated={validated} questionsList={questionsList} setQuestionsList={setQuestionsList} handleSubmit={handleSubmit} constrOpenQuestion={props.constrOpenQuestion} constrClosedQuestion={props.constrClosedQuestion} constrNewSurvey={props.constrNewSurvey} />
    );
}

export default NewSurveyWrapper;