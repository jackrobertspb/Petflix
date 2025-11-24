/**
 * Seed script to create a test user with 20 videos for testing the feed
 * Run: npx tsx src/scripts/seed-test-user-with-videos.ts
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

async function seedTestUserWithVideos() {
  console.log('🌱 Starting seed script...\n');

  try {
    // 1. Check if test user already exists
    const testUsername = 'petlover2024';
    const testEmail = 'petlover2024@test.com';
    const testPassword = 'password123';

    console.log('👤 Checking for existing test user...');
    const { data: existingUser } = await supabase
      .from('users')
      .select('id, username, email')
      .eq('email', testEmail)
      .single();

    let userId: string;

    if (existingUser) {
      console.log(`✅ Test user already exists: @${existingUser.username} (${existingUser.email})`);
      userId = existingUser.id;

      // Delete existing videos for this user
      console.log('🗑️  Removing old videos...');
      await supabase
        .from('videos')
        .delete()
        .eq('user_id', userId);
    } else {
      // Create test user
      console.log('✨ Creating new test user...');
      const hashedPassword = await bcrypt.hash(testPassword, 10);

      const { data: newUser, error: userError } = await supabase
        .from('users')
        .insert({
          username: testUsername,
          email: testEmail,
          password_hash: hashedPassword,
          bio: '🐾 Pet enthusiast sharing the cutest animal moments! Follow for daily pet content! 🐶🐱'
        })
        .select('id, username, email')
        .single();

      if (userError || !newUser) {
        throw new Error(`Failed to create user: ${userError?.message}`);
      }

      userId = newUser.id;
      console.log(`✅ Created user: @${newUser.username} (${newUser.email})`);
    }

    // 2. Create 20 videos
    console.log('\n📹 Creating 20 videos...');
    
    const videos = [];
    for (let i = 0; i < 20; i++) {
      const videoId = YOUTUBE_VIDEO_IDS[i];
      const title = VIDEO_TITLES[i];
      const description = VIDEO_DESCRIPTIONS[i];

      videos.push({
        youtube_video_id: videoId,
        title: title,
        description: description,
        user_id: userId
      });
    }

    const { data: createdVideos, error: videosError } = await supabase
      .from('videos')
      .insert(videos)
      .select('id, title');

    if (videosError) {
      throw new Error(`Failed to create videos: ${videosError.message}`);
    }

    console.log(`✅ Created ${createdVideos?.length || 0} videos`);

    // 3. Output summary
    console.log('\n' + '='.repeat(60));
    console.log('✨ SEED COMPLETE! ✨');
    console.log('='.repeat(60));
    console.log('\n📋 TEST USER DETAILS:');
    console.log(`   Username: @${testUsername}`);
    console.log(`   Email:    ${testEmail}`);
    console.log(`   Password: ${testPassword}`);
    console.log(`   Videos:   ${createdVideos?.length || 0} videos created`);
    console.log('\n🧪 TO TEST:');
    console.log('   1. Log into your main account');
    console.log(`   2. Search for and follow @${testUsername}`);
    console.log('   3. Go to "My Feed" to see their videos');
    console.log('   4. Unfollow to verify videos disappear from feed');
    console.log('\n' + '='.repeat(60) + '\n');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

// Run the seed script
seedTestUserWithVideos()
  .then(() => {
    console.log('✅ Seed script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Seed script failed:', error);
    process.exit(1);
  });

