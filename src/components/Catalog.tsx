'use client';

import { useState } from 'react';
import { PRODUCTS, CATEGORIES } from '@/lib/products';
import type { Category, Product } from '@/lib/products';
import ProductCard from './ProductCard';

interface CatalogProps {
    onTryOn: (product: Product) => void;
    selectedId?: string;
}

export default function Catalog({ onTryOn, selectedId }: CatalogProps) {
    const [activeCategory, setActiveCategory] = useState<Category | 'All'>('All');

    const filtered = activeCategory === 'All'
        ? PRODUCTS
        : PRODUCTS.filter((p) => p.category === activeCategory);

    return (
        <div>
            {/* Filter Tabs */}
            <div style={{ marginBottom: 32 }}>
                <div className="pill-tabs">
                    {(['All', ...CATEGORIES] as const).map((cat) => (
                        <button
                            key={cat}
                            className={`pill-tab ${activeCategory === cat ? 'active' : ''}`}
                            onClick={() => setActiveCategory(cat)}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            {/* Grid */}
            <div className="product-grid">
                {filtered.map((product, i) => (
                    <div
                        key={product.id}
                        className="animate-fade-in-up"
                        style={{ animationDelay: `${i * 0.07}s` }}
                    >
                        <ProductCard
                            product={product}
                            isSelected={selectedId === product.id}
                            onTryOn={onTryOn}
                        />
                    </div>
                ))}
            </div>
        </div>
    );
}
