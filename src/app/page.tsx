'use client';

import Header from '@/components/Header';
import Catalog from '@/components/Catalog';
import TryOnSection from '@/components/TryOnSection';
import { useState } from 'react';
import { Product } from '@/lib/products';

export default function Home() {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showTryOn, setShowTryOn] = useState(false);

  const handleTryOn = (product: Product) => {
    setSelectedProduct(product);
    setShowTryOn(true);
    setTimeout(() => {
      document.getElementById('tryon-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
      <Header />

      {/* Hero */}
      <section
        style={{
          background: 'linear-gradient(160deg, #F5F5F7 0%, #FFFFFF 60%)',
          padding: '80px 24px 60px',
          textAlign: 'center',
        }}
      >
        <div style={{ maxWidth: 680, margin: '0 auto' }} className="animate-fade-in-up">
          <p className="section-eyebrow" style={{ marginBottom: 16 }}>Virtual Try-On Boutique</p>
          <h1
            style={{
              fontSize: 'clamp(2.4rem, 5vw, 4rem)',
              fontWeight: 700,
              lineHeight: 1.1,
              letterSpacing: '-0.03em',
              color: 'var(--text-primary)',
              marginBottom: 20,
            }}
          >
            Wear it before
            <br />
            <span style={{ color: 'var(--accent-blue)' }}>you buy it.</span>
          </h1>
          <p
            style={{
              fontSize: '1.1rem',
              color: 'var(--text-secondary)',
              lineHeight: 1.7,
              maxWidth: 480,
              margin: '0 auto 36px',
            }}
          >
            Browse our curated collection of premium men's shirts. Select any piece and see exactly how it drapes on your body — powered by AI pose detection.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href="#catalog" className="btn-primary" style={{ textDecoration: 'none' }}>
              Shop the Collection
            </a>
            <a href="#tryon-section" className="btn-secondary" style={{ textDecoration: 'none' }}>
              How it Works
            </a>
          </div>
        </div>
      </section>

      {/* Catalog */}
      <section id="catalog" style={{ maxWidth: 1200, margin: '0 auto', padding: '64px 24px' }}>
        <div style={{ marginBottom: 40 }}>
          <p className="section-eyebrow" style={{ marginBottom: 10 }}>Our Collection</p>
          <h2
            style={{
              fontSize: 'clamp(1.6rem, 3vw, 2.4rem)',
              fontWeight: 700,
              letterSpacing: '-0.02em',
              color: 'var(--text-primary)',
            }}
          >
            Find your perfect shirt
          </h2>
        </div>
        <Catalog onTryOn={handleTryOn} selectedId={selectedProduct?.id} />
      </section>

      {/* Try-On Section */}
      <section
        id="tryon-section"
        style={{
          maxWidth: 1200,
          margin: '0 auto',
          padding: '32px 24px 80px',
        }}
      >
        <TryOnSection
          product={selectedProduct}
          showTryOn={showTryOn}
        />
      </section>

      {/* Footer */}
      <footer
        style={{
          borderTop: '1px solid var(--border-color)',
          padding: '32px 24px',
          textAlign: 'center',
          color: 'var(--text-tertiary)',
          fontSize: '13px',
          background: 'var(--bg-secondary)',
        }}
      >
        <p>© 2026 Lumière Men's Boutique. All rights reserved.</p>
        <p style={{ marginTop: 6 }}>Virtual Try-On powered by MediaPipe Pose.</p>
      </footer>
    </div>
  );
}
