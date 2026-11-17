import { supabase } from '../supabase/client';

type Mode = 'chat' | 'insight' | 'analyze' | 'debate' | 'deep_dive' | 'video_chat';
type ClipEvidence = 'video' | 'transcript' | 'metadata';
type OrvelisResult = { content: string; context?: ClipEvidence };

const unavailable = 'Orvelis is temporarily unavailable. Please try again.';
const signInRequired = 'Sign in to use Orvelis.';

export function orvelisErrorMessage(error: unknown) {
    return error instanceof Error ? error.message : unavailable;
}

async function invokeOrvelis(
    mode: Mode, prompt: string, history: DeepDiveMessage[] = [], videoId?: string,
): Promise<OrvelisResult> {
    if (!supabase) throw new Error(unavailable);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error(signInRequired);
    const { data, error } = await supabase.functions.invoke('orvelis-ai', {
        body: {
            mode,
            prompt,
            history: history.slice(-12).map(({ role, content }) => ({ role, content: content.slice(0, 4000) })),
            videoId,
        },
    });
    if (error || typeof data?.content !== 'string' || !data.content.trim()) {
        let code: string | undefined;
        try {
            const details = await error?.context?.json?.();
            code = details?.error;
        } catch {
            // A network or gateway error may have no JSON body.
        }
        if (error?.context?.status === 401 || code === 'SIGN_IN_REQUIRED') throw new Error(signInRequired);
        if (code === 'VIDEO_NOT_FOUND') throw new Error('This video is no longer available.');
        if (code === 'INPUT_TOO_LONG' || prompt.length > 12000) throw new Error('This message is too long. Try a shorter message.');
        throw new Error(unavailable);
    }
    return { content: data.content, context: data.context };
}

function parseResult<T>(content: string): T {
    return JSON.parse(content.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim()) as T;
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

export interface VideoAnalysis {
    essence: string;
    manipulation: string;
    realValue: string;
}

export interface DebateSeed {
    thesis: string;
    arguments: { side: 'FOR' | 'AGAINST'; text: string; strength: number }[];
}

export interface DeepDiveData {
    summary: string;
    keyTerms: { term: string; definition: string }[];
    recommendations: Recommendation[];
}

export interface DeepDiveMessage {
    role: 'user' | 'assistant' | 'system';
    content: string;
}

export async function generateDailyInsight(topic?: string): Promise<DailyInsight> {
    const { content } = await invokeOrvelis('insight', topic?.trim() || 'Give me a useful daily reflection.');
    return parseResult<DailyInsight>(content);
}

export async function generateVideoAnalysis(text?: string, history: DeepDiveMessage[] = []): Promise<VideoAnalysis> {
    const { content } = await invokeOrvelis('analyze', text?.trim() ||
        'Explain what source material is needed to analyze a claim.', history);
    return parseResult<VideoAnalysis>(content);
}

export async function chatWithAI(message: string, history: DeepDiveMessage[]): Promise<string> {
    return (await invokeOrvelis('chat', message, history)).content;
}

export async function generateDebateSeed(contentHint: string): Promise<DebateSeed> {
    const { content } = await invokeOrvelis('debate', contentHint);
    return parseResult<DebateSeed>(content);
}

export async function generateDeepDive(videoId: string): Promise<DeepDiveData & { context?: ClipEvidence }> {
    const { content, context } = await invokeOrvelis('deep_dive', 'Summarize this video.', [], videoId);
    return { ...parseResult<DeepDiveData>(content), context };
}

export async function chatWithVideo(videoId: string, message: string, history: DeepDiveMessage[]): Promise<string> {
    return (await invokeOrvelis('video_chat', message, history, videoId)).content;
}
