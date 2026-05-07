const jwt = require("jsonwebtoken");

/**
 * Generate a signed JWT for a user.
 * @param {string} id  - MongoDB user _id
 * @returns {string}   - signed JWT string
 */
const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || "7d",
  });

module.exports = generateToken;