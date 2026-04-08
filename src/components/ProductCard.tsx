'use client';

import type { Product } from '@/lib/products';

interface ProductCardProps {
    product: Product;
    isSelected: boolean;
    onTryOn: (product: Product) => void;
}

const BADGE_CLASS: Record<string, string> = {
    Casual: 'badge badge-casual',
    Formal: 'badge badge-formal',
    Linen: 'badge badge-linen',
};

export default function ProductCard({ product, isSelected, onTryOn }: ProductCardProps) {
    return (
        <div className={`product-card ${isSelected ? 'selected' : ''}`}>
            {/* Image */}
            <div className="product-image-wrap">
                <img
                    src={product.imageUrl}
                    alt={product.name}
                    loading="lazy"
                />
                <span className={BADGE_CLASS[product.category]}>{product.category}</span>

                {/* Color swatch */}
                <div
                    style={{
                        position: 'absolute',
                        bottom: 12,
                        right: 12,
                        width: 18,
                        height: 18,
                        borderRadius: '50%',
                        background: product.color,
                        border: '2px solid white',
                        boxShadow: '0 1px 4px rgba(0,0,0,0.25)',
                    }}
                />
            </div>

            {/* Info */}
            <div style={{ padding: '16px 18px 18px' }}>
                <div style={{ marginBottom: 12 }}>
                    <h3
                        style={{
                            fontSize: 15,
                            fontWeight: 600,
                            color: 'var(--text-primary)',
                            lineHeight: 1.3,
                            marginBottom: 4,
                            letterSpacing: '-0.01em',
                        }}
                    >
                        {product.name}
                    </h3>
                    <p
                        style={{
                            fontSize: 12.5,
                            color: 'var(--text-secondary)',
                            lineHeight: 1.5,
                        }}
                    >
                        {product.description}
                    </p>
                </div>

                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                    }}
                >
                    <span
                        style={{
                            fontSize: 15,
                            fontWeight: 700,
                            color: 'var(--text-primary)',
                            letterSpacing: '-0.01em',
                        }}
                    >
                        ₹{product.price.toLocaleString('en-IN')}
                    </span>
                    <button
                        className="btn-primary"
                        style={{ fontSize: 12.5, padding: '7px 14px' }}
                        onClick={() => onTryOn(product)}
                    >
                        Try It On
                    </button>
                </div>
            </div>
        </div>
    );
}
