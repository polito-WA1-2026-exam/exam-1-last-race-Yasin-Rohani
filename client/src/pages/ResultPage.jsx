import { useEffect, useState } from "react";
import {
  Alert,
  Badge,
  Button,
  Card,
  Col,
  Container,
  ListGroup,
  Row,
  Spinner
} from "react-bootstrap";
import { Link, useParams } from "react-router";
import API from "../api/API.js";

function ResultPage() {
  const { gameId } = useParams();

  const [game, setGame] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    async function loadResult() {
      try {
        const loadedGame = await API.getGame(gameId);
        setGame(loadedGame);
      } catch (err) {
        setErrorMessage(err.message || "Cannot load game result");
      } finally {
        setLoading(false);
      }
    }

    loadResult();
  }, [gameId]);

  if (loading) {
    return (
      <Container className="text-center mt-5">
        <Spinner animation="border" role="status" />
        <p className="mt-3">Loading result...</p>
      </Container>
    );
  }

  return (
    <Container>
      <Row className="justify-content-center">
        <Col lg={8}>
          <Card>
            <Card.Body>
              <Card.Title as="h1">Result</Card.Title>
              <Card.Subtitle className="mb-4 text-muted">
                Final result of your route.
              </Card.Subtitle>

              {errorMessage && <Alert variant="danger">{errorMessage}</Alert>}

              {game && (
                <>
                  <Alert variant={game.status === "completed" ? "success" : "danger"}>
                    Status:{" "}
                    <Badge bg={game.status === "completed" ? "success" : "danger"}>
                      {game.status}
                    </Badge>
                    <br />
                    Final score: <strong>{game.score}</strong>
                  </Alert>

                  <ListGroup className="mb-4">
                    <ListGroup.Item>
                      Start: <strong>{game.startStationName}</strong>
                    </ListGroup.Item>
                    <ListGroup.Item>
                      Destination: <strong>{game.destinationStationName}</strong>
                    </ListGroup.Item>
                    <ListGroup.Item>
                      Minimum distance: <strong>{game.minimumDistance}</strong>
                    </ListGroup.Item>
                  </ListGroup>

                  {game.steps && game.steps.length > 0 && (
                    <>
                      <h2 className="h4">Executed steps</h2>

                      <ListGroup className="mb-4">
                        {game.steps.map((step) => (
                          <ListGroup.Item key={step.id}>
                            Step {step.stepNumber}:{" "}
                            <strong>{step.fromStationName}</strong> →{" "}
                            <strong>{step.toStationName}</strong>
                            <br />
                            Event: {step.eventDescription}{" "}
                            <Badge bg="secondary">
                              {step.eventEffect >= 0 ? "+" : ""}
                              {step.eventEffect}
                            </Badge>
                            <br />
                            Coins after step:{" "}
                            <strong>{step.coinsAfterStep}</strong>
                          </ListGroup.Item>
                        ))}
                      </ListGroup>
                    </>
                  )}

                  <div className="d-flex gap-2">
                    <Button as={Link} to="/setup" variant="primary">
                      Play again
                    </Button>

                    <Button as={Link} to="/ranking" variant="outline-primary">
                      View ranking
                    </Button>
                  </div>
                </>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default ResultPage;