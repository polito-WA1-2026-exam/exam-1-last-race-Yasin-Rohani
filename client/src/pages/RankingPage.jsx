import { useEffect, useState } from "react";
import { Alert, Card, Col, Container, Row, Spinner, Table } from "react-bootstrap";
import API from "../api/API.js";

function RankingPage() {
  const [ranking, setRanking] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    async function loadRanking() {
      try {
        const data = await API.getRanking();
        setRanking(data);
      } catch (err) {
        setErrorMessage(err.message || "Cannot load ranking");
      } finally {
        setLoading(false);
      }
    }

    loadRanking();
  }, []);

  return (
    <Container>
      <Row className="justify-content-center">
        <Col lg={8}>
          <Card>
            <Card.Body>
              <Card.Title as="h1">Ranking</Card.Title>
              <Card.Subtitle className="mb-4 text-muted">
                Best scores from registered players.
              </Card.Subtitle>

              {loading && (
                <div className="text-center my-4">
                  <Spinner animation="border" role="status" />
                  <p className="mt-3">Loading ranking...</p>
                </div>
              )}

              {errorMessage && <Alert variant="danger">{errorMessage}</Alert>}

              {!loading && !errorMessage && ranking.length === 0 && (
                <Alert variant="info">No completed games yet.</Alert>
              )}

              {!loading && !errorMessage && ranking.length > 0 && (
                <Table striped bordered hover responsive>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Player</th>
                      <th>Email</th>
                      <th>Best score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ranking.map((row, index) => (
                      <tr key={row.userId}>
                        <td>{index + 1}</td>
                        <td>{row.name}</td>
                        <td>{row.username}</td>
                        <td>{row.bestScore}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default RankingPage;