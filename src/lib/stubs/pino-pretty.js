/*
 * Minimal stub for pino-pretty so WalletConnect's logger can bundle without the optional dependency.
 * It returns an identity prettifier, which keeps logging functional without formatting.
 */

const createPretty = () => {
  return (input) => {
    if (typeof input === "string") {
      return input;
    }
    try {
      return JSON.stringify(input);
    } catch {
      return String(input);
    }
  };
};

module.exports = createPretty;
module.exports.default = createPretty;
