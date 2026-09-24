import express from 'express';
import jwt from 'jsonwebtoken';

const router = express.Router();

router.get('/validate-token', (req, res) => {
  let token = req.cookies?.token;
  if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) return res.status(401).json({ message: "No token found" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_KEY);
    res.json({ userId: decoded.id || decoded.userId, role: decoded.role }); // Send user data if token is valid
  } catch (err) {
    res.status(401).json({ message: "Invalid token" });
  }
});

export default router;
