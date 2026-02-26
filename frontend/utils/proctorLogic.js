let violations = 0;

export const handleViolation = (msg) => {
  violations++;

  console.log("Violation:", msg);

  // only after 3 real violations
  if (violations >= 3) {
    alert("🚨 Cheating Detected: " + msg);
    violations = 0;
  }
};
