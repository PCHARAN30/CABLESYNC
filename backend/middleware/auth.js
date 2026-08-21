// Lightweight PIN gate instead of full authentication.
// The frontend sends the operator's PIN in a header on every request;
// this just checks it matches the value in .env. It's not bank-grade
// security, but it stops the "public URL = anyone can see/edit customer
// data" problem that comes with zero auth on a live deployment.
//
// Frontend usage: axios.defaults.headers.common['x-operator-pin'] = pin;

function requirePin(req, res, next) {
  const suppliedPin = req.header('x-operator-pin');
  const expectedPin = process.env.OPERATOR_PIN;

  if (!expectedPin) {
    // Misconfiguration - fail closed, not open.
    return res.status(500).json({ error: 'Server PIN not configured' });
  }

  if (!suppliedPin || suppliedPin !== expectedPin) {
    return res.status(401).json({ error: 'Invalid or missing PIN' });
  }

  next();
}

module.exports = requirePin;
