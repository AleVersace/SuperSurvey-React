import { Modal, Button, Form, Col, Row } from 'react-bootstrap';

function QuestionForm(props) {

    const message = (props.min > 1 ? "min: "+props.min+" " : "") + "max: "+props.max; 

    return (
        <Form>
            {props.style ? <></> : <><Form.Text>
                {message}
            </Form.Text>
            <br/></> }
            { props.style ? (<Form.Row>
                    <Form.Group as={Col} xs={12} controlId="titleForm">
                        <Form.Label>Write your answer</Form.Label>
                        <Form.Control as="textarea" maxLength="200" placeholder="In my opinion... (max 200 characters)" value={props.reply} disabled/>
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
                                defaultChecked={props.replies[0] === c.choiceId}
                                id="standardRadios"
                                disabled/>)}
                        </Col>
                        </Form.Group>
                    </fieldset>) :
                    (<Form.Group as={Row} className="mb-3" controlId="formHorizontalCheck">
                        <Col sm={12}>
                            { props.choices.map(c => <Form.Check key={c.choiceId} label={c.choice} defaultChecked={props.replies.indexOf(c.choiceId) >= 0} disabled/>) }
                        </Col>
                    </Form.Group>))
                }
        </Form>
    );
}

function ModalForm(props) {

    // Boolean to decide the correct component to render
    const style = (props.modalQuestion.max === undefined);

    return (
        <Modal show={true} onHide={() => props.setModal(false)} backdrop="static" keyboard={false} centered animation={false}>
            <Modal.Header closeButton>
                <Modal.Title>{props.modalQuestion.title} {props.modalQuestion.min > 0 ? (<span className="required"> *</span>) : ""} </Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {style ? 
                    <QuestionForm key={1} style={style} questionTitle={props.modalQuestion.title} min={props.modalQuestion.min} reply={props.modalQuestion.reply}/>
                    :
                    <QuestionForm key={2} style={style} questionTitle={props.modalQuestion.title} min={props.modalQuestion.min} max={props.modalQuestion.max} choices={props.modalQuestion.answers} replies={props.modalQuestion.reply} />
                }
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={() => props.setModal(false)}>
                    Close
                </Button>
            </Modal.Footer>
        </Modal>
    );
}

export default ModalForm;
