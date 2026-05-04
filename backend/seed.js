const { getDb, run, save } = require('./db');
const bcrypt = require('bcryptjs');

const users = [
  { u: 'ocean_breeze', e: 'ocean@wavely.com', b: 'Riding the waves 🌊💙' },
  { u: 'coral_reef', e: 'coral@wavely.com', b: 'Deep sea explorer 🐠' },
  { u: 'aqua_marine', e: 'aqua@wavely.com', b: 'Fluid thoughts 💧' },
  { u: 'tidal_wave', e: 'tidal@wavely.com', b: 'Unstoppable force 🌊' },
  { u: 'deep_blue', e: 'blue@wavely.com', b: 'Mysteries of the deep 🐋' },
  { u: 'pacific_vibes', e: 'pacific@wavely.com', b: 'West coast best coast 🌴' },
  { u: 'atlantic_soul', e: 'atlantic@wavely.com', b: 'East coast chilling 🏖️' },
  { u: 'seafoam_green', e: 'seafoam@wavely.com', b: 'Soft and aesthetic 🍵' },
  { u: 'nautical_miles', e: 'nautical@wavely.com', b: 'Sailing away ⛵' },
  { u: 'pearl_diver', e: 'pearl@wavely.com', b: 'Finding hidden gems 🦪' },
  { u: 'tsunami_surfer', e: 'tsunami@wavely.com', b: 'Catching the big ones 🏄‍♂️' },
  { u: 'maritime_tales', e: 'maritime@wavely.com', b: 'Stories from the sea ⚓' },
  { u: 'abyssal_zone', e: 'abyssal@wavely.com', b: 'Dark and mysterious 🦑' },
  { u: 'lagoon_life', e: 'lagoon@wavely.com', b: 'Crystal clear waters 🏝️' },
  { u: 'current_mood', e: 'current@wavely.com', b: 'Going with the flow 〰️' },
  { u: 'wave_runner', e: 'runner@wavely.com', b: 'Speeding through life 🚤' },
  { u: 'saltwater_heart', e: 'saltwater@wavely.com', b: 'Ocean in my veins 💙' },
  { u: 'marine_biology', e: 'marine@wavely.com', b: 'Studying the sea 🦈' },
  { u: 'coastal_dreams', e: 'coastal@wavely.com', b: 'Living on the edge 🌅' },
  { u: 'sunset_sail', e: 'sunset@wavely.com', b: 'Chasing the horizon 🌇' }
];

const posts = [
  "The ocean is everything I want to be. Beautiful, mysterious, wild and free. 🌊",
  "Just watched the most incredible sunset over the water. The colors were breathtaking! 🌅",
  "Feeling the sand between my toes and the salt in the air. This is paradise. 🏖️",
  "Sometimes you just have to go with the flow. Let the waves carry you. 〰️",
  "Diving deep into my thoughts today. It's like a whole other world down there. 🐋",
  "Sailing into the weekend like... ⛵",
  "Found this amazing little cove today. Crystal clear water and perfect waves! 🏝️",
  "The sound of the waves crashing on the shore is my favorite lullaby. 🌊💤",
  "Anyone else feel completely at peace when they're near the water? 💙",
  "Catching waves and catching feelings. 🏄‍♂️💖",
  "The ocean is a poem without words. 🌊📖",
  "Saltwater cures everything. Sweat, tears, or the sea. 💧",
  "Let the sea set you free. 🕊️🌊",
  "Mermaid vibes today. 🧜‍♀️✨",
  "Life is better in a bikini. 👙☀️",
  "Sun, sand, and a pineapple in hand. 🍍🏖️",
  "High tides and good vibes. 🌊✌️",
  "You can't stop the waves, but you can learn to surf. 🏄‍♀️",
  "Smell the sea and feel the sky. Let your soul and spirit fly. 🦅🌊",
  "The voice of the sea speaks to the soul. 🌊🗣️",
  "Lost at sea? I'm not sure I want to be found. 🧭",
  "A smooth sea never made a skilled sailor. ⚓",
  "Water is the driving force of all nature. 💧🌍",
  "We are tied to the ocean. And when we go back to the sea, whether it is to sail or to watch - we are going back from whence we came. 🌊🧬",
  "Dance with the waves, move with the sea. Let the rhythm of the water set your soul free. 💃🌊"
];

async function seed() {
  const db = await getDb();
  
  console.log("Seeding database...");
  
  // Create users
  const userIds = [];
  const hash = bcrypt.hashSync('password123', 10);
  
  for (const user of users) {
    try {
      const result = run('INSERT INTO users (username, email, password_hash, bio) VALUES (?, ?, ?, ?)', 
        [user.u, user.e, hash, user.b]);
      userIds.push(result.lastInsertRowid);
      console.log(`Created user: ${user.u}`);
    } catch (e) {
      console.log(`User ${user.u} might already exist.`);
      const existing = db.exec(`SELECT id FROM users WHERE username = '${user.u}'`);
      if (existing.length && existing[0].values.length) {
        userIds.push(existing[0].values[0][0]);
      }
    }
  }

  // Create posts
  if (userIds.length > 0) {
    for (const content of posts) {
      const randomUserId = userIds[Math.floor(Math.random() * userIds.length)];
      run('INSERT INTO posts (user_id, content) VALUES (?, ?)', [randomUserId, content]);
    }
    console.log(`Created ${posts.length} posts.`);
    
    // Create follows
    let followCount = 0;
    for (let i = 0; i < userIds.length; i++) {
      for (let j = 0; j < userIds.length; j++) {
        if (i !== j && Math.random() > 0.6) {
          try {
            run('INSERT INTO follows (follower_id, following_id) VALUES (?, ?)', [userIds[i], userIds[j]]);
            followCount++;
          } catch(e) {}
        }
      }
    }
    console.log(`Created ${followCount} random follows.`);
    
    // Create likes & comments
    const allPosts = db.exec("SELECT id FROM posts");
    let likeCount = 0;
    let commentCount = 0;
    if (allPosts.length && allPosts[0].values.length) {
      for (const row of allPosts[0].values) {
        const postId = row[0];
        // Likes
        for (const uid of userIds) {
          if (Math.random() > 0.4) {
            try {
              run('INSERT INTO likes (post_id, user_id) VALUES (?, ?)', [postId, uid]);
              likeCount++;
            } catch(e) {}
          }
        }
        // Comments
        const numComments = Math.floor(Math.random() * 5); // 0-4 comments per post
        for(let i=0; i<numComments; i++) {
          const randomUserId = userIds[Math.floor(Math.random() * userIds.length)];
          const comments = ["Love this! 😍", "So true!", "Amazing vibe 🌊", "Wow! 😮", "I totally agree!", "Beautiful words.", "This resonates so much.", "Absolutely!", "Preach! 🙌", "Such a mood."];
          run('INSERT INTO comments (post_id, user_id, content) VALUES (?, ?, ?)', [postId, randomUserId, comments[Math.floor(Math.random()*comments.length)]]);
          commentCount++;
        }
      }
      console.log(`Created ${likeCount} likes and ${commentCount} comments.`);
    }
  }
  
  save();
  console.log("Seeding complete!");
}

seed();
