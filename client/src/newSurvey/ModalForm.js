import { useState } from 'react';
import { Modal, Button, Form, Col } from 'react-bootstrap';

function QuestionForm(props) {

    // Show the right Form title based on the type of new survey
    const message = props.style ? "Here you can create a new open-ended question and decide if the answer is required or not. Remember that a user will only be able to write 200 characters at most. Don't ask too much!" 
        : "Here you can create a new closed-answer question, decide if is mandatory or not and how many answers a user can select!"

    // Flag to set isInvalid on Form.Control if the validation finds errors
    let invalidTitleFlag = ((props.validated === true && props.emptyTitle === true) || (props.validated === true && props.emptyTitle === false && props.longTitle === false));
    let invalidChoicesFlag = (props.validated === true && props.emptyChoices === true);
    let invalidMin = (props.validated === true && props.validMin === false);
    let invalidMax = (props.validated === true && props.validMax === false);

    //Form.Control.Feedback error messages for title. They're shown only when conditions are met
    let emptyTitleErrorMessage = (props.validated === true && props.emptyTitle === true) ?
        (<Form.Control.Feedback type="invalid">Please provide a valid question.</Form.Control.Feedback>) : "";
    let shortTitleErrorMessage = (props.validated === true && props.emptyTitle === false && props.longTitle === false) ?
        (<Form.Control.Feedback type="invalid">The question must be at least 5 characters long.</Form.Control.Feedback>) : "";
    let emptyChoicesErrorMessage = (props.validated === true && props.emptyChoices === true) ?
        (<Form.Control.Feedback type="invalid">Please provide some valid choices.</Form.Control.Feedback>) : "";
    let minChoicesErrorMessage = (props.validated === true && props.validMin === false) ?
        (<Form.Control.Feedback type="invalid">Please provide a valid minimum number.</Form.Control.Feedback>) : "";
    let maxChoicesErrorMessage = (props.validated === true && props.validMax === false) ?
        (<Form.Control.Feedback type="invalid">Please provide a valid maximum number.</Form.Control.Feedback>) : "";


    return (
        <Form>
            <Form.Text>
                {message}
            </Form.Text>
            <br />
            <Form.Row>
                <Form.Group as={Col} xs={12} controlId="titleForm">
                    <Form.Label>Write Your Question</Form.Label>
                    <Form.Control type="text" placeholder="Write here..." value={props.questionTitle}
                        onChange={(event) => props.setQuestionTitle(event.target.value)} isInvalid={invalidTitleFlag} />
                    {emptyTitleErrorMessage}
                    {shortTitleErrorMessage}
                </Form.Group>
            </Form.Row>
            { props.style ? <></> : <Form.Row><Form.Group as={Col} xs={12} controlId="choices">
                    <Form.Label>Set choices separated with a comma</Form.Label>
                    <Form.Control as="textarea" value={props.choices} onChange={(event) => props.setChoices(event.target.value)} isInvalid={invalidChoicesFlag}>
                    </Form.Control>
                    {emptyChoicesErrorMessage}
                </Form.Group></Form.Row> }
            { props.style ? <Form.Row>
                <Form.Group as={Col} xs={8} controlId="mandatoryMin">
                    <Form.Label>Set Mandatory (0 or 1)</Form.Label>
                    <Form.Control type="text" placeholder="1 mandatory / 0 optional" value={props.min} onChange={event => props.setMin(event.target.value)} isInvalid={invalidMin}>
                    </Form.Control>
                    {minChoicesErrorMessage}
                </Form.Group>
                </Form.Row> : 
                <Form.Row>
                <Form.Group as={Col} xs={8} controlId="mandatoryMin">
                    <Form.Label>Set minimum number of answers</Form.Label>
                    <Form.Control type="text" placeholder="User will give at least N answers!" value={props.min} onChange={event => props.setMin(event.target.value)} isInvalid={invalidMin}>
                    </Form.Control>
                    {minChoicesErrorMessage}
                </Form.Group>
                </Form.Row> 
            }
            { props.style ? <></> : <Form.Row><Form.Group as={Col} xs={8} controlId="answersMax">
                    <Form.Label>Set maximum number of answers</Form.Label>
                    <Form.Control type="text" placeholder="User will give at most N answers!" value={props.max} onChange={(event) => props.setMax(event.target.value)} isInvalid={invalidMax}>
                    </Form.Control>
                    {maxChoicesErrorMessage}
                </Form.Group></Form.Row> 
            }
        </Form>
    );
}

