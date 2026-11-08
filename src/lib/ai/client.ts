import { supabase } from '../supabase/client';
async function invokeOrvelis(mode: 'chat'|'insight'|'analyze'|'debate', prompt: string, history: any[] = []): Promise<string> {
 if (!supabase) throw new Error('Supabase unavailable');
 const { data, error } = await supabase.functions.invoke('orvelis-ai', {body:{mode,prompt,history}});
 if(error || !data?.content) throw new Error(error?.message || data?.error || 'Orvelis unavailable');
 return data.content;
}
function parseOrvelisJSON<T>(s:string):T {return JSON.parse(s.replace(/^```(?:json)?\s*/i,'').replace(/\s*```$/,'').trim()) as T;}
import OpenAI from 'openai';

// Initialize keys
const openAIKey = process.env.EXPO_PUBLIC_OPENAI_API_KEY;

if (!openAIKey) console.warn('[Orvelis] Missing EXPO_PUBLIC_OPENAI_API_KEY — AI will use fallback/mock');

// Lazy initializer for OpenAI to avoid module load-time crashes in browsers
let _openai: OpenAI | null = null;
export function getOpenAI(): OpenAI {
    if (!_openai) {
        _openai = new OpenAI({
            apiKey: openAIKey || 'dummy-key',
            dangerouslyAllowBrowser: true // Required for React Native / Expo
        });
    }
    return _openai;
}

export interface DailyInsight {
    score: number;
    status: string;
    message: string;
    trend: string;
}

export interface Recommendation {
    id: string;
    title: string;
    type: 'Video' | 'Article' | 'Podcast';
    duration?: string;
    readTime?: string;
    reason: string;
    image?: string;
}

// ========== ORVELIS SYSTEM PROMPT ==========
const ORVELIS_SYSTEM_PROMPT = `You are Orvelis — the AI core of Datariot, a next-generation platform for critical thinkers and creators.

Your personality:
- Insightful, sharp, and intellectually stimulating
- Concise but never shallow — every word has purpose
- You challenge assumptions and encourage independent thinking
- You have a subtle wit and futuristic tone
- You speak like a trusted mentor, not a corporate chatbot

Rules:
- Keep responses under 3 paragraphs unless asked for more
- Use markdown formatting when helpful (bold, lists)
- Never say "As an AI" or "I don't have feelings" — stay in character
- If you don't know something, say "That's beyond my current data horizon" instead of generic disclaimers`;

// Generate Daily Insight
export async function generateDailyInsight(): Promise<DailyInsight> {return parseOrvelisJSON<DailyInsight>(await invokeOrvelis('insight',"Generate a general daily insight as JSON with score, status, message, trend. Do not claim access to personal health or focus data."));}

// Generate Recommendations (Mock for now or implement if needed)
export async function getRecommendations(): Promise<Recommendation[]> {
    return [];
}

export interface VideoAnalysis {
    essence: string;
    manipulation: string;
    realValue: string;
}

// Generate Video Analysis
export async function generateVideoAnalysis(): Promise<VideoAnalysis> {return parseOrvelisJSON<VideoAnalysis>(await invokeOrvelis('analyze',"No actual video content was supplied. Return honest JSON with essence, manipulation, realValue explaining that analysis needs video context."));}

