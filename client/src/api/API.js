const SERVER_URL = "http://localhost:3001/api";

async function handleResponse(response) {
  if (response.ok) {
    return response.json();
  }

  const errorBody = await response.json().catch(() => ({
    error: "Unknown server error"
  }));

  throw new Error(errorBody.error || "Request failed");
}

async function login(username, password) {
  const response = await fetch(`${SERVER_URL}/sessions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    credentials: "include",
    body: JSON.stringify({ username, password })
  });

  return handleResponse(response);
}

async function logout() {
  const response = await fetch(`${SERVER_URL}/sessions/current`, {
    method: "DELETE",
    credentials: "include"
  });

  if (response.status === 204) {
    return true;
  }

  return handleResponse(response);
}

async function getCurrentUser() {
  const response = await fetch(`${SERVER_URL}/sessions/current`, {
    credentials: "include"
  });

  return handleResponse(response);
}

async function getFullNetwork() {
  const response = await fetch(`${SERVER_URL}/network/full`, {
    credentials: "include"
  });

  return handleResponse(response);
}

async function getPlanningNetwork() {
  const response = await fetch(`${SERVER_URL}/network/planning`, {
    credentials: "include"
  });

  return handleResponse(response);
}

async function createGame() {
  const response = await fetch(`${SERVER_URL}/games`, {
    method: "POST",
    credentials: "include"
  });

  return handleResponse(response);
}

async function getGame(gameId) {
  const response = await fetch(`${SERVER_URL}/games/${gameId}`, {
    credentials: "include"
  });

  return handleResponse(response);
}

async function submitRoute(gameId, selectedSegmentIds) {
  const response = await fetch(`${SERVER_URL}/games/${gameId}/route`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    credentials: "include",
    body: JSON.stringify({ selectedSegmentIds })
  });

  return handleResponse(response);
}

async function getRanking() {
  const response = await fetch(`${SERVER_URL}/ranking`, {
    credentials: "include"
  });

  return handleResponse(response);
}

const API = {
  login,
  logout,
  getCurrentUser,
  getFullNetwork,
  getPlanningNetwork,
  createGame,
  getGame,
  submitRoute,
  getRanking
};

export default API;