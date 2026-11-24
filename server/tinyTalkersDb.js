import { pool } from './db.js';

export async function initializeTinyTalkersDatabase() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS tiny_talkers_users (
      id INT PRIMARY KEY AUTO_INCREMENT,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      birthday DATE NULL,
      age INT NULL,
      role VARCHAR(20) NOT NULL DEFAULT 'user',
      avatar VARCHAR(32) NOT NULL DEFAULT '',
      first_login BOOLEAN NOT NULL DEFAULT TRUE,
      agreed_to_terms BOOLEAN NOT NULL DEFAULT TRUE,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY tiny_talkers_users_name_unique (name)
    )
  `);
  await pool.query('ALTER TABLE tiny_talkers_users MODIFY COLUMN birthday DATE NULL, MODIFY COLUMN age INT NULL');
  await pool.query(`
    CREATE TABLE IF NOT EXISTS tiny_talkers_categories (
      id INT PRIMARY KEY AUTO_INCREMENT,
      name VARCHAR(100) NOT NULL UNIQUE,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS tiny_talkers_words (
      id INT PRIMARY KEY AUTO_INCREMENT,
      word VARCHAR(3) NOT NULL,
      category VARCHAR(100) NOT NULL,
      difficulty VARCHAR(32) NOT NULL DEFAULT 'CVC',
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY tiny_talkers_words_category_unique (word, category)
    )
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS tiny_talkers_word_buckets (
      user_id INT NOT NULL,
      word_id INT NOT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (user_id, word_id),
      FOREIGN KEY (user_id) REFERENCES tiny_talkers_users(id) ON DELETE CASCADE,
      FOREIGN KEY (word_id) REFERENCES tiny_talkers_words(id) ON DELETE CASCADE
    )
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS tiny_talkers_settings (
      setting_key VARCHAR(100) PRIMARY KEY,
      setting_value VARCHAR(255) NOT NULL
    )
  `);

  const [seedState] = await pool.query(
    'SELECT setting_key FROM tiny_talkers_settings WHERE setting_key = ?',
    ['starter_library_seeded'],
  );
  if (seedState.length === 0) {
    const starterCategories = ['Animals', 'Food', 'Home', 'Nature'];
    for (const name of starterCategories) {
      await pool.query('INSERT IGNORE INTO tiny_talkers_categories (name) VALUES (?)', [name]);
    }

    const starterWords = [
      ['CAT', 'Animals'], ['DOG', 'Animals'], ['HEN', 'Animals'], ['PIG', 'Animals'], ['FOX', 'Animals'], ['BUG', 'Animals'],
      ['HAM', 'Food'], ['JAM', 'Food'], ['NUT', 'Food'], ['BUN', 'Food'], ['FIG', 'Food'], ['YAM', 'Food'],
      ['BED', 'Home'], ['CUP', 'Home'], ['POT', 'Home'], ['RUG', 'Home'], ['FAN', 'Home'], ['LID', 'Home'],
      ['SUN', 'Nature'], ['MUD', 'Nature'], ['WEB', 'Nature'], ['LOG', 'Nature'], ['FOG', 'Nature'], ['DEW', 'Nature'],
    ];
    for (const [word, category] of starterWords) {
      await pool.query(
        'INSERT IGNORE INTO tiny_talkers_words (word, category) VALUES (?, ?)',
        [word, category],
      );
    }
    await pool.query(
      'INSERT INTO tiny_talkers_settings (setting_key, setting_value) VALUES (?, ?)',
      ['starter_library_seeded', 'true'],
    );
  }
}

const USER_COLUMNS = `id, name, email, DATE_FORMAT(birthday, '%Y-%m-%d') AS birthday,
  age, role, avatar, first_login AS firstLogin, agreed_to_terms AS agreedToTerms`;

export async function createTinyTalkersUser(user) {
  const [result] = await pool.query(
    'INSERT INTO tiny_talkers_users (name, email, password_hash, birthday, age) VALUES (?, ?, ?, ?, ?)',
    [user.name, user.email, user.passwordHash, user.birthday ?? null, user.age ?? null],
  );
  return getTinyTalkersUserById(result.insertId);
}

export async function getTinyTalkersUserByEmail(email) {
  const [rows] = await pool.query(
    `SELECT ${USER_COLUMNS} FROM tiny_talkers_users WHERE email = ? LIMIT 1`,
    [email],
  );
  return rows[0] || null;
}

export async function getTinyTalkersUserByIdentifier(identifier) {
  const [emailRows] = await pool.query(
    `SELECT ${USER_COLUMNS}, password_hash AS passwordHash FROM tiny_talkers_users WHERE email = ? LIMIT 1`,
    [identifier],
  );
  if (emailRows[0]) return emailRows[0];
  const [nameRows] = await pool.query(
    `SELECT ${USER_COLUMNS}, password_hash AS passwordHash FROM tiny_talkers_users WHERE name = ? LIMIT 1`,
    [identifier],
  );
  return nameRows[0] || null;
}

export async function getTinyTalkersUserById(id) {
  const [rows] = await pool.query(
    `SELECT ${USER_COLUMNS} FROM tiny_talkers_users WHERE id = ? LIMIT 1`,
    [Number(id)],
  );
  return rows[0] || null;
}

export async function updateTinyTalkersAvatar(id, avatar) {
  await pool.query(
    'UPDATE tiny_talkers_users SET avatar = ?, first_login = FALSE WHERE id = ?',
    [avatar, Number(id)],
  );
  return getTinyTalkersUserById(id);
}

export async function getTinyTalkersWords() {
  const [rows] = await pool.query(
    'SELECT id, word, category, difficulty FROM tiny_talkers_words ORDER BY word, id',
  );
  return rows.map(row => ({ ...row, id: String(row.id) }));
}

export async function getTinyTalkersCategories() {
  const [rows] = await pool.query(
    'SELECT id, name FROM tiny_talkers_categories ORDER BY name, id',
  );
  return rows.map(row => ({ ...row, id: String(row.id) }));
}

export async function addTinyTalkersWord({ word, category }) {
  const [result] = await pool.query(
    'INSERT INTO tiny_talkers_words (word, category) VALUES (?, ?)',
    [word, category],
  );
  return { id: String(result.insertId), word, category, difficulty: 'CVC' };
}

export async function deleteTinyTalkersWord(id) {
  const [result] = await pool.query('DELETE FROM tiny_talkers_words WHERE id = ?', [Number(id)]);
  return result.affectedRows > 0;
}

export async function addTinyTalkersCategory(name) {
  const [result] = await pool.query(
    'INSERT INTO tiny_talkers_categories (name) VALUES (?)',
    [name],
  );
  return { id: String(result.insertId), name };
}

export async function deleteTinyTalkersCategory(id) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [categories] = await connection.query(
      'SELECT name FROM tiny_talkers_categories WHERE id = ? FOR UPDATE',
      [Number(id)],
    );
    if (!categories[0]) {
      await connection.rollback();
      return null;
    }

    const name = categories[0].name;
    const [deletedWords] = await connection.query(
      'DELETE FROM tiny_talkers_words WHERE category = ?',
      [name],
    );
    await connection.query('DELETE FROM tiny_talkers_categories WHERE id = ?', [Number(id)]);
    await connection.commit();
    return { id: String(id), name, wordsDeleted: deletedWords.affectedRows };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function getTinyTalkersBucket(userId) {
  const [rows] = await pool.query(
    `SELECT words.id, words.word, words.category, words.difficulty
     FROM tiny_talkers_words AS words
     INNER JOIN tiny_talkers_word_buckets AS bucket ON bucket.word_id = words.id
     WHERE bucket.user_id = ? ORDER BY bucket.created_at DESC`,
    [Number(userId)],
  );
  return rows.map(row => ({ ...row, id: String(row.id) }));
}

export async function addTinyTalkersBucketWord(userId, wordId) {
  const [result] = await pool.query(
    'INSERT IGNORE INTO tiny_talkers_word_buckets (user_id, word_id) VALUES (?, ?)',
    [Number(userId), Number(wordId)],
  );
  return result.affectedRows > 0;
}

export async function removeTinyTalkersBucketWord(userId, wordId) {
  const [result] = await pool.query(
    'DELETE FROM tiny_talkers_word_buckets WHERE user_id = ? AND word_id = ?',
    [Number(userId), Number(wordId)],
  );
  return result.affectedRows > 0;
}