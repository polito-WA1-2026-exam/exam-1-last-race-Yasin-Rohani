import { Container, Nav, Navbar, Button } from "react-bootstrap";
import { Link, useNavigate } from "react-router";
import { useAuth } from "../context/AuthContext.jsx";

function NavigationBar() {
  const { loggedIn, user, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate("/");
  }

  return (
    <Navbar bg="dark" data-bs-theme="dark" expand="lg" className="mb-4">
      <Container>
        <Navbar.Brand as={Link} to="/">
          Last Race
        </Navbar.Brand>

        <Navbar.Toggle aria-controls="main-navbar" />

        <Navbar.Collapse id="main-navbar">
          <Nav className="me-auto">
            <Nav.Link as={Link} to="/">
              Instructions
            </Nav.Link>

            {loggedIn && (
              <>
                <Nav.Link as={Link} to="/setup">
                  Play
                </Nav.Link>
                <Nav.Link as={Link} to="/ranking">
                  Ranking
                </Nav.Link>
              </>
            )}
          </Nav>

          <Nav className="align-items-lg-center">
            {loggedIn ? (
              <>
                <Navbar.Text className="me-3">
                  Signed in as {user.name}
                </Navbar.Text>
                <Button variant="outline-light" size="sm" onClick={handleLogout}>
                  Logout
                </Button>
              </>
            ) : (
              <Button as={Link} to="/login" variant="outline-light" size="sm">
                Login
              </Button>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}

export default NavigationBar;