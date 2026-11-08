const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Error: Missing Supabase environment variables (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY).');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function deleteTestVideos() {
    console.log('Connecting to Supabase...');

    // 1. Fetch all videos
    const { data: videos, error: fetchError } = await supabase
        .from('videos')
        .select('id, url, title, user_id');

    if (fetchError) {
        console.error('Error fetching videos:', fetchError);
        return;
    }

    console.log(`Found ${videos.length} videos total.`);

    // 2. Identify test videos
    const placeholderPatterns = [
        'BigBuckBunny',
        'ElephantsDream',
        'gtv-videos-bucket',
        'commondatastorage.googleapis.com',
        '/sample/',
        'big-buck-bunny'
    ];

    const toDelete = videos.filter(v => {
        const url = (v.url || '').toLowerCase();

        // Rule 1: Known test patterns in URL
        const isTestPattern = placeholderPatterns.some(pattern =>
            url.includes(pattern.toLowerCase())
        );

        // Rule 2: Generic mock user ID
        const isMockUser = v.user_id === '00000000-0000-0000-0000-000000000000';

        // Rule 3: Missing or extremely short titles (edge case)
        const hasNoRealTitle = !v.title || v.title.length < 2 || v.title.toLowerCase().includes('video');

        // PRESERVATION RULE: Never delete if it looks like a real Supabase storage link
        const isSupabaseVideo = url.includes('/storage/v1/object/public/videos/');

        if (isSupabaseVideo) return false;

        return isTestPattern || isMockUser || hasNoRealTitle;
    });

    if (toDelete.length === 0) {
        console.log('No test videos found for deletion.');
        return;
    }

    console.log(`Identified ${toDelete.length} test videos for deletion:`);
    toDelete.forEach(v => console.log(` - [${v.id}] ${v.title} (${v.url})`));

    // 3. Perform Deletion
    const deleteIds = toDelete.map(v => v.id);
    const { error: deleteError } = await supabase
        .from('videos')
        .delete()
        .in('id', deleteIds);

    if (deleteError) {
        console.error('Error deleting videos:', deleteError);
    } else {
        console.log(`Successfully deleted ${deleteIds.length} test videos.`);
    }
}

deleteTestVideos();
