import { Button, Card } from 'react-bootstrap';
import { Switch, Route, Link } from "react-router-dom";

function SurveyToCompile(props) {

    const replyId = 1;

    return (
        <Switch>
            <Route exact path="/">
                <Card border="primary">
                    <Card.Header as="h5">{props.title}</Card.Header>
                    <Card.Body className="row">
                        <Link to={"/new-answer/"+props.id} className="col-md-3"><Button variant="primary">Compile!</Button></Link><Card.Text className="col-md-9 text-center">Number of questions: {props.nQuestions}</Card.Text>
                    </Card.Body>
                </Card>
            </Route>
            <Route exact path="/my-surveys">
                <Card border="primary">
                    <Card.Header as="h5">{props.title}</Card.Header>
                    <Card.Body className="justify-content">
                        <Card.Text>Received Answers: {props.nAnswers}</Card.Text>
                        {props.nAnswers > 0 ? <Link to={"/show-results/"+props.id+"/"+props.nAnswers+"/"+replyId} ><Button variant="primary">Let me see them!</Button></Link> :
                            <Button variant="primary" disabled>Let me see them!</Button>}
                    </Card.Body>
                </Card>
            </Route>
        </Switch>
    );
}

export default SurveyToCompile;