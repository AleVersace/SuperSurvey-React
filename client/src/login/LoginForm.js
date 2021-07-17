import { useState } from 'react';
import { Container, Row, Col, Form, Button, Alert } from 'react-bootstrap';

function LoginForm(props) {

    // Username state
    const [username, setUsername] = useState('');
    // Password state
    const [password, setPassword] = useState('');
    // Error message state to show in case of problems with the form fields
    const [errorMessage, setErrorMessage] = useState('');

    const handleSubmit = (event) => {
        event.preventDefault();
        const credentials = { username: username, password: password };
        // Every time the user clicks on the login button I reset the error message (the one in App.js)
        props.setMessage('');
        if (username.length > 0 && password.length >= 6) {
            // if the username field is not empty and the password is at least 6 chars long, do the login
            props.login(credentials);
            //set the error message to the empty string because validation is ok
            setErrorMessage('');
        }
        else {
            //set the error message because validation failed
            setErrorMessage('Please check the fields again...');
        }
    };

    return (<>
                <Container fluid className="below-nav">
                    <Row className="justify-content-center">
                        <Form as={Col} xs={12} md={4}>
                            <Row className="justify-content-center">
                                {errorMessage ? <Alert as={Col} xs={12} variant='danger' onClose={() => setErrorMessage('')} dismissible>
                                                    <Alert.Heading>You got an error!</Alert.Heading>
                                                    <p>{errorMessage}</p>
                                                </Alert>
                                                : ''
                                }
                            </Row>
                            <Row className="justify-content-center">
                                {props.message && 
                                        <Alert variant={props.message.type} as={Col} xs={12} onClose={() => props.setMessage('')} dismissible>
                                            <Alert.Heading>You got an error!</Alert.Heading>
                                            <p>{props.msg}</p>
                                        </Alert>
                                }
                            </Row>
                            <Row className="justify-content-center">
                                <Form.Group as={Col} xs={12} controlId='username'>
                                    <Form.Label>E-mail</Form.Label>
                                    <Form.Control type='email' value={username} onChange={ev => setUsername(ev.target.value)} />
                                    <p></p>
                                </Form.Group>
                            </Row>
                            <Row className="justify-content-center">
                                <Form.Group as={Col} xs={12} controlId='password'>
                                    <Form.Label>Password</Form.Label>
                                    <Form.Control type='password' value={password} onChange={ev => setPassword(ev.target.value)} />
                                    <p></p>
                                </Form.Group>
                            </Row>
                            <Row className="justify-content-center">
                                <p></p>
                                <Button variant="primary" as={Col} xs={12} onClick={handleSubmit}>Login</Button>
                            </Row>
                        </Form>
                    </Row>
                </Container>
        </>
    );
}


export default LoginForm;