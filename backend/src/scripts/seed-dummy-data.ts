/**
 * Comprehensive seed script to create dummy users with videos and comments
 * Run: npx tsx src/scripts/seed-dummy-data.ts
 */

import { supabase } from '../config/supabase.js';
import bcrypt from 'bcrypt';

// Sample pet video IDs from YouTube (real pet videos)
const YOUTUBE_VIDEO_IDS = [
  'dQw4w9WgXcQ', // Famous video
  'J---aiyznGQ', // Keyboard Cat
  'tNtFgdwTsbU', // Surprised Kitty
  'G4Sn91t1V4g', // Dramatic Chipmunk
  'ESDAXKC2418', // Cat vs Printer
  'NTmf2OH_6Tw', // Cat Playing Piano
  'vxN4u42LxpY', // Silly cat
  'hY7m5jjJ9mM', // Funny dog compilation
  'VjE0Kdfos4Y', // Cute puppies
  'RP4abiHdQpc', // Funny cats compilation
  'J4vPYJGYz6I', // Dog tricks
  'cGN6pFVMcGc', // Cat meowing
  'YCaGYUIfdy4', // Funny animals
  '8rLEBlJ4wRI', // Cute kittens
  'X_jkHXbA0k4', // Dog parkour
  'atIOWKszbn8', // Cats being jerks
  'qpl5mOAXNl4', // Hamster workout
  'J38y3BnTk-0', // Parrot dancing
  '_OBlgSz8sSM', // Rabbit jumping
  'VVNGxdLOHvw', // Guinea pig eating
];

const DUMMY_USERS = [
  {
    username: 'petlover_alice',
    email: 'alice@test.com',
    password: 'password123',
    bio: '🐱 Cat enthusiast! Sharing daily cat content 🐾'
  },
  {
    username: 'dogdad_bob',
    email: 'bob@test.com',
    password: 'password123',
    bio: '🐶 Dog dad of 2 golden retrievers! Follow for daily doggo content!'
  },
  {
    username: 'exotic_pets_charlie',
    email: 'charlie@test.com',
    password: 'password123',
    bio: '🦜 Exotic pet owner! Parrots, rabbits, and more!'
  },
  {
    username: 'cute_animals_diana',
    email: 'diana@test.com',
    password: 'password123',
    bio: '💕 All animals are adorable! Sharing the cutest moments!'
  },
  {
    username: 'pet_trainer_ed',
    email: 'ed@test.com',
    password: 'password123',
    bio: '🎓 Professional pet trainer sharing tips and tricks!'
  }
];

const VIDEO_TITLES = [
  "Cute Cat Playing with Toy 🐱",
  "Funny Dog Compilation 2024 🐶",
  "Adorable Kitten Sleeping 😴",
  "Golden Retriever Playing Fetch",
  "Cat vs Cucumber Challenge",
  "Puppy Learning New Tricks",
  "Parrot Singing Along to Music 🎵",
  "Hamster Running on Wheel",
  "Bunny Eating Carrots ASMR 🥕",
  "Cats Being Dramatic 😹",
  "Dog Pool Party Fun Time 🏊",
  "Sleepy Puppies Compilation",
  "Cat Knocking Things Off Tables",
  "Excited Dog Sees Owner",
  "Baby Goats Jumping Around",
  "Guinea Pig Popcorning",
  "Dog Howling to Music",
  "Kittens First Bath Time",
  "Funny Animal Fails 2024",
  "Pets Being Silly Compilation"
];

const VIDEO_DESCRIPTIONS = [
  "This adorable pet video will make your day! Watch until the end!",
  "The cutest thing you'll see today 💕",
  "I can't stop watching this! So funny!",
  "My pet being absolutely adorable as usual",
  "Wait for it... you won't believe what happens!",
  "This made me laugh so hard 😂",
  "Pure joy in video form ✨",
  "The best pet video I've ever captured!",
  "This is why I love animals so much ❤️",
  "You need to see this! So precious!",
  "Funniest moment caught on camera",
  "This will brighten your day instantly ☀️",
  "My little furball being goofy again",
  "Too cute to handle! 🥰",
  "The wholesomeness is unreal",
  "This pet is full of personality!",
  "I could watch this forever",
  "Nature's comedians at their finest",
  "This video has everything!",
  "A perfect moment captured on camera 📸"
];

const COMMENT_TEXTS = [
  "This is so cute! 😍",
  "I can't stop watching this!",
  "My pet does the same thing!",
  "This made my day!",
  "So adorable! 🥰",
  "I need to show this to my friends!",
  "This is why I love pets!",
  "Too funny! 😂",
  "The cutest thing I've seen today!",
  "I wish my pet was this cute!",
  "This is amazing!",
  "I'm sharing this everywhere!",
  "So wholesome! 💕",
  "This deserves more views!",
  "I can't handle the cuteness!",
  "This is perfect!",
  "My heart is melting! ❤️",
  "This is the best video!",
  "I'm obsessed with this!",
  "This is everything! ✨"
];

