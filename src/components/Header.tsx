'use client';

import { useState } from 'react';

export default function Header() {
    const [menuOpen, setMenuOpen] = useState(false);

    return (
        <header className="site-header">
            <div
                style={{
                    maxWidth: 1200,
                    margin: '0 auto',
                    padding: '0 24px',
                    height: 52,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                }}
            >
                {/* Logo */}
                <a
                    href="/"
                    style={{
                        textDecoration: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                    }}
                >
                    <span
                        style={{
                            fontSize: 17,
                            fontWeight: 700,
                            letterSpacing: '-0.02em',
                            color: 'var(--text-primary)',
                        }}
                    >
                        SmartStitch
                    </span>
                </a>

                {/* Nav */}
                <nav style={{ display: 'flex', gap: 28 }}>
                    {['Collection', 'Try-On', 'About'].map((item) => (
                        <a
                            key={item}
                            href={item === 'Collection' ? '#catalog' : item === 'Try-On' ? '#tryon-section' : '#'}
                            style={{
                                fontSize: 14,
                                fontWeight: 500,
                                color: 'var(--text-secondary)',
                                textDecoration: 'none',
                                transition: 'color 0.2s',
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-primary)')}
                            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
                        >
                            {item}
                        </a>
                    ))}
                </nav>

                {/* CTA */}
                <a href="#catalog" className="btn-primary" style={{ fontSize: 13, padding: '7px 18px', textDecoration: 'none' }}>
                    Shop Now
                </a>
            </div>
        </header>
    );
}
