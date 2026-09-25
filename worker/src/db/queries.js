// Query helpers for D1
// While we used raw prepared statements in routes for simplicity, 
// you can extract complex queries here in the future.

export async function findUserByEmail(db, email) {
  return await db.prepare('SELECT * FROM users WHERE email = ?').bind(email).first();
}

export async function getAnnouncementById(db, id) {
  return await db.prepare('SELECT * FROM announcements WHERE id = ?').bind(id).first();
}

// Add more complex dashboard queries here later
