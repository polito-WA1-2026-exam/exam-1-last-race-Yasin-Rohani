import { useState } from "react";
import { Alert, Button, Card, Col, Container, Form, Row } from "react-bootstrap";
import { useNavigate } from "react-router";
import { useAuth } from "../context/AuthContext.jsx";

function LoginPage() {
  const [username, setUsername] = useState("alice@example.com");
  const [password, setPassword] = useState("Password123!");
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(event) {
    event.preventDefault();

    setErrorMessage("");
    setLoading(true);

    try {
      await login(username, password);
      navigate("/");
    } catch (err) {
      setErrorMessage(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Container>
      <Row className="justify-content-center">
        <Col md={7} lg={5}>
          <Card>
            <Card.Body>
              <Card.Title as="h1">Login</Card.Title>
              <Card.Subtitle className="mb-4 text-muted">
                Sign in to play Last Race.
              </Card.Subtitle>

              {errorMessage && (
                <Alert variant="danger">{errorMessage}</Alert>
              )}

              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3" controlId="login-username">
                  <Form.Label>Email</Form.Label>
                  <Form.Control
                    type="email"
                    value={username}
                    onChange={(event) => setUsername(event.target.value)}
                    required
                  />
                </Form.Group>

                <Form.Group className="mb-3" controlId="login-password">
                  <Form.Label>Password</Form.Label>
                  <Form.Control
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                  />
                </Form.Group>

                <Button type="submit" variant="primary" disabled={loading}>
                  {loading ? "Signing in..." : "Login"}
                </Button>
              </Form>

              <p className="mt-4 mb-0 text-muted">
                Demo user: alice@example.com / Password123!
              </p>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default LoginPage;