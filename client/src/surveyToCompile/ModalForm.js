import { useState } from 'react';
import { Modal, Button, Form, Col, Row } from 'react-bootstrap';

function QuestionForm(props) {

    const message = (props.min > 1 ? "min: "+props.min+" " : "") + "max: "+props.max; 

    // Flag to set isInvalid on Form.Control if the validation finds errors
    let invalidOpenTextArea = (props.validated === true && props.validOpen === false);
    
    let invalidClosedAnswer = (props.validated === true && props.validClosed === false);
    let invalidMin = (props.validated === true && props.validMin === false);
    let invalidMax = (props.validated === true && props.validMax === false);

    //Form.Control.Feedback error messages for title. They're shown only when conditions are met
    let emptyTextArea = invalidOpenTextArea ?
        (<Form.Control.Feedback type="invalid">Please provide a valid answer.</Form.Control.Feedback>) : "";
    let notEnoughAnswers = invalidMin ?
        (<Form.Control.Feedback type="invalid">Not enough answers provided.</Form.Control.Feedback>) : "";
    let emptyAnswer = invalidClosedAnswer ?
        (<Form.Control.Feedback type="invalid">Please provide an answer.</Form.Control.Feedback>) : "";
    let tooManyAnswers = invalidMax ?
        (<Form.Control.Feedback type="invalid">Too many answers provided.</Form.Control.Feedback>) : "";
    

    return (
        <Form>
            {props.style ? <></> : <><Form.Text>
                {message}
            </Form.Text>
            <br/></> }
            { props.style ? (<Form.Row>
                    <Form.Group as={Col} xs={12} controlId="titleForm">
                        <Form.Label>Write your answer</Form.Label>
                        <Form.Control as="textarea" maxLength="200" placeholder="In my opinion... (max 200 characters)" value={props.questionOpenAnswer}
                            onChange={(event) => props.setQuestionOpenAnswer(event.target.value)} isInvalid={invalidOpenTextArea}/>
                        {emptyTextArea}
                    </Form.Group>
                </Form.Row>) : ((props.max === 1) ?
                    (<fieldset>
                        <Form.Group as={Row} className="mb-3">
                        <Col sm={12}>
                            {props.choices.map(c => <Form.Check
                                key={c.choiceId}
                                type="radio"
                                label={c.choice}
                                name="radios"
                                id="standardRadios"
                                onClick={(event) => { if (event.target.checked) props.setQuestionClosedAnswerRadio(c.choiceId); }} isInvalid={invalidClosedAnswer} />)}
                        </Col>
                        {emptyAnswer}
                        </Form.Group>
                    </fieldset>) :
                    (<Form.Group as={Row} className="mb-3" controlId="formHorizontalCheck">
                        <Col sm={12}>
                            { props.choices.map(c => <Form.Check key={c.choiceId} label={c.choice} onClick={(event) => { 
                                    if (event.target.checked) 
                                        props.addAnswer(c.choiceId); 
                                    else
                                        props.removeAnswer(c.choiceId);
                                }} isInvalid={invalidClosedAnswer || invalidMin || invalidMax}/>) }
                        </Col>
                        {emptyAnswer}
                        {notEnoughAnswers}
                        {tooManyAnswers}
                    </Form.Group>))
                }
        </Form>
    );
}

function ModalForm(props) {

    // Boolean to decide the correct component to render
    const style = (props.modalQuestion.max === undefined);
    const [questionOpenAnswer, setQuestionOpenAnswer] = useState("");
    const [questionClosedAnswerRadio, setQuestionClosedAnswerRadio] = useState(-1);
    const [questionClosedAnswers, setQuestionClosedAnswers] = useState([]);

    const addAnswer = (id) => {
        setQuestionClosedAnswers(old => [...old, id]);
    }

    const removeAnswer = (id) => {
        setQuestionClosedAnswers(old => old.filter(el => el !== id));
    }

    // validOpen : true if there is an answer and the textarea is not empty
    const [validOpen, setValidOpen] = useState(false);
    // validClosed : false if there are no checked boxes/radios in a closed answer
    const [validClosed, setValidClosed] = useState(false);
    // validMin : true if min is a valid min number
    const [validMin, setValidMin] = useState(false);
    // validMax : true if max is a valid min number
    const [validMax, setValidMax] = useState(false);
    // validated : becomes true after the first submit so that error messages are shown
    const [validated, setValidated] = useState(false);

    // Add a new question using the proper constructor
    const addAnswerThenCloseModal = () => {
        if (style) {    // Open Question
            props.modalQuestion.reply = questionOpenAnswer;
        }
        else {
            if (props.modalQuestion.max === 1) { // Add single question radio
                props.modalQuestion.reply = []; // First reset the latest reply
                props.modalQuestion.reply.push(questionClosedAnswerRadio); // Then insert the new one
            }
            else    // Add entire list of checkbox checked answers
                props.modalQuestion.reply = questionClosedAnswers;
        }
        props.setModal(false);
    }

    const handleSubmit = (event) => {
        event.preventDefault();

        // Valid form, add the new question
        if (style) { // OPEN ENDED QUESTION
            if (questionOpenAnswer.length > 0)
                addAnswerThenCloseModal();
            else {
                setValidOpen(false);
            }
        }
        else {
            if (props.modalQuestion.max === 1) {    // CLOSED ANSWER with RADIOS
                if (questionClosedAnswerRadio !== -1)
                    addAnswerThenCloseModal();
                else {
                    if (props.modalQuestion.min === 1)
                        setValidMin(false);
                    else 
                        setValidMin(true);
                    setValidClosed(false);
                }
            }
            else {
                if (questionClosedAnswers.length > 0 && props.modalQuestion.min <= questionClosedAnswers.length && props.modalQuestion.max >= questionClosedAnswers.length)   // CLOSED ANSWER with CHECKBOXES
                    addAnswerThenCloseModal();
                else {
                    if (props.modalQuestion.min > questionClosedAnswers.length)
                        setValidMin(false);
                    else
                        setValidMin(true);
                    if (props.modalQuestion.max < questionClosedAnswers.length)
                        setValidMax(false);
                    else
                        setValidMax(true);
                    if (questionClosedAnswers.length === 0)
                        setValidClosed(false);
                    else 
                        setValidClosed(true);
                }
            }
        }
        //From the first time that the user clicks on the Save button the validated state is set to true
        setValidated(true);
    };

    return (
        <Modal show={true} onHide={() => props.setModal(false)} backdrop="static" keyboard={false} centered animation={false}>
            <Modal.Header closeButton>
                <Modal.Title>{props.modalQuestion.title} {props.modalQuestion.min > 0 ? (<span className="required"> *</span>) : ""} </Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {style ? 
                    <QuestionForm style={style} questionTitle={props.modalQuestion.title} questionOpenAnswer={questionOpenAnswer} setQuestionOpenAnswer={setQuestionOpenAnswer} min={props.modalQuestion.min} validated={validated} validOpen={validOpen} />
                    :
                    <QuestionForm style={style} questionTitle={props.modalQuestion.title} min={props.modalQuestion.min} max={props.modalQuestion.max} validated={validated} choices={props.modalQuestion.answers} validMin={validMin} validMax={validMax} validClosed={validClosed} addAnswer={addAnswer} removeAnswer={removeAnswer} setQuestionClosedAnswerRadio={setQuestionClosedAnswerRadio} />
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
