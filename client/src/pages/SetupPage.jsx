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
import { useNavigate } from "react-router";
import API from "../api/API.js";

function SetupPage() {
  const [network, setNetwork] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [creatingGame, setCreatingGame] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    async function loadNetwork() {
      try {
        const data = await API.getFullNetwork();
        setNetwork(data);
      } catch (err) {
        setErrorMessage(err.message || "Cannot load network");
      } finally {
        setLoading(false);
      }
    }

    loadNetwork();
  }, []);

  async function handleStartGame() {
    setCreatingGame(true);
    setErrorMessage("");

    try {
      const game = await API.createGame();
      navigate(`/planning/${game.id}`);
    } catch (err) {
      setErrorMessage(err.message || "Cannot create game");
    } finally {
      setCreatingGame(false);
    }
  }

  function getLineForSegment(segmentId) {
    return network.segmentLines.find((line) => line.segmentId === segmentId);
  }

  if (loading) {
    return (
      <Container className="text-center mt-5">
        <Spinner animation="border" role="status" />
        <p className="mt-3">Loading full network...</p>
      </Container>
    );
  }

  return (
    <Container>
      <Row className="justify-content-center">
        <Col lg={10}>
          <Card>
            <Card.Body>
              <Card.Title as="h1">Setup</Card.Title>
              <Card.Subtitle className="mb-4 text-muted">
                Study the complete underground network before starting the game.
              </Card.Subtitle>

              {errorMessage && <Alert variant="danger">{errorMessage}</Alert>}

              {network && (
                <>
                  <h2 className="h4 mt-3">Lines</h2>
                  <ListGroup className="mb-4">
                    {network.lines.map((line) => (
                      <ListGroup.Item key={line.id}>
                        <Badge bg="secondary" className="me-2">
                          {line.color}
                        </Badge>
                        {line.name}
                      </ListGroup.Item>
                    ))}
                  </ListGroup>

                  <h2 className="h4 mt-3">Stations</h2>
                  <Row className="mb-4">
                    {network.stations.map((station) => (
                      <Col md={4} key={station.id} className="mb-2">
                        <Card body>{station.name}</Card>
                      </Col>
                    ))}
                  </Row>

                  <h2 className="h4 mt-3">Connections</h2>
                  <ListGroup className="mb-4">
                    {network.segments.map((segment) => {
                      const line = getLineForSegment(segment.id);

                      return (
                        <ListGroup.Item key={segment.id}>
                          <strong>{segment.station1Name}</strong> —{" "}
                          <strong>{segment.station2Name}</strong>
                          {line && (
                            <Badge bg="secondary" className="ms-2">
                              {line.lineName}
                            </Badge>
                          )}
                        </ListGroup.Item>
                      );
                    })}
                  </ListGroup>

                  <Button
                    variant="primary"
                    onClick={handleStartGame}
                    disabled={creatingGame}
                  >
                    {creatingGame ? "Starting..." : "Start game"}
                  </Button>
                </>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default SetupPage;