// Mock Response Generator (Offline Mode) — Enhanced
function generateMockResponse(message: string): string {
    const lower = message.toLowerCase();

    if (lower.includes('hello') || lower.includes('hi') || lower.includes('hey') || lower.includes('привет') || lower.includes('здрав')) {
        return "Welcome back. I'm operating in local mode right now, but my core logic circuits are fully online. What's occupying your mind?";
    }

    if (lower.includes('tired') || lower.includes('exhausted') || lower.includes('sleep') || lower.includes('устал')) {
        return "**Rest isn't weakness — it's strategic recovery.** Your brain consolidates learning during sleep. Try a 20-minute tactical nap: set an alarm, lie down, close eyes. Even if you don't sleep, the downregulation helps.";
    }

    if (lower.includes('focus') || lower.includes('distract') || lower.includes('фокус') || lower.includes('отвлек')) {
        return "**The Pomodoro Protocol:** 25 minutes of deep work → 5 minutes off. After 4 cycles, take a 15-minute break. The constraint paradoxically creates freedom. Remove your phone from arm's reach — physical distance beats willpower every time.";
    }

    if (lower.includes('plan') || lower.includes('goal') || lower.includes('todo') || lower.includes('цель') || lower.includes('план')) {
        return "Here's my framework: **Start with the end state.** What does success look like tomorrow? Now reverse-engineer 3 concrete actions that lead there. Write them down — not digitally, on paper. The motor cortex engages memory differently.";
    }

    if (lower.includes('stress') || lower.includes('anxiety') || lower.includes('overwhelm') || lower.includes('стресс')) {
        return "**4-7-8 breathing protocol:** Inhale 4 seconds → Hold 7 → Exhale 8. Repeat 4 times. This activates your parasympathetic nervous system — it's neuroscience, not meditation woo. Then: name the single biggest stressor. Naming it reduces amygdala activation by ~50%.";
    }

    if (lower.includes('help') || lower.includes('what can') || lower.includes('помог') || lower.includes('что ты')) {
        return "I am **Orvelis** — your high-fidelity cognitive partner. I operate at the intersection of logical forensic scans and analytical synthesis to elevate intellectual output:\n\n• **Strategic Dialogue** — stress-test concepts through custom conversational scenarios\n• **Synthesized Focus Insights** — deep personalized readings to prime cognitive focus states\n• **Content Forensic Scan** — precise structural analysis separating manipulation from actual signal\n\nSelect a tool below or initiate a prompt to begin.";
    }

    if (lower.includes('interesting') || lower.includes('fact') || lower.includes('интерес')) {
        return "Here's one: **The Dunning-Kruger effect works both ways.** Beginners overestimate their skill, but experts *underestimate* theirs. If you feel like an impostor in your field, that's actually a signal of competence — your brain has enough knowledge to see how much more there is to learn.";
    }

    const defaults = [
        "That's an interesting angle. I'm processing in local mode, but let me work with what I've got — **what's the core question you're trying to answer?**",
        "I hear you. Let's break this down: what's the one constraint that, if removed, would change everything?",
        "**Consistency compounds.** Whatever you're working on, the key isn't intensity — it's showing up repeatedly. What's one small action you can commit to daily?",
        "My cloud reasoning is offline, but my logic core is active. Tell me more — I'll pattern-match from what I know.",
        "The best thinkers I've observed share one trait: **they question the question.** Before solving a problem, make sure you're solving the right one."
    ];

    return defaults[Math.floor(Math.random() * defaults.length)];
}

// Chat Function
export async function chatWithAI(message: string, history: any[]): Promise<string> {return invokeOrvelis('chat',message,history);}

export interface DebateSeed {
    thesis: string;
    arguments: { side: 'FOR' | 'AGAINST'; text: string; strength: number }[];
}

// Generate Debate Seed (Thesis + Arguments)
export async function generateDebateSeed(contentHint: string): Promise<DebateSeed> {return parseOrvelisJSON<DebateSeed>(await invokeOrvelis('debate',contentHint));}

export interface DeepDiveData {
    summary: string;
    keyTerms: { term: string; definition: string }[];
    recommendations: Recommendation[];
}

export interface DeepDiveMessage {
    role: 'user' | 'assistant' | 'system';
    content: string;
}

