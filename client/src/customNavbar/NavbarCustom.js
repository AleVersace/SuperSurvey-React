import profileIcon from "../icons/person-circle.svg";
import siteIcon from "../icons/pencil-square.svg";
import {Navbar, Image, Button, Container} from 'react-bootstrap';
import {Link} from 'react-router-dom';

function ProfileIcon(props) {
    return (
        <>{props.loggedIn === true ? 
            <>
                <Navbar.Brand className="nav-comp">
                    <Link to="/my-surveys" className="nav-comp mr-5">{props.username}
                    <Image src={profileIcon} className="ml-2"/></Link>
                    <Button className="logout" size="md" variant="outline-light" as="title" onClick={props.logout}>{' '}Logout</Button>
                </Navbar.Brand>
            </> :
            <Link to="/login"><Button className="login" size="md" variant="outline-light" as="title">Login</Button></Link>
        }</>
    );
}

function Logo() {
    // Icon + Website Name
    return (
        <Link to="/"><Navbar.Brand>
            <Image src={siteIcon}/>{' '}
            <span className="nav-comp">SuperSurveys</span>
        </Navbar.Brand></Link>
    );
}


function NavbarCustom(props) {
    return (
        <Navbar expand="sm" bg="primary" fixed="top">
            <Container fluid>
                <Logo/>
                <ProfileIcon loggedIn={props.loggedIn} username={props.username} logout={props.logout}/> 
            </Container>
        </Navbar>
    );
}

export default NavbarCustom;