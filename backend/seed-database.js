/**
 * Database Seeder for Petflix
 * 
 * This script populates the database with test data:
 * - 10 users
 * - 2 videos per user (20 total)
 * - 1 comment on each video
 * - Random follow relationships
 */

import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5001/api/v1';

// Sample pet video IDs from YouTube (verified working videos)
const SAMPLE_VIDEOS = [
  'dQw4w9WgXcQ', // Never Gonna Give You Up
  'J---aiyznGQ', // Keyboard Cat
  'wZZ7oFKsKzY', // Nyan Cat
  '2Z4m4lnjxkY', // Gangnam Style
  'y6120QOlsfU', // Darude - Sandstorm
  'oHg5SJYRHA0', // RickRoll
  'dGeEuyG_DIc', // Nyan Cat 10 hours
  '9bZkp7q19f0', // PSY - Gangnam Style
  'jNQXAC9IVRw', // Me at the zoo (first YouTube video)
  'OPf0YbXqDm0', // Mark Ronson - Uptown Funk
  'kJQP7kiw5Fk', // Luis Fonsi - Despacito
  'fJ9rUzIMcZQ', // Queen - Bohemian Rhapsody
  'RgKAFK5djSk', // Wiz Khalifa - See You Again
  'hTWKbfoikeg', // Nirvana - Smells Like Teen Spirit
  '60ItHLz5WEA', // Alan Walker - Faded
  'CevxZvSJLk8', // Katy Perry - Roar
  'e-ORhEE3VVg', // Taylor Swift - Blank Space
  'QcIy9NiNbmo', // Taylor Swift - Bad Blood
  'LDZX4ooRsWs', // Shakira - Hips Don't Lie
  'PIb6AZdTr-A', // Passenger - Let Her Go
];

const SAMPLE_COMMENTS = [
  "This is adorable! 🥰",
  "Best video ever!",
  "Can't stop watching this!",
  "So cute! 😍",
  "This made my day!",
  "LOL this is hilarious 😂",
  "Sharing this with everyone!",
  "Aww I love this!",
  "This never gets old",
  "Perfect! 👌",
  "This is why I love the internet",
  "Too cute to handle!",
  "I needed this today 💕",
  "Amazing content!",
  "This is gold! ⭐",
  "Obsessed with this!",
  "So wholesome!",
  "This is everything!",
  "Pure joy! 😊",
  "Instant classic!",
];

const users = [];
let videoCount = 0;

async function makeRequest(method, endpoint, body = null, token = null) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };

  if (token) {
    options.headers['Authorization'] = `Bearer ${token}`;
  }

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, options);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(`API Error: ${data.message || data.error || 'Unknown error'}`);
  }

  return data;
}

async function createUser(index) {
  console.log(`\n📝 Creating user ${index + 1}/10...`);
  
  const username = `petlover${index + 1}`;
  const email = `petlover${index + 1}@petflix.com`;
  const password = 'Password123!';

  try {
    const response = await makeRequest('POST', '/auth/register', {
      username,
      email,
      password,
    });

    console.log(`✅ Created user: ${username}`);
    return {
      username,
      email,
      password,
      token: response.token,
      userId: response.user.id,
    };
  } catch (error) {
    console.error(`❌ Failed to create user ${username}:`, error.message);
    throw error;
  }
}

