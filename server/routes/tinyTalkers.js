import express from 'express';
import bcrypt from 'bcryptjs';
import { randomBytes } from 'node:crypto';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import {
  addTinyTalkersBucketWord,
  addTinyTalkersCategory,
  addTinyTalkersWord,
  createTinyTalkersUser,
  deleteTinyTalkersCategory,
  deleteTinyTalkersWord,
  getTinyTalkersBucket,
  getTinyTalkersCategories,
  getTinyTalkersUserById,
  getTinyTalkersUserByIdentifier,
  getTinyTalkersUserByEmail,
  getTinyTalkersWords,
  removeTinyTalkersBucketWord,
  updateTinyTalkersAvatar,
} from '../tinyTalkersDb.js';
import {
  requireTinyTalkersAdmin,
  verifyTinyTalkersToken,
} from '../middleware/tinyTalkersAuth.js';

const router = express.Router();
const CVC_WORD = /^[^aeiou][aeiou][^aeiou]$/i;

async function sendRegistrationEmail(user) {
  const { SMTP_HOST: host, SMTP_FROM: from } = process.env;
  const smtpUser = process.env.SMTP_USER;
  const smtpPassword = process.env.SMTP_PASSWORD;
  if (!host || !from || Boolean(smtpUser) !== Boolean(smtpPassword)) {
    console.error('TinyTalkers registration email was not sent: configure SMTP_HOST, SMTP_FROM, and matching SMTP credentials.');
    return false;
  }

  const port = Number(process.env.SMTP_PORT || 587);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    console.error('TinyTalkers registration email was not sent: SMTP_PORT must be a valid port.');
    return false;
  }

  const transportOptions = {
    host,
    port,
    secure: process.env.SMTP_SECURE === 'true',
  };
  if (smtpUser && smtpPassword) {
    transportOptions.auth = { user: smtpUser, pass: smtpPassword };
  }

  try {
    await nodemailer.createTransport(transportOptions).sendMail({
      from,
      to: user.email,
      subject: 'TinyTalkers registration successful',
      text: `Hello ${user.name},\n\nYour TinyTalkers account registration was successful. You can now sign in and start learning.\n\nThe TinyTalkers team`,
    });
    return true;
  } catch (error) {
    console.error('TinyTalkers registration email failed:', error);
    return false;
  }
}

function publicUser(user) {
  const { passwordHash, ...account } = user;
  return account;
}

function issueToken(user) {
  return jwt.sign(
    { id: user.id, role: user.role, product: 'tiny-talkers' },
    process.env.JWT_SECRET || 'dev-secret',
    { expiresIn: '7d' },
  );
}

function ageOnDate(birthday) {
  const birthDate = new Date(`${birthday}T00:00:00`);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  if (today.getMonth() < birthDate.getMonth() ||
    (today.getMonth() === birthDate.getMonth() && today.getDate() < birthDate.getDate())) age--;
  return age;
}

router.post('/auth/register', async (req, res) => {
  const name = String(req.body.name || '').trim();
  const email = String(req.body.email || '').trim().toLowerCase();
  const birthday = String(req.body.birthday || '');
  const password = String(req.body.password || '');
  const parsedBirthday = new Date(`${birthday}T00:00:00`);
  if (name.length < 2 || name.length > 255 || !/^\S+@\S+\.\S+$/.test(email) ||
    !/^\d{4}-\d{2}-\d{2}$/.test(birthday) || Number.isNaN(parsedBirthday.getTime()) ||
    parsedBirthday.toISOString().slice(0, 10) !== birthday || parsedBirthday > new Date() || password.length < 8) {
    return res.status(400).json({ error: 'Enter a valid name, email, date of birth, and password of at least 8 characters.' });
  }
  if (req.body.acceptedTerms !== true) {
    return res.status(400).json({ error: 'Agree to the terms to create an account.' });
  }

  try {
    const user = await createTinyTalkersUser({
      name,
      email,
      birthday,
      age: ageOnDate(birthday),
      passwordHash: await bcrypt.hash(password, 12),
    });
    const emailSent = await sendRegistrationEmail(user);
    res.status(201).json({ user, token: issueToken(user), emailSent });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'That name or email is already registered.' });
    console.error('TinyTalkers registration failed:', error);
    res.status(500).json({ error: 'Could not create your account.' });
  }
});

