import { Alert, Button, Card, Col, Container, Row } from "react-bootstrap";
import { Link } from "react-router";
import { useAuth } from "../context/AuthContext.jsx";

function InstructionsPage() {
  const { loggedIn } = useAuth();

  return (
    <Container>
      <Row className="justify-content-center">
        <Col lg={9}>
          <Card>
            <Card.Body>
              <Card.Title as="h1">Last Race</Card.Title>
              <Card.Subtitle className="mb-3 text-muted">
                A single-player route planning game.
              </Card.Subtitle>

              <p>
                You are assigned a starting station and a destination station in
                a fictional underground network. Your goal is to plan a valid
                route and reach the destination with the highest possible number
                of coins.
              </p>

              <h2 className="h4 mt-4">Game phases</h2>

              <ol>
                <li>
                  <strong>Setup:</strong> inspect the complete network map with
                  stations, connections, and lines.
                </li>
                <li>
                  <strong>Planning:</strong> the line connections disappear. You
                  must reconstruct the route by selecting connected segments in
                  sequence.
                </li>
                <li>
                  <strong>Execution:</strong> the server validates your route
                  and applies one random event for each travelled segment.
                </li>
                <li>
                  <strong>Result:</strong> your final score is shown and may
                  appear in the ranking.
                </li>
              </ol>

              <h2 className="h4 mt-4">Rules</h2>

              <ul>
                <li>Each game starts with 20 coins.</li>
                <li>The planning time limit is 90 seconds.</li>
                <li>Each segment can be selected only once.</li>
                <li>The route must start and end at the assigned stations.</li>
                <li>Line changes are allowed only at interchange stations.</li>
                <li>If the route is invalid or incomplete, the score becomes 0.</li>
              </ul>

              {!loggedIn && (
                <Alert variant="info" className="mt-4">
                  Anonymous visitors can only read the instructions. Log in to
                  play the game and access the ranking.
                </Alert>
              )}

              <div className="mt-4">
                {loggedIn ? (
                  <Button as={Link} to="/setup" variant="primary">
                    Start playing
                  </Button>
                ) : (
                  <Button as={Link} to="/login" variant="primary">
                    Login to play
                  </Button>
                )}
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default InstructionsPage;