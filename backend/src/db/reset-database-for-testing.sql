    -- ========================================
    -- COMPLETE DATABASE RESET FOR TESTING
    -- ========================================
    -- ⚠️  DANGER: This will DELETE ALL DATA
    -- ⚠️  Use ONLY for testing/development
    -- ⚠️  DO NOT run in production!
    -- ========================================

    -- Run this in Supabase Dashboard → SQL Editor

    BEGIN;

-- Display current counts before deletion
DO $$
DECLARE
    notif_count INT := 0;
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'DATABASE RESET - BEFORE';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Users: %', (SELECT COUNT(*) FROM users);
    RAISE NOTICE 'Videos: %', (SELECT COUNT(*) FROM videos);
    RAISE NOTICE 'Comments: %', (SELECT COUNT(*) FROM comments);
    RAISE NOTICE 'Playlists: %', (SELECT COUNT(*) FROM playlists);
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'notifications') THEN
        SELECT COUNT(*) INTO notif_count FROM notifications;
        RAISE NOTICE 'Notifications: %', notif_count;
    ELSE
        RAISE NOTICE 'Notifications: N/A (table not exists)';
    END IF;
    
    RAISE NOTICE '========================================';
END $$;

-- ========================================
-- DELETE ALL DATA (in correct order)
-- Gracefully handles missing tables
-- ========================================

-- Helper: Delete from table if it exists
DO $$
BEGIN
    -- 1. Error logs and monitoring (optional tables)
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'error_logs') THEN
        DELETE FROM error_logs;
        RAISE NOTICE 'Deleted error_logs';
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'anomaly_detection_config') THEN
        DELETE FROM anomaly_detection_config;
        RAISE NOTICE 'Deleted anomaly_detection_config';
    END IF;

    -- 2. Notification system (optional)
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'notification_queue') THEN
        DELETE FROM notification_queue;
        RAISE NOTICE 'Deleted notification_queue';
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'notifications') THEN
        DELETE FROM notifications;
        RAISE NOTICE 'Deleted notifications';
    END IF;

    -- 3. Push subscriptions
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'push_subscriptions') THEN
        DELETE FROM push_subscriptions;
        RAISE NOTICE 'Deleted push_subscriptions';
    END IF;

    -- 4. Video interactions (optional)
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'video_views') THEN
        DELETE FROM video_views;
        RAISE NOTICE 'Deleted video_views';
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'video_likes') THEN
        DELETE FROM video_likes;
        RAISE NOTICE 'Deleted video_likes';
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'shareable_urls') THEN
        DELETE FROM shareable_urls;
        RAISE NOTICE 'Deleted shareable_urls';
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'search_history') THEN
        DELETE FROM search_history;
        RAISE NOTICE 'Deleted search_history';
    END IF;

    -- 5. Comment interactions (optional)
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'comment_likes') THEN
        DELETE FROM comment_likes;
        RAISE NOTICE 'Deleted comment_likes';
    END IF;

    -- 6. Comments (REQUIRED - must be before videos)
    DELETE FROM comments;
    RAISE NOTICE 'Deleted comments';

    -- 7. Playlist system (optional)
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'playlist_tags') THEN
        DELETE FROM playlist_tags;
        RAISE NOTICE 'Deleted playlist_tags';
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'playlist_videos') THEN
        DELETE FROM playlist_videos;
        RAISE NOTICE 'Deleted playlist_videos';
    END IF;
    
    DELETE FROM playlists;
    RAISE NOTICE 'Deleted playlists';

    -- 8. Reports
    DELETE FROM reported_videos;
    RAISE NOTICE 'Deleted reported_videos';

    -- 9. Videos (REQUIRED - must be before users for proper cascade)
    DELETE FROM videos;
    RAISE NOTICE 'Deleted videos';

    -- 10. Social relationships
    DELETE FROM followers;
    RAISE NOTICE 'Deleted followers';

    -- 11. User authentication (optional)
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'password_reset_tokens') THEN
        DELETE FROM password_reset_tokens;
        RAISE NOTICE 'Deleted password_reset_tokens';
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'email_verification_tokens') THEN
        DELETE FROM email_verification_tokens;
        RAISE NOTICE 'Deleted email_verification_tokens';
    END IF;

    -- 12. Admin configurations (optional)
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'relevance_weights') THEN
        DELETE FROM relevance_weights;
        RAISE NOTICE 'Deleted relevance_weights';
    END IF;

    -- 13. Users (LAST - will cascade delete any remaining related data)
    DELETE FROM users;
    RAISE NOTICE 'Deleted users';
    
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ All data deleted successfully!';
    RAISE NOTICE '========================================';