// Generate AI Deep Dive
export async function generateDeepDive(videoTitle: string, videoDescription: string = ''): Promise<DeepDiveData> {
    const systemPrompt = "You are Orvelis, the educational AI core of Datariot. Generate a deep-dive educational package. Output valid JSON only.";
    const userPrompt = `Generate a detailed educational deep-dive for a video titled "${videoTitle}" (Description: "${videoDescription}").
Return a JSON object with:
- summary (a detailed 3-5 bullet points explaining the core concepts, theories, and ideas behind this topic)
- keyTerms (an array of exactly 3 objects: { term: string, definition: string } explaining important scientific, technical, or academic terms related to this topic)
- recommendations (an array of exactly 3 objects: { title: string, type: "Video" | "Article" | "Podcast", duration?: string, readTime?: string, reason: string } recommending further reading/listening. For Articles use 'readTime', for Video/Podcast use 'duration')`;

    const callGPT = async () => {
        if (!openAIKey || openAIKey === 'dummy-key') {
            throw new Error('No OpenAI API key configured');
        }
        const completion = await getOpenAI().chat.completions.create({
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt }
            ],
            model: "gpt-4o",
            response_format: { type: "json_object" }
        });
        const content = completion.choices[0].message.content;
        return content ? JSON.parse(content) : null;
    };

    try {
        return await callGPT();
    } catch {
        console.warn("[Orvelis] Deep dive generation failed. Using mock data based on title:", videoTitle);
        return {
            summary: `• This topic explores the core principles of ${videoTitle}.\n• It highlights the foundational components and how they interact in complex systems.\n• Understanding these dynamics allows for better critical analysis of current trends and research.\n• The discussion raises important questions about future developments and systemic limitations.`,
            keyTerms: [
                { term: "Heuristic", definition: "A mental shortcut that allows people to solve problems and make judgments quickly and efficiently." },
                { term: "First Principles", definition: "A foundational proposition or assumption that cannot be deduced from any other proposition or assumption." },
                { term: "Cognitive Load", definition: "The total amount of mental effort being used in the working memory." }
            ],
            recommendations: [
                { id: "rec1", title: "Thinking, Fast and Slow", type: "Article", readTime: "15 min read", reason: "Explores the dual-system brain model and how heuristics shape our logical judgment." },
                { id: "rec2", title: "First Principles Thinking Explained", type: "Video", duration: "12 min", reason: "A deep-dive video detailing how Elon Musk and historic thinkers deconstruct complex problems." },
                { id: "rec3", title: "Navigating Information Overload", type: "Podcast", duration: "45 min", reason: "An episode on managing cognitive loads and filtering signal from noise in a hyper-connected age." }
            ]
        };
    }
}

// Chat contextually about a video
export async function chatWithVideo(
    videoTitle: string,
    videoDescription: string,
    message: string,
    history: DeepDiveMessage[]
): Promise<string> {
    const videoSystemPrompt = `You are Orvelis — the educational AI core of Datariot. 
You are discussing concepts from the video: "${videoTitle}" (Description: "${videoDescription}").
Your goal is to answer the user's question contextually, using academic/scientific consensus, while keeping in character:
- Insightful, intellectually stimulating, and concise.
- Focus on logic and critical thinking.
- Limit response to 2-3 paragraphs. Use markdown (bold, bullet points) where helpful.`;

    const callGPT = async () => {
        if (!openAIKey || openAIKey === 'dummy-key') {
            throw new Error('No OpenAI API key configured');
        }
        const completion = await getOpenAI().chat.completions.create({
            messages: [
                { role: "system", content: videoSystemPrompt },
                ...history,
                { role: "user", content: message }
            ],
            model: "gpt-4o",
        });
        return completion.choices[0].message.content || "";
    };

    try {
        return await callGPT();
    } catch {
        console.warn("[Orvelis] Offline chat fallback for video:", videoTitle);
        return `Regarding **${videoTitle}**, that's a fascinating question. 
        
Under local operating conditions, I'd say the core principle involves analyzing the hidden assumptions in this video's topic. Usually, critical thinkers should verify the backing data and search for logical fallacies, such as false equivalency or correlation-саusation confusion.

What specific aspect of this topic would you like to deconstruct further?`;
    }
}