async function seedDummyData() {
  console.log('🌱 Starting comprehensive seed script...\n');

  try {
    const userIds: string[] = [];
    const videoIds: string[] = [];

    // 1. Create dummy users
    console.log('👥 Creating dummy users...');
    for (const userData of DUMMY_USERS) {
      // Check if user exists
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('email', userData.email)
        .single();

      if (existingUser) {
        console.log(`   ⚠️  User ${userData.username} already exists, skipping...`);
        userIds.push(existingUser.id);
        continue;
      }

      const hashedPassword = await bcrypt.hash(userData.password, 10);
      const { data: newUser, error: userError } = await supabase
        .from('users')
        .insert({
          username: userData.username,
          email: userData.email,
          password_hash: hashedPassword,
          bio: userData.bio
        })
        .select('id, username')
        .single();

      if (userError || !newUser) {
        console.error(`   ❌ Failed to create user ${userData.username}:`, userError?.message);
        continue;
      }

      userIds.push(newUser.id);
      console.log(`   ✅ Created user: @${newUser.username}`);
    }

    if (userIds.length === 0) {
      console.log('   ⚠️  No users created (all may already exist)');
      return;
    }

    console.log(`\n✅ Created ${userIds.length} users\n`);

    // 2. Create videos for each user (3-5 videos per user)
    console.log('📹 Creating videos...');
    let videoIndex = 0;

    for (let i = 0; i < userIds.length; i++) {
      const userId = userIds[i];
      const videosPerUser = 3 + Math.floor(Math.random() * 3); // 3-5 videos per user
      
      const videos = [];
      for (let j = 0; j < videosPerUser && videoIndex < YOUTUBE_VIDEO_IDS.length; j++) {
        videos.push({
          youtube_video_id: YOUTUBE_VIDEO_IDS[videoIndex % YOUTUBE_VIDEO_IDS.length],
          title: VIDEO_TITLES[videoIndex % VIDEO_TITLES.length],
          description: VIDEO_DESCRIPTIONS[videoIndex % VIDEO_DESCRIPTIONS.length],
          user_id: userId
        });
        videoIndex++;
      }

      if (videos.length > 0) {
        const { data: createdVideos, error: videosError } = await supabase
          .from('videos')
          .insert(videos)
          .select('id');

        if (videosError) {
          console.error(`   ❌ Failed to create videos for user ${i + 1}:`, videosError.message);
        } else {
          createdVideos?.forEach(video => videoIds.push(video.id));
          console.log(`   ✅ Created ${createdVideos?.length || 0} videos for user ${i + 1}`);
        }
      }
    }

    console.log(`\n✅ Created ${videoIds.length} total videos\n`);

    // 3. Create comments on videos (2-4 comments per video from random users)
    console.log('💬 Creating comments...');
    let totalComments = 0;

    for (const videoId of videoIds) {
      const commentsPerVideo = 2 + Math.floor(Math.random() * 3); // 2-4 comments per video
      
      const comments = [];
      for (let i = 0; i < commentsPerVideo; i++) {
        // Random user (not the video owner)
        const videoOwner = videoIds.indexOf(videoId) < userIds.length 
          ? userIds[Math.floor(videoIds.indexOf(videoId) / 3)]
          : userIds[0];
        
        const availableUsers = userIds.filter(id => id !== videoOwner);
        if (availableUsers.length === 0) continue;

        const randomUserId = availableUsers[Math.floor(Math.random() * availableUsers.length)];
        const randomComment = COMMENT_TEXTS[Math.floor(Math.random() * COMMENT_TEXTS.length)];

        comments.push({
          video_id: videoId,
          user_id: randomUserId,
          content: randomComment
        });
      }

      if (comments.length > 0) {
        const { error: commentsError } = await supabase
          .from('comments')
          .insert(comments);

        if (commentsError) {
          console.error(`   ❌ Failed to create comments for video:`, commentsError.message);
        } else {
          totalComments += comments.length;
        }
      }
    }

    console.log(`✅ Created ${totalComments} total comments\n`);

    // 4. Output summary
    console.log('='.repeat(60));
    console.log('✨ SEED COMPLETE! ✨');
    console.log('='.repeat(60));
    console.log('\n📋 SUMMARY:');
    console.log(`   Users:    ${userIds.length}`);
    console.log(`   Videos:   ${videoIds.length}`);
    console.log(`   Comments: ${totalComments}`);
    console.log('\n👥 TEST USERS (all passwords: password123):');
    DUMMY_USERS.forEach((user, i) => {
      if (i < userIds.length) {
        console.log(`   @${user.username} - ${user.email}`);
      }
    });
    console.log('\n🧪 TO TEST:');
    console.log('   1. Log in with any test user account');
    console.log('   2. Browse videos and see comments');
    console.log('   3. Follow other users to see their videos in feed');
    console.log('   4. Add your own comments and videos!');
    console.log('\n' + '='.repeat(60) + '\n');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

// Run the seed script
seedDummyData()
  .then(() => {
    console.log('✅ Seed script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Seed script failed:', error);
    process.exit(1);
  });

