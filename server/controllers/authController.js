import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import supabase from '../utils/supabaseClient.js';

const SECRET = process.env.JWT_SECRET;
const { hash, compare } = bcrypt;
const { sign, verify } = jwt;

// POST /signup
const signup = async (req, res) => {
  const { email, password, username } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const { data: existingUsers, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email);

    if (fetchError) throw fetchError;
    if (existingUsers.length > 0) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const hashedPassword = await hash(password, 10);

    const { data: newUser, error: insertError } = await supabase
      .from('users')
      .insert([{ email, password: hashedPassword, username }])
      .select('id, email, username')
      .single();

    if (insertError) throw insertError;

    const token = sign({ id: newUser.id }, SECRET, { expiresIn: '1d' });

    res.status(201).json({ user: newUser, token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Signup failed' });
  }
};

// POST /login
const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email);

    if (error) throw error;

    const user = users[0];
    if (!user) return res.status(404).json({ error: 'User not found' });

    const match = await compare(password, user.password);
    if (!match) return res.status(401).json({ error: 'Invalid credentials' });

    const token = sign({ id: user.id }, SECRET, { expiresIn: '1d' });

    res.json({ user: { id: user.id, email: user.email, username: user.username }, token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Login failed' });
  }
};

// POST /connect-wallet
const connectWallet = async (req, res) => {
  const userId = req.user.id;
  const { walletAddress } = req.body;

  if (!walletAddress) {
    return res.status(400).json({ error: 'Missing wallet address' });
  }

  try {
    const { error } = await supabase
      .from('users')
      .update({ wallet_address: walletAddress })
      .eq('id', userId);

    if (error) throw error;

    res.json({ message: 'Wallet connected successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to connect wallet' });
  }
};

export default { signup, login, connectWallet };