router.post('/auth/google', async (req, res) => {
  const firebaseApiKey = process.env.FIREBASE_API_KEY;
  if (!firebaseApiKey) {
    return res.status(503).json({ error: 'Google sign-in is not configured on the server.' });
  }
  const idToken = String(req.body.idToken || '');
  if (!idToken) return res.status(400).json({ error: 'Google sign-in did not provide an identity token.' });

  try {
    const lookupResponse = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(firebaseApiKey)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      },
    );
    if (!lookupResponse.ok) {
      return res.status(401).json({ error: 'Google sign-in could not be verified. Please try again.' });
    }

    const lookupResult = await lookupResponse.json();
    const identity = lookupResult.users?.[0];
    const isGoogleIdentity = identity?.providerUserInfo?.some(provider => provider.providerId === 'google.com');
    if (!identity?.email || !identity.emailVerified || !isGoogleIdentity) {
      return res.status(401).json({ error: 'Use a verified Google account to sign in.' });
    }

    const email = String(identity.email).trim().toLowerCase();
    let user = await getTinyTalkersUserByEmail(email);
    let created = false;
    let emailSent = false;
    if (!user) {
      if (req.body.acceptedTerms !== true) {
        return res.json({ requiresTerms: true });
      }

      const localPart = email.split('@')[0];
      let name = String(identity.displayName || localPart).trim().slice(0, 255);
      if (name.length < 2) name = `Learner ${String(identity.localId).slice(-8)}`;
      if (await getTinyTalkersUserByIdentifier(name)) {
        name = `${name.slice(0, 225)} (${String(identity.localId).slice(-10)})`;
      }
      user = await createTinyTalkersUser({
        name,
        email,
        birthday: null,
        age: null,
        passwordHash: await bcrypt.hash(randomBytes(32).toString('hex'), 12),
      });
      created = true;
      emailSent = await sendRegistrationEmail(user);
    }

    res.json({ user, token: issueToken(user), created, emailSent });
  } catch (error) {
    console.error('TinyTalkers Google sign-in failed:', error);
    res.status(500).json({ error: 'Unable to sign in with Google.' });
  }
});

router.post('/auth/login', async (req, res) => {
  const identifier = String(req.body.identifier || '').trim();
  const password = String(req.body.password || '');
  if (!identifier || !password) return res.status(400).json({ error: 'Enter your email or name and password.' });

  try {
    const user = await getTinyTalkersUserByIdentifier(identifier);
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({ error: 'Incorrect email/name or password.' });
    }
    res.json({ user: publicUser(user), token: issueToken(user) });
  } catch (error) {
    console.error('TinyTalkers login failed:', error);
    res.status(500).json({ error: 'Unable to sign in.' });
  }
});

router.get('/auth/me', verifyTinyTalkersToken, async (req, res) => {
  try {
    const user = await getTinyTalkersUserById(req.tinyTalkersUser.id);
    if (!user) return res.status(401).json({ error: 'Account not found.' });
    res.json(user);
  } catch (error) {
    console.error('TinyTalkers account lookup failed:', error);
    res.status(500).json({ error: 'Unable to load your account.' });
  }
});

router.put('/auth/avatar', verifyTinyTalkersToken, async (req, res) => {
  const avatar = Number(req.body.avatar);
  if (!Number.isInteger(avatar) || avatar < 1 || avatar > 10) {
    return res.status(400).json({ error: 'Choose a valid avatar.' });
  }
  try {
    const user = await updateTinyTalkersAvatar(req.tinyTalkersUser.id, `avatar${avatar}.jpg`);
    res.json(user);
  } catch (error) {
    console.error('TinyTalkers avatar update failed:', error);
    res.status(500).json({ error: 'Could not save the avatar.' });
  }
});

