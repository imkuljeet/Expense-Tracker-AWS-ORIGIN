const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken'); // Make sure this is installed

const signup = async (req, res) => {
  const { name, email, password } = req.body;

  // 1) Simple presence check
  if (!name || !email || !password) {
    return res
      .status(400)
      .json({ message: 'Name, email and password are all required.' });
  }

  try {
    // 2) Prevent duplicate registrations
    const existing = await User.findOne({ where : { email } });
    if (existing) {
      return res
        .status(409)
        .json({ message: 'Email is already registered.' });
    }

    // 3) Hash the password
    const saltRounds      = 12;                // adjust for performance vs security
    const hashedPassword  = await bcrypt.hash(password, saltRounds);

    // 4) Create the user with the hashed password
    const newUser = await User.create({
      name,
      email,
      password: hashedPassword
    });

    // 5) Respond (never send the raw password back!)
    res
      .status(201)
      .json({
        message: 'User created successfully',
        user: {
          name:  newUser.name,
          email: newUser.email
        }
      });
  } catch (error) {
    console.error('Error creating user:', error);
    res
      .status(500)
      .json({ message: 'Failed to create user', error: error.message });
  }
};

async function login(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  try {
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({ message: 'User does not exist.' });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    // ✅ Create token
    const token = jwt.sign(
      { id: user.id, email: user.email }, // payload
      process.env.JWT_SECRET,            // secret key
      { expiresIn: '1h' }                // options
    );

    // ✅ Send back token and optionally user info
    return res.status(200).json({
      message: 'Logged in successfully',
      token
    });

  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
}


module.exports = { signup, login };