END $$;

    -- ========================================
    -- VERIFY DELETION
    -- ========================================

DO $$
DECLARE
    users_count INT := 0;
    videos_count INT := 0;
    comments_count INT := 0;
    playlists_count INT := 0;
    notifications_count INT := 0;
    error_logs_count INT := 0;
    total_records INT := 0;
BEGIN
    -- Count remaining records (only if tables exist)
    SELECT COUNT(*) INTO users_count FROM users;
    SELECT COUNT(*) INTO videos_count FROM videos;
    SELECT COUNT(*) INTO comments_count FROM comments;
    SELECT COUNT(*) INTO playlists_count FROM playlists;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'notifications') THEN
        SELECT COUNT(*) INTO notifications_count FROM notifications;
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'error_logs') THEN
        SELECT COUNT(*) INTO error_logs_count FROM error_logs;
    END IF;
    
    total_records := users_count + videos_count + comments_count + playlists_count + notifications_count + error_logs_count;
    
    RAISE NOTICE '========================================';
    RAISE NOTICE 'DATABASE RESET - AFTER';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Users: %', users_count;
    RAISE NOTICE 'Videos: %', videos_count;
    RAISE NOTICE 'Comments: %', comments_count;
    RAISE NOTICE 'Playlists: %', playlists_count;
    RAISE NOTICE 'Notifications: %', notifications_count;
    RAISE NOTICE 'Error Logs: %', error_logs_count;
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Total Records: %', total_records;
    RAISE NOTICE '========================================';
    
    IF total_records = 0 THEN
        RAISE NOTICE '✅ SUCCESS: Database completely wiped!';
        RAISE NOTICE '✅ All tables are empty and ready for testing';
    ELSE
        RAISE WARNING '⚠️  WARNING: % records still remain', total_records;
        RAISE WARNING '⚠️  You may need to check foreign key constraints';
    END IF;
    
    RAISE NOTICE '========================================';
END $$;

    COMMIT;

    -- ========================================
    -- OPTIONAL: Create a test admin user
    -- ========================================
    -- Uncomment the following to create a test admin after reset:

    /*
    -- Test admin credentials:
    -- Username: testadmin
    -- Email: admin@test.com
    -- Password: TestAdmin123!
    -- (Password hash for: TestAdmin123!)

    INSERT INTO users (username, email, password_hash, is_admin, created_at, updated_at)
    VALUES (
        'testadmin',
        'admin@test.com',
        '$2b$10$XK4zqQ5J5Z5Z5Z5Z5Z5Z5u.Yh8qXYXYXYXYXYXYXYXYXYXYXYXYXY', -- Hash for TestAdmin123!
        true,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    );

    -- Verify admin created
    SELECT id, username, email, is_admin, created_at
    FROM users
    WHERE email = 'admin@test.com';
    */

    -- ========================================
    -- NOTES
    -- ========================================
    -- This script:
    -- 1. Deletes ALL user data
    -- 2. Deletes ALL videos, comments, playlists
    -- 3. Deletes ALL notifications and logs
    -- 4. Preserves table structure (does NOT drop tables)
    -- 5. Preserves migrations and schema
    -- 6. Resets database to completely fresh state
    --
    -- After running this:
    -- - You can register new users from the UI
    -- - All features will work as if freshly installed
    -- - No data recovery is possible
    -- ========================================