function ModalForm(props) {

    // States for the fields of the form 
    const [questionTitle, setQuestionTitle] = useState(props.modalQuestion.title);
    const [min, setMin] = useState(props.modalQuestion.min);
    const [max, setMax] = useState(props.modalQuestion.max);
    const [choices, setChoices] = useState("");

    // Boolean to decide the correct component to render
    const style = (max === undefined);

    // Setup Modal title
    const modalTitle = style ? "New Open-Ended Question" : "New Closed-Answer Question";

    //States used for validation:
    // emptyTitle : true if the question title is empty, false otherwise
    const [emptyTitle, setEmptyTitle] = useState(true);
    // longTitle : true if the question title is long enough (5 chars), false otherwise
    const [longTitle, setLongTitle] = useState(false);
    // emptyChoices : true if the question choices textarea is empty, false otherwise
    const [emptyChoices, setEmptyChoices] = useState(true);
    // validMin : true if min is a valid min number
    const [validMin, setValidMin] = useState(false);
    // validMax : true if max is a valid min number
    const [validMax, setValidMax] = useState(false);
    // validated : becomes true after the first submit so that error messages are shown
    const [validated, setValidated] = useState(false);

    // Add a new question using the proper constructor
    const addQuestionThenCloseModal = () => {
        let newMaxId = 0;    // Useful to setup a new temporary questionId to a new max
        if (style)
            // Add Open-Ended question to survey
            props.setQuestionsList(old => {
                for (let q of old)
                    if (q.questionId > newMaxId)
                        newMaxId = q.questionId;
                old.push(new props.constrOpenQuestion(newMaxId+1, questionTitle, parseInt(min)));
                return old;
            });
        else
            // Add Closed-Answer question to survey
            props.setQuestionsList(old => {
                for (let q of old)
                    if (q.questionId > newMaxId)
                        newMaxId = q.questionId;
                const question = new props.constrClosedQuestion(newMaxId+1, questionTitle, parseInt(min), parseInt(max));
                for (let answer of choices.split(/,+/))
                    question.addAnswer(answer);
                old.push(question);
                return old;
            });
        
        props.setModal(false);
    }

    const handleSubmit = (event) => {
        event.preventDefault();

        // Valid form, add the new question
        if (style) { // OPEN ENDED QUESTION
            if (questionTitle.length >= 5 && !isNaN(parseInt(min)) && ( parseInt(min) === 1 || parseInt(min) === 0 ))
                addQuestionThenCloseModal();
            else {
                // Invalid question, shows/updates properly the error messages
                if (questionTitle.length === 0) {
                    setEmptyTitle(true);
                    setLongTitle(false);
                } 
                else if (questionTitle.length < 5 && questionTitle.length > 0) {
                    setEmptyTitle(false);
                    setLongTitle(false);
                }
                else {
                    setEmptyTitle(false);
                    setLongTitle(true);
                }
                // Invalid min
                if (isNaN(parseInt(min)) || parseInt(min) > 1 || parseInt(min) < 0) {
                    setValidMin(false);
                }   
                else {
                    setValidMin(true);
                }
            }
        }
        else {
            let result = [];
            if (choices !== '')
                result = choices.split(/,+/);
            if (questionTitle.length >= 5 && !isNaN(parseInt(min)) && parseInt(max) >= parseInt(min) && choices !== '' && parseInt(max) <= result.length && parseInt(min) <= result.length && parseInt(max) >= 0 && parseInt(min) >= 0)
                addQuestionThenCloseModal();
            else {
                // Invalid form fields, shows/updates properly the error messages
                if (questionTitle.length === 0) {
                    setEmptyTitle(true);
                    setLongTitle(false);
                } 
                else if (questionTitle.length < 5 && questionTitle.length > 0) {
                    setEmptyTitle(false);
                    setLongTitle(false);
                }
                else {
                    setEmptyTitle(false);
                    setLongTitle(true);
                }
                // Invalid choices
                if (choices.length === 0)
                    setEmptyChoices(true);
                else
                    setEmptyChoices(false);
                // Invalid Max
                if (parseInt(max) < parseInt(min) || parseInt(max) > result.length || parseInt(max) < 0)
                    setValidMax(false);
                else 
                    setValidMax(true);
                // Invalid Min
                if (parseInt(min) > parseInt(max) || parseInt(min) > result.length || parseInt(min) < 0)
                    setValidMin(false);
                else 
                    setValidMin(true);
            }
        }
        //From the first time that the user clicks on the Save button the validated state is set to true
        setValidated(true);
    };

    return (
        <Modal show={true} onHide={() => props.setModal(false)} backdrop="static" keyboard={false} centered animation={false}>
            <Modal.Header closeButton>
                <Modal.Title>{modalTitle}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {style ? 
                    <QuestionForm style={style} questionTitle={questionTitle} setQuestionTitle={setQuestionTitle} min={min} setMin={setMin} validated={validated} emptyTitle={emptyTitle} longTitle={longTitle} validMin={validMin}/>
                    :
                    <QuestionForm style={style} questionTitle={questionTitle} setQuestionTitle={setQuestionTitle} min={min} setMin={setMin} max={max} setMax={setMax} validated={validated} emptyTitle={emptyTitle} longTitle={longTitle} choices={choices} setChoices={setChoices} emptyChoices={emptyChoices} validMin={validMin} validMax={validMax}/>
                }
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={() => props.setModal(false)}>
                    Close
                </Button>
                <Button variant="success" onClick={handleSubmit}>
                    Save
                </Button>
            </Modal.Footer>
        </Modal>
    );
}

export default ModalForm;
