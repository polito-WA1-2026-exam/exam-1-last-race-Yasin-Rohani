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
import { useNavigate, useParams } from "react-router";
import API from "../api/API.js";
import NetworkMap from "../components/NetworkMap.jsx";

function PlanningPage() {
  const { gameId } = useParams();
  const navigate = useNavigate();

  const [game, setGame] = useState(null);
  const [network, setNetwork] = useState(null);
  const [selectedSegmentIds, setSelectedSegmentIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState(90);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    async function loadPlanningData() {
      try {
        const loadedGame = await API.getGame(gameId);
        const planningNetwork = await API.getPlanningNetwork();

        setGame(loadedGame);
        setNetwork(planningNetwork);
      } catch (err) {
        setErrorMessage(err.message || "Cannot load planning data");
      } finally {
        setLoading(false);
      }
    }

    loadPlanningData();
  }, [gameId]);

  function toggleSegment(segmentId) {
    setSelectedSegmentIds((currentIds) => {
      if (currentIds.includes(segmentId)) {
        return currentIds.filter((id) => id !== segmentId);
      }

      return [...currentIds, segmentId];
    });
  }
      useEffect(() => {
  if (loading || !game || submitting) {
    return;
  }

  if (timeLeft <= 0) {
    handleSubmitRoute();
    return;
  }

  const timerId = setTimeout(() => {
    setTimeLeft((current) => current - 1);
  }, 1000);

  return () => clearTimeout(timerId);
}, [timeLeft, loading, game, submitting]);

  async function handleSubmitRoute() {
    setSubmitting(true);
    setErrorMessage("");

    try {
      const result = await API.submitRoute(Number(gameId), selectedSegmentIds);
      navigate(`/result/${result.game.id}`);
    } catch (err) {
      setErrorMessage(err.message || "Cannot submit route");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <Container className="text-center mt-5">
        <Spinner animation="border" role="status" />
        <p className="mt-3">Loading planning page...</p>
      </Container>
    );
  }

  return (
    <Container>
      <Row className="justify-content-center">
        <Col lg={10}>
          <Card>
            <Card.Body>
              <Card.Title as="h1">Planning</Card.Title>
              <Card.Subtitle className="mb-4 text-muted">
                Select the segments in the order you want to travel.
              </Card.Subtitle>

              {errorMessage && <Alert variant="danger">{errorMessage}</Alert>}

              {game && (
  <>
    <Alert variant="info">
      Start: <strong>{game.startStationName}</strong> → Destination:{" "}
      <strong>{game.destinationStationName}</strong>
      <br />
      Current score: <strong>{game.score}</strong>
    </Alert>

    <Alert variant={timeLeft <= 10 ? "warning" : "secondary"}>
      Time left: <strong>{timeLeft}</strong> seconds
    </Alert>
  </>
)}

              {network && (
                <>
                  <NetworkMap
                   stations={network.stations}
                   segments={[]}
                   segmentLines={[]}
                   showSegments={false}
                  />
                  <h2 className="h4 mt-4">Available segments</h2>

                  <ListGroup className="mb-4">
                    {network.segments.map((segment) => {
                      const selected = selectedSegmentIds.includes(segment.id);
                      const orderIndex = selectedSegmentIds.indexOf(segment.id);

                      return (
                        <ListGroup.Item
                          key={segment.id}
                          action
                          active={selected}
                          onClick={() => toggleSegment(segment.id)}
                        >
                          <div className="d-flex justify-content-between align-items-center">
                            <span>
                              <strong>{segment.station1Name}</strong> —{" "}
                              <strong>{segment.station2Name}</strong>
                            </span>

                            {selected && (
                              <Badge bg="light" text="dark">
                                Step {orderIndex + 1}
                              </Badge>
                            )}
                          </div>
                        </ListGroup.Item>
                      );
                    })}
                  </ListGroup>

                  <h2 className="h4 mt-4">Selected route</h2>

                  {selectedSegmentIds.length === 0 ? (
                    <Alert variant="warning">
                      No segment selected yet.
                    </Alert>
                  ) : (
                    <p>
                      Selected segment IDs:{" "}
                      <strong>{selectedSegmentIds.join(" → ")}</strong>
                    </p>
                  )}

                  <Button
                    variant="primary"
                    onClick={handleSubmitRoute}
                    disabled={submitting}
                  >
                    {submitting ? "Submitting..." : "Submit route"}
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

export default PlanningPage;