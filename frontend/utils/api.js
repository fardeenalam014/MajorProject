/**
 * api.js  —  src/utils/api.js
 *
 * Central HTTP client for all REST calls.
 * Reads role-scoped tokens ("token_student" / "token_creator") so both
 * roles can coexist in the same browser during local development.
 */

const BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const authHeaders = () => {
  // Role-scoped keys take priority; legacy "token" key is fallback
  const token =
    localStorage.getItem("token_student") ??
    localStorage.getItem("token_creator") ??
    localStorage.getItem("token") ??
    null;
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

const request = async (method, path, body = null) => {
  try {
    const res  = await fetch(`${BASE}${path}`, {
      method,
      headers: authHeaders(),
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    const data = await res.json();
    if (!res.ok) return { data: null, error: data.message || "Request failed" };
    return { data, error: null };
  } catch {
    return { data: null, error: "Network error — is the server running?" };
  }
};

const get   = (path)       => request("GET",    path);
const post  = (path, body) => request("POST",   path, body);
const put   = (path, body) => request("PUT",    path, body);
const patch = (path, body) => request("PATCH",  path, body);
const del   = (path)       => request("DELETE", path);

export const authAPI = {
  register: (body) => post("/auth/register", body),
  login:    (body) => post("/auth/login",    body),
  me:       ()     => get("/auth/me"),
};

export const testAPI = {
  getMyTests:    ()         => get("/tests"),
  getTest:       (id)       => get(`/tests/${id}`),
  create:        (body)     => post("/tests", body),
  update:        (id, body) => put(`/tests/${id}`, body),
  togglePublish: (id)       => patch(`/tests/${id}/publish`),
  delete:        (id)       => del(`/tests/${id}`),
  getByCode:     (code)     => get(`/tests/join/${code}`),
};

export const enrollmentAPI = {
  enroll:        (testId) => post("/enrollments", { testId }),
  myEnrollments: ()       => get("/enrollments/me"),
  forTest:       (testId) => get(`/enrollments/test/${testId}`),
};

export const attemptAPI = {
  submit:     (body)   => post("/attempts", body),
  myAttempts: ()       => get("/attempts/me"),
  myForTest:  (testId) => get(`/attempts/me/${testId}`),
  forTest:    (testId) => get(`/attempts/test/${testId}`),
};