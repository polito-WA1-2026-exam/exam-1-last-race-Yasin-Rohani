import { BrowserRouter, Navigate, Route, Routes } from "react-router";
import { Container, Spinner } from "react-bootstrap";
import NavigationBar from "./components/NavigationBar.jsx";
import InstructionsPage from "./pages/InstructionsPage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import { useAuth } from "./context/AuthContext.jsx";
import RankingPage from "./pages/RankingPage.jsx";

function ProtectedRoute({ children }) {
  const { loggedIn, checkingSession } = useAuth();

  if (checkingSession) {
    return (
      <Container className="text-center mt-5">
        <Spinner animation="border" role="status" />
        <p className="mt-3">Checking session...</p>
      </Container>
    );
  }

  if (!loggedIn) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function PlaceholderPage({ title }) {
  return (
    <Container>
      <h1>{title}</h1>
      <p>This page will be implemented in the next steps.</p>
    </Container>
  );
}

function App() {
  return (
    <BrowserRouter>
      <NavigationBar />

      <Routes>
        <Route path="/" element={<InstructionsPage />} />
        <Route path="/login" element={<LoginPage />} />

        <Route
          path="/setup"
          element={
            <ProtectedRoute>
              <PlaceholderPage title="Setup" />
            </ProtectedRoute>
          }
        />

        <Route
          path="/ranking"
          element={
            <ProtectedRoute>
              <PlaceholderPage />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;