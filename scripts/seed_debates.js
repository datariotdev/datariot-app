const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

dotenv.config({ path: '.env' });

const supabaseUrl = process.env.SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Supabase URL or Key missing');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const SEED_VIDEOS = [
    {
        id: "1daa396d-1fbb-48ad-871a-34cf67b734f2",
        url: "https://clipto-videos.s3.eu-north-1.amazonaws.com/videos/1763127238246_4ojnrk.mp4",
        title: "AI & Human Logic",
        content: "Will AI eventually surpass human logical reasoning, or is it limited by its training data?",
        author_id: "7a5bc2bb-b0cf-4acf-abd9-2841c8e9bf14"
    },
    {
        id: "a3a238d3-495f-4604-890e-024889010c2a",
        url: "https://clipto-videos.s3.eu-north-1.amazonaws.com/videos/1764005932821_drqtfz.mp4",
        title: "Robotics Ethics",
        content: "Should robots be granted legal personhood if they reach a certain level of autonomy?",
        author_id: "7eb0e5c5-f4ed-4f0f-b092-0dedaf343b03"
    },
    {
        id: "abd6bf4f-357f-4daf-a0cc-04ee2a7d08d0",
        url: "https://clipto-videos.s3.eu-north-1.amazonaws.com/videos/1763129296139_mequvq.mp4",
        title: "The Future of Privacy",
        content: "Is personal privacy a relic of the past in the age of global digital surveillance?",
        author_id: "7a5bc2bb-b0cf-4acf-abd9-2841c8e9bf14"
    }
];

const ARGUMENTS = {
    "AI & Human Logic": [
        { side: 'FOR', text: "AI processes billions of parameters and can detect logical patterns humans miss. It's only a matter of scale.", strength: 12 },
        { side: 'FOR', text: "Logical reasoning is just computation. Since AI is the ultimate computer, it will eventually master logic.", strength: 8 },
        { side: 'AGAINST', text: "AI lacks intuition and true 'understanding'. It only predicts the next token based on probability.", strength: 15 },
        { side: 'AGAINST', text: "True logic requires consciousness and the ability to verify axioms against reality, which AI cannot do.", strength: 10 }
    ],
    "Robotics Ethics": [
        { side: 'FOR', text: "If a robot can suffer or make moral choices, it should have rights to protect its autonomy.", strength: 5 },
        { side: 'AGAINST', text: "Robots are tools. Granting them rights would dilute human rights and create legal chaos.", strength: 22 },
        { side: 'AGAINST', text: "Rights are tied to biological life and evolutionary stakes. A machine has no skin in the game.", strength: 18 }
    ],
    "The Future of Privacy": [
        { side: 'FOR', text: "Privacy is dead. We should focus on data transparency rather than trying to hide information.", strength: 7 },
        { side: 'AGAINST', text: "Privacy is a fundamental human right. Without it, freedom of thought and expression are impossible.", strength: 25 },
        { side: 'AGAINST', text: "Surveillance leads to self-censorship and total conformity. We must fight for absolute privacy.", strength: 20 }
    ]
};

async function seed() {
    console.log('Starting seeding...');

    for (const v of SEED_VIDEOS) {
        console.log(`Creating debate: ${v.title}`);

        // 1. Create Post (Thesis)
        const { data: post, error: postError } = await supabase
            .from('posts')
            .upsert({
                id: v.id, // Using same UUID for simplicity in this seed
                user_id: v.author_id,
                content: v.content,
                video_url: v.url,
                is_published: true
            })
            .select()
            .single();

        if (postError) {
            console.error(`Error creating post for ${v.title}:`, postError);
            continue;
        }

        // 2. Create Arguments (Comments)
        const args = ARGUMENTS[v.title];
        for (const arg of args) {
            const prefix = arg.side === 'FOR' ? 'FOR:|' : 'AGAINST:|';
            const { error: argError } = await supabase
                .from('comments')
                .insert({
                    post_id: post.id,
                    user_id: v.author_id, // For simplicity using same author
                    text: prefix + arg.text,
                    likes_count: arg.strength
                });

            if (argError) console.error(`Error adding argument for ${v.title}:`, argError);
        }
    }

    console.log('Seeding complete!');
    process.exit(0);
}

seed();