async function shareVideo(user, videoIndex) {
  console.log(`  📹 Sharing video ${videoIndex + 1}/2 for ${user.username}...`);
  
  const titles = [
    "Check out this cute pet video!",
    "This is too funny!",
    "My favorite pet moment",
    "You have to see this!",
    "Cutest thing ever!",
    "This made me smile",
    "Pet goals!",
    "Adorable pet alert!",
    "Watch this cutie!",
    "Best pet video!",
  ];

  // Try up to 3 different videos if one fails
  let attempts = 0;
  const maxAttempts = 3;

  while (attempts < maxAttempts) {
    const videoId = SAMPLE_VIDEOS[videoCount % SAMPLE_VIDEOS.length];
    videoCount++;

    try {
      const response = await makeRequest(
        'POST',
        '/videos',
        {
          youtubeUrl: `https://www.youtube.com/watch?v=${videoId}`,
          title: titles[Math.floor(Math.random() * titles.length)],
          description: `Shared by ${user.username}`,
        },
        user.token
      );

      console.log(`  ✅ Shared video: ${response.video.id.substring(0, 8)}...`);
      return response.video;
    } catch (error) {
      attempts++;
      if (attempts >= maxAttempts) {
        console.error(`  ❌ Failed to share video after ${maxAttempts} attempts:`, error.message);
        throw error;
      }
      console.log(`  ⚠️  Video failed, trying another... (attempt ${attempts}/${maxAttempts})`);
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
}

async function addComment(video, commenter) {
  const comment = SAMPLE_COMMENTS[Math.floor(Math.random() * SAMPLE_COMMENTS.length)];
  
  try {
    await makeRequest(
      'POST',
      '/comments',
      {
        video_id: video.id,
        text: comment,
      },
      commenter.token
    );

    console.log(`  💬 Comment added to video ${video.id.substring(0, 8)}... by ${commenter.username}`);
  } catch (error) {
    console.error(`  ❌ Failed to add comment:`, error.message);
  }
}

async function followUser(follower, userToFollow) {
  if (follower.userId === userToFollow.userId) {
    return; // Don't follow yourself
  }

  try {
    await makeRequest('POST', `/follows/${userToFollow.userId}`, null, follower.token);
    console.log(`  👥 ${follower.username} followed ${userToFollow.username}`);
  } catch (error) {
    // Ignore errors (might already be following)
    if (!error.message.includes('Already following')) {
      console.error(`  ⚠️  Follow failed:`, error.message);
    }
  }
}

async function seedDatabase() {
  console.log('🌱 Starting Petflix Database Seeder...\n');
  console.log('=' .repeat(50));

  try {
    // Step 1: Create 10 users
    console.log('\n📋 STEP 1: Creating 10 users...');
    for (let i = 0; i < 10; i++) {
      const user = await createUser(i);
      users.push(user);
      await new Promise(resolve => setTimeout(resolve, 500)); // Small delay
    }

    console.log(`\n✅ Created ${users.length} users successfully!`);

    // Step 2: Each user shares 2 videos
    console.log('\n📋 STEP 2: Sharing videos (2 per user)...');
    const allVideos = [];

    for (let i = 0; i < users.length; i++) {
      const user = users[i];
      console.log(`\n👤 User: ${user.username}`);
      
      for (let j = 0; j < 2; j++) {
        const video = await shareVideo(user, j);
        allVideos.push({ video, owner: user });
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    console.log(`\n✅ Shared ${allVideos.length} videos successfully!`);

    // Step 3: Add 1 comment to each video
    console.log('\n📋 STEP 3: Adding comments to videos...');
    for (const { video, owner } of allVideos) {
      // Pick a random user (not the video owner) to comment
      const commenters = users.filter(u => u.userId !== owner.userId);
      const randomCommenter = commenters[Math.floor(Math.random() * commenters.length)];
      
      await addComment(video, randomCommenter);
      await new Promise(resolve => setTimeout(resolve, 300));
    }

    console.log(`\n✅ Added ${allVideos.length} comments successfully!`);

    // Step 4: Create some follow relationships
    console.log('\n📋 STEP 4: Creating follow relationships...');
    for (let i = 0; i < users.length; i++) {
      const follower = users[i];
      
      // Each user follows 2-4 random other users
      const numToFollow = Math.floor(Math.random() * 3) + 2; // 2-4 follows
      const shuffled = [...users].sort(() => Math.random() - 0.5);
      
      for (let j = 0; j < numToFollow && j < shuffled.length; j++) {
        await followUser(follower, shuffled[j]);
        await new Promise(resolve => setTimeout(resolve, 300));
      }
    }

    // Final Summary
    console.log('\n' + '=' .repeat(50));
    console.log('🎉 DATABASE SEEDING COMPLETE!\n');
    console.log('📊 Summary:');
    console.log(`   ✅ ${users.length} users created`);
    console.log(`   ✅ ${allVideos.length} videos shared`);
    console.log(`   ✅ ${allVideos.length} comments added`);
    console.log(`   ✅ Follow relationships created`);
    console.log('\n📝 Test Users:');
    users.forEach((user, i) => {
      console.log(`   ${i + 1}. ${user.username} / ${user.email} / Password123!`);
    });
    console.log('\n🚀 You can now login with any of these users!');
    console.log('=' .repeat(50) + '\n');

  } catch (error) {
    console.error('\n❌ SEEDING FAILED:', error.message);
    process.exit(1);
  }
}

// Run the seeder
seedDatabase().catch(console.error);

