'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import type { Product } from '@/lib/products';
import { PRODUCTS } from '@/lib/products';

// ── Types ──────────────────────────────────────────────────────────
interface TryOnSectionProps {
    product: Product | null;
    showTryOn: boolean;
}

type Stage =
    | 'idle'           // nothing selected yet
    | 'no_key'         // API key not configured
    | 'uploading'      // user selecting/dragging a photo
    | 'processing'     // waiting for Replicate
    | 'done'           // result received
    | 'error';         // something went wrong

// ── Utility ────────────────────────────────────────────────────────
function fileToDataUrl(file: File): Promise<string> {
    return new Promise((res, rej) => {
        const r = new FileReader();
        r.onload = (e) => res(e.target!.result as string);
        r.onerror = rej;
        r.readAsDataURL(file);
    });
}

// Poll Replicate until the prediction finishes (max 3 minutes)
async function pollPrediction(predictionId: string): Promise<string> {
    const deadline = Date.now() + 3 * 60 * 1000;
    while (Date.now() < deadline) {
        await new Promise((r) => setTimeout(r, 3000));
        const res = await fetch(`/api/tryon?id=${predictionId}`);
        const data = await res.json();
        if (data.status === 'succeeded' && data.imageUrl) return data.imageUrl;
        if (data.status === 'failed' || data.error) throw new Error(data.error ?? 'Prediction failed');
    }
    throw new Error('Timed out waiting for AI result.');
}

// ── Dot loader ─────────────────────────────────────────────────────
function LoadingDots({ label }: { label: string }) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
            <div style={{ display: 'flex', gap: 8 }}>
                <div className="loader-dot" />
                <div className="loader-dot" />
                <div className="loader-dot" />
            </div>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', fontWeight: 500 }}>{label}</p>
        </div>
    );
}

