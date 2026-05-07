/**
 * storage.js  —  Single source of truth for all localStorage keys.
 *
 * KEY MAP
 * ───────────────────────────────────────────────────────────────
 *  "tests"                    — array of all tests (shared)
 *  "attempts"                 — array of all submitted attempts (shared)
 *  "liveSessions"             — array of active exam sessions (shared)
 *  "enrollments"              — array of { testId, studentUser, joinedAt } (shared)
 *  "studentTests-{user}"      — array of test cards for one student (per-user)
 *  "activeTestId"             — testId currently being taken (transient)
 *  "activeStudentUser"        — student username currently in exam (transient)
 *  "currentTest"              — full test object for ExamPage (transient)
 *  "creatorUser"              — logged-in creator username
 *  "studentUser"              — logged-in student username
 */

export const get = (key, fallback = null) => {
  try {
    const v = localStorage.getItem(key);
    return v === null ? fallback : JSON.parse(v);
  } catch { return fallback; }
};

export const set = (key, val) => {
  localStorage.setItem(key, JSON.stringify(val));
};

/* ── Tests ── */
export const getAllTests  = ()       => get("tests", []);
export const saveTests   = (arr)    => set("tests", arr);
export const getTestById = (id)     => getAllTests().find(t => t.id === id) ?? null;

/* ── Enrollments ── */
export const getEnrollments       = ()         => get("enrollments", []);
export const getEnrollmentsForTest = (testId)  =>
  getEnrollments().filter(e => e.testId === testId);
export const enrollStudent = (testId, studentUser) => {
  const all = getEnrollments();
  if (all.find(e => e.testId === testId && e.studentUser === studentUser)) return; // already enrolled
  all.push({ testId, studentUser, joinedAt: new Date().toISOString() });
  set("enrollments", all);
};

/* ── Attempts ── */
export const getAttempts          = ()         => get("attempts", []);
export const getAttemptsForTest   = (testId)   => getAttempts().filter(a => a.testId === testId);
export const getAttemptsForStudent = (studentUser) =>
  getAttempts().filter(a => a.studentUser === studentUser);
export const saveAttempt = (attempt) => {
  const all = getAttempts();
  all.push({ ...attempt, savedAt: new Date().toISOString() });
  set("attempts", all);
};

/* ── Live Sessions ── */
export const getLiveSessions = () => get("liveSessions", []);
export const upsertLiveSession = (session) => {
  const all = getLiveSessions();
  const idx = all.findIndex(s => s.sessionId === session.sessionId);
  if (idx >= 0) all[idx] = { ...all[idx], ...session, lastUpdated: Date.now() };
  else          all.push({ ...session, lastUpdated: Date.now() });
  set("liveSessions", all);
};
export const markSessionSubmitted = (sessionId) => {
  const all = getLiveSessions();
  const idx = all.findIndex(s => s.sessionId === sessionId);
  if (idx >= 0) { all[idx].status = "submitted"; set("liveSessions", all); }
};

/* ── Student test list (per-user cache) ── */
export const getStudentTests  = (user)    => get(`studentTests-${user}`, []);
export const saveStudentTests = (user, arr) => set(`studentTests-${user}`, arr);

/* ── Compute total marks for a test ── */
export const getTotalMarks = (test) =>
  test?.sections?.reduce(
    (s, sec) => s + (sec.questions?.reduce((q, qu) => q + (Number(qu.marks) || 1), 0) || 0), 0
  ) || 0;

/* ── Compute pct for a score ── */
export const getPct = (score, totalMarks) =>
  totalMarks > 0 ? Math.round((score / totalMarks) * 100) : 0;