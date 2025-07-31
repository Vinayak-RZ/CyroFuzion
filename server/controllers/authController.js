import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import supabase from '../utils/supabaseClient.js';
import { sendOtpToEmail } from '../utils/emailService.js';

const SECRET = process.env.JWT_SECRET;
const { hash, compare } = bcrypt;
const { sign } = jwt;

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


const sendOtpAfterPasswordCheck = async (req, res) => {
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

    // Generate OTP and expiry (5 min)
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = new Date(Date.now() + 5 * 60 * 1000).toISOString();

    // Save to DB
    const { error: updateError } = await supabase
      .from('users')
      .update({ otp_code: otp, otp_expiry: expiry })
      .eq('id', user.id);

    if (updateError) throw updateError;

    await sendOtpToEmail(email, otp); 

    res.json({ message: 'OTP sent to email' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to send OTP' });
  }
};

const verifyOtpAndLogin = async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ error: 'Email and OTP are required' });
  }

  try {
    const { data: users, error } = await supabase
      .from('users')
      .select('id, email, username, otp_code, otp_expiry')
      .eq('email', email);

    if (error) throw error;

    const user = users[0];
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (user.otp_code !== otp) {
      return res.status(401).json({ error: 'Invalid OTP' });
    }

    const now = new Date();
    const expiry = new Date(user.otp_expiry);
    if (now > expiry) {
      return res.status(401).json({ error: 'OTP expired' });
    }

    // Clear OTP
    await supabase
      .from('users')
      .update({ otp_code: null, otp_expiry: null })
      .eq('id', user.id);

    const token = sign({ id: user.id }, SECRET, { expiresIn: '1d' });

    res.json({ user: { id: user.id, email: user.email, username: user.username }, token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'OTP verification failed' });
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

export default {
  signup,
  sendOtpAfterPasswordCheck,
  verifyOtpAndLogin,
  connectWallet,
};