// ── Progress steps ─────────────────────────────────────────────────
function ProgressSteps({ step }: { step: number }) {
    const steps = ['Select Shirt', 'Upload Photo', 'AI Processing', 'Result'];
    return (
        <div style={{ display: 'flex', gap: 0, marginBottom: 32, overflowX: 'auto' }}>
            {steps.map((s, i) => {
                const active = i === step;
                const done = i < step;
                return (
                    <div key={s} style={{ display: 'flex', alignItems: 'center', flex: i < steps.length - 1 ? '1 1 auto' : 'none' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                            <div
                                style={{
                                    width: 28, height: 28, borderRadius: '50%',
                                    background: done ? 'var(--accent-green)' : active ? 'var(--accent-blue)' : 'var(--bg-tertiary)',
                                    color: done || active ? 'white' : 'var(--text-tertiary)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: 12, fontWeight: 700,
                                    transition: 'background 0.3s ease',
                                }}
                            >
                                {done ? (
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round">
                                        <polyline points="20,6 9,17 4,12" />
                                    </svg>
                                ) : (
                                    i + 1
                                )}
                            </div>
                            <span style={{ fontSize: 11, fontWeight: active ? 600 : 400, color: active ? 'var(--text-primary)' : 'var(--text-tertiary)', whiteSpace: 'nowrap' }}>
                                {s}
                            </span>
                        </div>
                        {i < steps.length - 1 && (
                            <div style={{ flex: 1, height: 2, background: done ? 'var(--accent-green)' : 'var(--bg-tertiary)', margin: '0 8px', marginBottom: 20, transition: 'background 0.3s ease' }} />
                        )}
                    </div>
                );
            })}
        </div>
    );
}

// ── Main Component ─────────────────────────────────────────────────
export default function TryOnSection({ product }: TryOnSectionProps) {
    const [activeProduct, setActiveProduct] = useState<Product | null>(product);
    const [userPhotoDataUrl, setUserPhotoDataUrl] = useState<string | null>(null);
    const [resultImageUrl, setResultImageUrl] = useState<string | null>(null);
    const [stage, setStage] = useState<Stage>('idle');
    const [errorMsg, setErrorMsg] = useState<string>('');
    const [dragOver, setDragOver] = useState(false);
    const [showOriginal, setShowOriginal] = useState(false);
    const [processingLabel, setProcessingLabel] = useState('Starting AI engine…');
    // Original photo aspect ratio (height / width) — used to display result at same proportions
    const [photoAspect, setPhotoAspect] = useState<number>(4 / 3);

    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (product) {
            setActiveProduct(product);
            // reset when user selects a new shirt mid-flow
            if (stage === 'done') setStage('uploading');
        }
    }, [product]);

    const runTryOn = useCallback(async (photoDataUrl: string, shirt: Product) => {
        setStage('processing');
        setResultImageUrl(null);
        setShowOriginal(false);

        // Animated label progression
        const labels = [
            'Starting AI engine…',
            'Detecting pose & body shape…',
            'Fitting shirt to your body…',
            'Applying fabric texture…',
            'Finalising the render…',
        ];
        let li = 0;
        const interval = setInterval(() => {
            li = Math.min(li + 1, labels.length - 1);
            setProcessingLabel(labels[li]);
        }, 8000);

        try {
            setProcessingLabel(labels[0]);

            const res = await fetch('/api/tryon', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    humanImage: photoDataUrl,
                    garmentImage: shirt.overlayUrl,
                    garmentDescription: shirt.description,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                if (data.error?.includes('REPLICATE_API_KEY')) {
                    setStage('no_key');
                    clearInterval(interval);
                    return;
                }
                throw new Error(data.error ?? `Server error ${res.status}`);
            }

            // Prefer: wait returned result directly
            if (data.status === 'succeeded' && data.imageUrl) {
                setResultImageUrl(data.imageUrl);
                setStage('done');
                clearInterval(interval);
                return;
            }

            // Need to poll
            if (data.predictionId) {
                setProcessingLabel('AI is generating your try-on…');
                const url = await pollPrediction(data.predictionId);
                setResultImageUrl(url);
                setStage('done');
                clearInterval(interval);
                return;
            }

            throw new Error('Unexpected API response.');
        } catch (err: any) {
            clearInterval(interval);
            setErrorMsg(err.message ?? 'Unknown error');
            setStage('error');
        }
    }, []);

    const handleFile = useCallback(async (file: File) => {
        if (!file.type.startsWith('image/')) return;
        const dataUrl = await fileToDataUrl(file);
        setUserPhotoDataUrl(dataUrl);
        // Capture original photo aspect ratio
        const img = new Image();
        img.onload = () => setPhotoAspect(img.naturalHeight / img.naturalWidth);
        img.src = dataUrl;
        if (!activeProduct) {
            setStage('uploading');
            return;
        }
        await runTryOn(dataUrl, activeProduct);
    }, [activeProduct, runTryOn]);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault(); setDragOver(false);
        const file = e.dataTransfer.files[0]; if (file) handleFile(file);
    }, [handleFile]);

    const reset = () => {
        setUserPhotoDataUrl(null);
        setResultImageUrl(null);
        setStage('idle');
        setErrorMsg('');
        setShowOriginal(false);
    };

    // Determine step index for progress bar
    const stepIndex = stage === 'idle' ? (activeProduct ? 1 : 0)
        : stage === 'uploading' ? 1
            : stage === 'processing' ? 2
                : stage === 'done' ? 3
                    : stage === 'error' ? 2
                        : 0;

    return (
        <div>
            {/* Section header */}
            <div style={{ marginBottom: 32 }}>
                <p className="section-eyebrow" style={{ marginBottom: 10 }}>AI Virtual Try-On</p>
                <h2 style={{ fontSize: 'clamp(1.6rem,3vw,2.4rem)', fontWeight: 700, letterSpacing: '-0.02em' }}>
                    See it on you
                </h2>
                <p style={{ color: 'var(--text-secondary)', marginTop: 8, maxWidth: 580 }}>
                    Powered by <strong>IDM-VTON</strong> — the same photorealistic AI model used by commercial fashion apps.
                    Upload your photo and watch the shirt physically replace yours.
                </p>
            </div>

            {/* Progress */}
            <ProgressSteps step={stepIndex} />

            {/* Main panel */}
            <div className="tryon-panel" style={{ padding: 0, overflow: 'visible' }}>

                {/* ── No API key ── */}
                {stage === 'no_key' && (
                    <div style={{ padding: 40, textAlign: 'center', maxWidth: 520, margin: '0 auto' }}>
                        <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#FFF5F0', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#E8601C" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                        </div>
                        <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>API Key Required</h3>
                        <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 24 }}>
                            To use the AI try-on, you need a free <strong>Replicate</strong> API key. It's free to sign up and you get credits immediately.
                        </p>
                        <div
                            style={{
                                background: 'var(--bg-secondary)', borderRadius: 12, padding: 20,
                                fontFamily: 'monospace', fontSize: 13, textAlign: 'left',
                                border: '1px solid var(--border-color)', marginBottom: 24, lineHeight: 2,
                            }}
                        >
                            <div><span style={{ color: 'var(--text-tertiary)' }}># 1. Sign up at</span> <a href="https://replicate.com" target="_blank" style={{ color: 'var(--accent-blue)' }}>replicate.com</a> (free)</div>
                            <div><span style={{ color: 'var(--text-tertiary)' }}># 2. Copy your API token from the dashboard</span></div>
                            <div><span style={{ color: 'var(--text-tertiary)' }}># 3. Create this file in your project:</span></div>
                            <div style={{ marginTop: 8, background: 'var(--bg-tertiary)', padding: '10px 14px', borderRadius: 8, userSelect: 'all' }}>
                                <div><strong>.env.local</strong></div>
                                <div>REPLICATE_API_KEY=r8_xxxxxxxxxxxxxxxxxxxx</div>
                            </div>
                            <div style={{ marginTop: 8 }}><span style={{ color: 'var(--text-tertiary)' }}># 4. Restart the dev server</span></div>
                        </div>
                        <a
                            href="https://replicate.com/account/api-tokens"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-primary"
                            style={{ textDecoration: 'none', marginRight: 10 }}
                        >
                            Get Free API Key →
                        </a>
                        <button className="btn-secondary" onClick={reset}>Start over</button>
                    </div>
                )}

                {/* ── Idle / Upload ── */}
                {(stage === 'idle' || stage === 'uploading') && (
                    <div style={{ display: 'grid', gridTemplateColumns: activeProduct ? '1fr 1fr' : '1fr', gap: 0 }}>
                        {/* Upload zone */}
                        <div style={{ padding: '32px' }}>
                            <div
                                className={`upload-zone ${dragOver ? 'drag-over' : ''}`}
                                style={{ padding: '56px 24px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, cursor: 'pointer' }}
                                onDrop={handleDrop}
                                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                                onDragLeave={() => setDragOver(false)}
                                onClick={() => fileInputRef.current?.click()}
                            >
                                {userPhotoDataUrl ? (
                                    // Preview uploaded photo
                                    <div style={{ position: 'relative' }}>
                                        <img src={userPhotoDataUrl} alt="Your photo" style={{ width: 140, height: 180, objectFit: 'cover', borderRadius: 12, boxShadow: 'var(--shadow-md)' }} />
                                        <div style={{ position: 'absolute', top: -8, right: -8, width: 24, height: 24, borderRadius: '50%', background: 'var(--accent-green)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><polyline points="20,6 9,17 4,12" /></svg>
                                        </div>
                                    </div>
                                ) : (
                                    <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--accent-blue)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                                            <circle cx="12" cy="7" r="4" />
                                        </svg>
                                    </div>
                                )}
                                <div>
                                    <p style={{ fontWeight: 600, fontSize: 15, color: 'var(--text-primary)', marginBottom: 6 }}>
                                        {userPhotoDataUrl ? 'Photo ready! Click to change' : 'Upload your full-body photo'}
                                    </p>
                                    {!userPhotoDataUrl && (
                                        <>
                                            <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                                                or <span style={{ color: 'var(--accent-blue)', fontWeight: 600 }}>browse files</span>
                                            </p>
                                            <p style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 8 }}>JPG, PNG · Face camera · Good lighting</p>
                                        </>
                                    )}
                                </div>
                                <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
                            </div>

                            {/* Tip box */}
                            {!userPhotoDataUrl && (
                                <div style={{ marginTop: 16, padding: '12px 16px', borderRadius: 10, background: '#EFF5FF', border: '1px solid #C7DCFF', fontSize: 12.5, color: '#0050A0', lineHeight: 1.6 }}>
                                    📸 <strong>Best results:</strong> Stand facing the camera, arms slightly out from body, in good lighting with a simple background.
                                </div>
                            )}

                            {/* CTA when both photo + shirt selected */}
                            {userPhotoDataUrl && activeProduct && (
                                <button
                                    className="btn-primary"
                                    style={{ width: '100%', marginTop: 16, justifyContent: 'center' }}
                                    onClick={() => runTryOn(userPhotoDataUrl, activeProduct)}
                                >
                                    ✨ Generate Try-On
                                </button>
                            )}

                            {userPhotoDataUrl && !activeProduct && (
                                <div style={{ marginTop: 16, padding: '12px 16px', borderRadius: 10, background: '#FFFBEE', border: '1px solid #FFE58F', fontSize: 13, color: '#614700' }}>
                                    ⬆️ Now pick a shirt from the catalog above!
                                </div>
                            )}
                        </div>

                        {/* Selected shirt preview */}
                        {activeProduct && (
                            <div style={{ padding: 32, borderLeft: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: 16 }}>
                                <p style={{ fontSize: 13, color: 'var(--text-tertiary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>Selected Shirt</p>
                                <div style={{ borderRadius: 14, overflow: 'hidden', aspectRatio: '3/4', background: 'var(--bg-secondary)' }}>
                                    <img src={activeProduct.imageUrl} alt={activeProduct.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                </div>
                                <div>
                                    <p style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{activeProduct.name}</p>
                                    <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>{activeProduct.description}</p>
                                    <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginTop: 8 }}>₹{activeProduct.price.toLocaleString('en-IN')}</p>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* ── Processing ── */}
                {stage === 'processing' && (
                    <div style={{ padding: '64px 32px', textAlign: 'center' }}>
                        <LoadingDots label={processingLabel} />
                        <p style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 20, maxWidth: 360, margin: '20px auto 0' }}>
                            IDM-VTON is a diffusion model — it physically drapes the fabric onto your body shape. This typically takes 20–60 seconds.
                        </p>
                        {/* Progress bar */}
                        <div style={{ width: '100%', maxWidth: 300, height: 3, background: 'var(--bg-tertiary)', borderRadius: 2, margin: '24px auto 0', overflow: 'hidden' }}>
                            <div
                                style={{
                                    height: '100%', background: 'var(--accent-blue)', borderRadius: 2,
                                    animation: 'shimmer 2s ease-in-out infinite',
                                    backgroundImage: 'linear-gradient(90deg, var(--accent-blue) 0%, #5BB5F8 50%, var(--accent-blue) 100%)',
                                    backgroundSize: '200% 100%',
                                }}
                            />
                        </div>
                    </div>
                )}

                {/* ── Result ── */}
                {stage === 'done' && resultImageUrl && (
                    <div>
                        {/* Toolbar */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: '1px solid var(--border-color)', flexWrap: 'wrap', gap: 12 }}>
                            <span style={{ fontSize: 14, color: 'var(--accent-green)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20,6 9,17 4,12" /></svg>
                                AI try-on complete!
                            </span>
                            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                                {/* Before / After toggle */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500, minWidth: 52 }}>{showOriginal ? 'Original' : 'Try-On'}</span>
                                    <div className={`toggle-track ${!showOriginal ? 'active' : ''}`} onClick={() => setShowOriginal(v => !v)}>
                                        <div className="toggle-thumb" />
                                    </div>
                                </div>
                                <a
                                    href={resultImageUrl}
                                    download="lumiere-tryon.jpg"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="btn-secondary"
                                    style={{ fontSize: 12.5, padding: '7px 14px', textDecoration: 'none' }}
                                >
                                    ↓ Save photo
                                </a>
                                <button className="btn-secondary" style={{ fontSize: 12.5, padding: '7px 14px' }} onClick={reset}>
                                    Try another
                                </button>
                            </div>
                        </div>

                        {/* Side-by-side images */}
                        <div style={{ padding: 24, display: 'grid', gridTemplateColumns: showOriginal ? '1fr' : '1fr 1fr', gap: 16, transition: 'grid-template-columns 0.3s ease' }}>
                            {showOriginal ? (
                                <div style={{ borderRadius: 14, overflow: 'hidden', background: 'var(--bg-secondary)', aspectRatio: `1 / ${photoAspect}`, maxHeight: 620 }}>
                                    <img src={userPhotoDataUrl!} alt="Original" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                                </div>
                            ) : (
                                <>
                                    {/* Original – display at measured aspect ratio */}
                                    <div style={{ position: 'relative', borderRadius: 14, overflow: 'hidden', background: 'var(--bg-secondary)', aspectRatio: `1 / ${photoAspect}`, maxHeight: 620 }}>
                                        <img src={userPhotoDataUrl!} alt="Original" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                                        <div style={{ position: 'absolute', bottom: 12, left: 12 }}>
                                            <div className="glass-badge">Before</div>
                                        </div>
                                    </div>
                                    {/* AI result – same aspect ratio as original so proportions match */}
                                    <div style={{ position: 'relative', borderRadius: 14, overflow: 'hidden', background: 'var(--bg-secondary)', aspectRatio: `1 / ${photoAspect}`, maxHeight: 620 }}>
                                        <img src={resultImageUrl} alt="AI Try-On Result" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top', display: 'block' }} />
                                        <div style={{ position: 'absolute', bottom: 12, left: 12 }}>
                                            <div className="glass-badge" style={{ background: 'rgba(0,113,227,0.88)', color: 'white', borderColor: 'rgba(0,113,227,0.4)' }}>
                                                AI Try-On
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Quick switch strip */}
                        <div style={{ padding: '0 24px 24px' }}>
                            <p style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 10, fontWeight: 500 }}>Try another shirt instantly</p>
                            <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 4 }}>
                                {PRODUCTS.map((p) => (
                                    <button key={p.id}
                                        onClick={() => { setActiveProduct(p); if (userPhotoDataUrl) runTryOn(userPhotoDataUrl, p); }}
                                        style={{
                                            flexShrink: 0, width: 64, height: 80, borderRadius: 10, overflow: 'hidden',
                                            border: activeProduct?.id === p.id ? '2.5px solid var(--accent-blue)' : '2px solid var(--border-color)',
                                            cursor: 'pointer', padding: 0, background: 'none',
                                            transition: 'border-color 0.2s, transform 0.15s',
                                            transform: activeProduct?.id === p.id ? 'scale(1.07)' : 'scale(1)',
                                        }} title={p.name}>
                                        <img src={p.imageUrl} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* ── Error ── */}
                {stage === 'error' && (
                    <div style={{ padding: 40, textAlign: 'center' }}>
                        <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#FFF0F0', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#CF0000" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                        </div>
                        <h3 style={{ fontWeight: 700, marginBottom: 8 }}>Something went wrong</h3>
                        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 24, maxWidth: 360, margin: '0 auto 24px', lineHeight: 1.6 }}>{errorMsg}</p>
                        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                            <button className="btn-primary" onClick={() => { if (userPhotoDataUrl && activeProduct) runTryOn(userPhotoDataUrl, activeProduct); }}>Retry</button>
                            <button className="btn-secondary" onClick={reset}>Start over</button>
                        </div>
                    </div>
                )}
            </div>

            {/* How it works */}
            {stage === 'idle' && (
                <div style={{ marginTop: 40, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
                    {[
                        { icon: '👔', title: 'Pick a shirt', desc: 'Browse our catalog and click "Try It On" on any shirt.' },
                        { icon: '📸', title: 'Upload photo', desc: 'Upload a full-body photo facing the camera.' },
                        { icon: '🤖', title: 'AI generates', desc: 'IDM-VTON model physially drapes the shirt onto your body.' },
                        { icon: '✨', title: 'See the result', desc: 'Compare before/after and download your try-on photo.' },
                    ].map((item) => (
                        <div key={item.title} style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 14, padding: '20px 18px', boxShadow: 'var(--shadow-sm)' }}>
                            <div style={{ fontSize: 24, marginBottom: 10 }}>{item.icon}</div>
                            <p style={{ fontWeight: 600, fontSize: 14, marginBottom: 6 }}>{item.title}</p>
                            <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{item.desc}</p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
