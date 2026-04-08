import { NextRequest, NextResponse } from 'next/server';
import { Client } from '@gradio/client';

export const maxDuration = 120;

/**
 * Token pool — reads HF_TOKEN_1, HF_TOKEN_2, ... HF_TOKEN_N from env.
 * Falls back to HF_TOKEN if the numbered ones aren't set.
 * On ZeroGPU quota error, silently retries with the next token.
 */
function getTokenPool(): string[] {
    const pool: string[] = [];

    // Collect HF_TOKEN_1, HF_TOKEN_2, ... up to 10
    for (let i = 1; i <= 10; i++) {
        const t = process.env[`HF_TOKEN_${i}`];
        if (t) pool.push(t);
    }

    // Fallback: single HF_TOKEN
    if (pool.length === 0 && process.env.HF_TOKEN) {
        pool.push(process.env.HF_TOKEN);
    }

    return pool;
}

async function tryWithToken(
    token: string | null,
    humanBlob: Blob,
    garmentBlob: Blob,
    garmentDescription: string,
): Promise<string> {
    const client = await Client.connect(
        'yisol/IDM-VTON',
        token ? { token: token as `hf_${string}` } : {},
    );

    const result = await client.predict('/tryon', {
        dict: { background: humanBlob, layers: [], composite: null },
        garm_img: garmentBlob,
        garment_des: garmentDescription || 'men shirt',
        is_checked: true,
        is_checked_crop: false,
        denoise_steps: 30,
        seed: 42,
    });

    const output = (result.data as any[])[0];

    if (typeof output === 'string') return output;
    if (output?.url) return output.url;
    if (output?.path) return output.path;
    throw new Error('Unexpected output format from IDM-VTON.');
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { humanImage, garmentImage, garmentDescription } = body as {
            humanImage: string;
            garmentImage: string;
            garmentDescription: string;
        };

        if (!humanImage || !garmentImage) {
            return NextResponse.json({ error: 'humanImage and garmentImage are required.' }, { status: 400 });
        }

        // Convert human photo base64 → Blob
        const base64Data = humanImage.split(',')[1];
        const mimeType = humanImage.match(/data:([^;]+);/)?.[1] ?? 'image/jpeg';
        const humanBlob = new Blob([Buffer.from(base64Data, 'base64')], { type: mimeType });

        // Fetch garment image → Blob
        const garmentRes = await fetch(garmentImage);
        if (!garmentRes.ok) throw new Error('Failed to fetch garment image.');
        const garmentBlob = await garmentRes.blob();

        // Try each token in the pool, silently falling back on quota errors
        const pool = getTokenPool();

        // If no tokens at all, try anonymously
        const attempts = pool.length > 0 ? pool : [null];

        let lastError: Error | null = null;
        for (const token of attempts) {
            try {
                const imageUrl = await tryWithToken(token, humanBlob, garmentBlob, garmentDescription);
                return NextResponse.json({ status: 'succeeded', imageUrl });
            } catch (err: any) {
                const msg: string = err?.message ?? String(err);
                // Only continue rotating on quota/ZeroGPU errors
                if (msg.includes('ZeroGPU') || msg.includes('quota') || msg.includes('rate') || msg.includes('throttle')) {
                    console.warn(`Token quota hit, trying next token...`);
                    lastError = err;
                    continue;
                }
                // For other errors, throw immediately
                throw err;
            }
        }

        // All tokens exhausted
        throw lastError ?? new Error('All API tokens have hit their quota. Please try again later.');

    } catch (err: any) {
        console.error('IDM-VTON error:', err?.message ?? err);
        return NextResponse.json(
            { error: err?.message ?? 'Failed to run virtual try-on.' },
            { status: 500 },
        );
    }
}

export async function GET() {
    return NextResponse.json({ error: 'Use POST.' }, { status: 400 });
}
