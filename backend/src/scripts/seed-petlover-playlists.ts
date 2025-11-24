/**
 * Seed script to create playlists for @petlover2024 test user
 * Run: npx tsx src/scripts/seed-petlover-playlists.ts
 */

import { supabase } from '../config/supabase.js';

const PLAYLIST_DATA = [
  {
    name: "Funny Cats 😹",
    description: "The funniest cat videos that will make you laugh out loud!",
    visibility: 'public'
  },
  {
    name: "Cute Puppies 🐶",
    description: "Adorable puppy videos to brighten your day",
    visibility: 'public'
  },
  {
    name: "Pets Being Silly",
    description: "Animals doing the most ridiculous things",
    visibility: 'public'
  },
  {
    name: "My Favorites ❤️",
    description: "Personal collection of my all-time favorite pet videos",
    visibility: 'private'
  }
];

async function seedPetloverPlaylists() {
  console.log('🌱 Starting playlist seed script...\n');

  try {
    // 1. Find the petlover2024 user
    const testEmail = 'petlover2024@test.com';
    
    console.log('👤 Looking for @petlover2024...');
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, username')
      .eq('email', testEmail)
      .single();

    if (userError || !user) {
      throw new Error(`User not found. Please run seed-test-user-with-videos.ts first!`);
    }

    console.log(`✅ Found user: @${user.username}\n`);

    // 2. Delete existing playlists for this user
    console.log('🗑️  Removing old playlists...');
    await supabase
      .from('playlists')
      .delete()
      .eq('user_id', user.id);

    // 3. Create new playlists
    console.log('📚 Creating playlists...');
    
    const playlistsToInsert = PLAYLIST_DATA.map(playlist => ({
      ...playlist,
      user_id: user.id
    }));

    const { data: createdPlaylists, error: playlistsError } = await supabase
      .from('playlists')
      .insert(playlistsToInsert)
      .select('id, name, visibility');

    if (playlistsError) {
      throw new Error(`Failed to create playlists: ${playlistsError.message}`);
    }

    console.log(`✅ Created ${createdPlaylists?.length || 0} playlists\n`);

    // 4. Get all of the user's videos
    const { data: videos, error: videosError } = await supabase
      .from('videos')
      .select('id')
      .eq('user_id', user.id);

    if (videosError || !videos || videos.length === 0) {
      console.log('⚠️  No videos found for user, skipping video additions');
    } else {
      // 5. Add videos to ALL playlists
      console.log('🎬 Adding videos to playlists...');
      
      const playlistVideos = [];
      
      // Add videos to each playlist (distributed evenly)
      const videosPerPlaylist = Math.floor(videos.length / (createdPlaylists?.length || 1));
      
      createdPlaylists?.forEach((playlist, playlistIndex) => {
        const startIndex = playlistIndex * videosPerPlaylist;
        const endIndex = playlistIndex === createdPlaylists.length - 1 
          ? videos.length  // Last playlist gets remaining videos
          : (playlistIndex + 1) * videosPerPlaylist;
        
        for (let i = startIndex; i < endIndex && i < videos.length; i++) {
          playlistVideos.push({
            playlist_id: playlist.id,
            video_id: videos[i].id
          });
        }
      });

      if (playlistVideos.length > 0) {
        const { error: playlistVideosError } = await supabase
          .from('playlist_videos')
          .insert(playlistVideos);

        if (playlistVideosError) {
          console.error('⚠️  Warning: Could not add videos to playlists:', playlistVideosError.message);
        } else {
          console.log(`✅ Added ${playlistVideos.length} videos across ${createdPlaylists?.length} playlists\n`);
          
          // Show distribution
          const videoCountPerPlaylist: { [key: string]: number } = {};
          playlistVideos.forEach(pv => {
            videoCountPerPlaylist[pv.playlist_id] = (videoCountPerPlaylist[pv.playlist_id] || 0) + 1;
          });
          
          createdPlaylists?.forEach((playlist: any) => {
            const count = videoCountPerPlaylist[playlist.id] || 0;
            console.log(`   - ${playlist.name}: ${count} videos`);
          });
        }
      }
    }

    // 6. Output summary
    console.log('='.repeat(60));
    console.log('✨ PLAYLISTS CREATED! ✨');
    console.log('='.repeat(60));
    console.log(`\n📋 Created ${createdPlaylists?.length || 0} playlists for @petlover2024:`);
    createdPlaylists?.forEach((playlist: any, index) => {
      console.log(`   ${index + 1}. ${playlist.name} (${playlist.visibility === 'public' ? 'Public' : 'Private'})`);
    });
    console.log('\n🧪 TO TEST:');
    console.log('   1. Visit @petlover2024\'s profile');
    console.log('   2. Scroll to the Playlists section');
    console.log('   3. Click on a playlist to view it');
    console.log('\n' + '='.repeat(60) + '\n');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

// Run the seed script
seedPetloverPlaylists()
  .then(() => {
    console.log('✅ Seed script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Seed script failed:', error);
    process.exit(1);
  });