router.get('/words', verifyTinyTalkersToken, async (_req, res) => {
  try {
    res.json(await getTinyTalkersWords());
  } catch (error) {
    console.error('TinyTalkers words load failed:', error);
    res.status(500).json({ error: 'Could not load the word library.' });
  }
});

router.get('/categories', verifyTinyTalkersToken, async (_req, res) => {
  try {
    res.json(await getTinyTalkersCategories());
  } catch (error) {
    console.error('TinyTalkers categories load failed:', error);
    res.status(500).json({ error: 'Could not load categories.' });
  }
});

router.get('/bucket', verifyTinyTalkersToken, async (req, res) => {
  try {
    res.json(await getTinyTalkersBucket(req.tinyTalkersUser.id));
  } catch (error) {
    console.error('TinyTalkers bucket load failed:', error);
    res.status(500).json({ error: 'Could not load your word bucket.' });
  }
});

router.post('/bucket/:wordId', verifyTinyTalkersToken, async (req, res) => {
  if (!/^\d+$/.test(req.params.wordId)) return res.status(400).json({ error: 'Invalid word.' });
  try {
    const added = await addTinyTalkersBucketWord(req.tinyTalkersUser.id, req.params.wordId);
    if (!added) return res.status(404).json({ error: 'Word not found or already saved.' });
    res.status(201).json({ success: true });
  } catch (error) {
    console.error('TinyTalkers bucket update failed:', error);
    res.status(500).json({ error: 'Could not save this word.' });
  }
});

router.delete('/bucket/:wordId', verifyTinyTalkersToken, async (req, res) => {
  if (!/^\d+$/.test(req.params.wordId)) return res.status(400).json({ error: 'Invalid word.' });
  try {
    await removeTinyTalkersBucketWord(req.tinyTalkersUser.id, req.params.wordId);
    res.json({ success: true });
  } catch (error) {
    console.error('TinyTalkers bucket update failed:', error);
    res.status(500).json({ error: 'Could not remove this word.' });
  }
});

router.post('/words', verifyTinyTalkersToken, requireTinyTalkersAdmin, async (req, res) => {
  const word = String(req.body.word || '').trim().toUpperCase();
  const category = String(req.body.category || '').trim();
  if (!CVC_WORD.test(word) || !category || category.length > 100) {
    return res.status(400).json({ error: 'Enter a three-letter CVC word and choose a category.' });
  }
  try {
    res.status(201).json(await addTinyTalkersWord({ word, category }));
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'That word is already in this category.' });
    console.error('TinyTalkers word creation failed:', error);
    res.status(500).json({ error: 'Could not add the word.' });
  }
});

router.delete('/words/:id', verifyTinyTalkersToken, requireTinyTalkersAdmin, async (req, res) => {
  if (!/^\d+$/.test(req.params.id)) return res.status(400).json({ error: 'Invalid word.' });
  try {
    const deleted = await deleteTinyTalkersWord(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Word not found.' });
    res.json({ success: true });
  } catch (error) {
    console.error('TinyTalkers word deletion failed:', error);
    res.status(500).json({ error: 'Could not delete the word.' });
  }
});

router.post('/categories', verifyTinyTalkersToken, requireTinyTalkersAdmin, async (req, res) => {
  const name = String(req.body.name || '').trim();
  if (name.length < 2 || name.length > 100) return res.status(400).json({ error: 'Category names need 2 to 100 characters.' });
  try {
    res.status(201).json(await addTinyTalkersCategory(name));
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'That category already exists.' });
    console.error('TinyTalkers category creation failed:', error);
    res.status(500).json({ error: 'Could not add the category.' });
  }
});

router.delete('/categories/:id', verifyTinyTalkersToken, requireTinyTalkersAdmin, async (req, res) => {
  if (!/^\d+$/.test(req.params.id)) return res.status(400).json({ error: 'Invalid category.' });
  try {
    const category = await deleteTinyTalkersCategory(req.params.id);
    if (!category) return res.status(404).json({ error: 'Category not found.' });
    res.json(category);
  } catch (error) {
    console.error('TinyTalkers category deletion failed:', error);
    res.status(500).json({ error: 'Could not delete the category.' });
  }
});

export default router;