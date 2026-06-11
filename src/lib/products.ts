export type Category = 'Casual' | 'Formal' | 'Linen';

export interface Product {
    id: string;
    name: string;
    price: number;
    category: Category;
    color: string;
    description: string;
    imageUrl: string;
    // Clean flat-lay / product garment image sent to the AI model as the "garm_img" input
    overlayUrl: string;
}

export const PRODUCTS: Product[] = [
    {
        id: 'p1',
        name: 'Oxford Classic White',
        price: 4200,
        category: 'Formal',
        color: '#FFFFFF',
        description: 'men formal white oxford shirt with structured collar',
        imageUrl: 'https://images.unsplash.com/photo-1589310243389-96a5483213a8?w=600&q=80',
        overlayUrl: 'https://images.unsplash.com/photo-1589310243389-96a5483213a8?w=600&q=80',
    },
    {
        id: 'p2',
        name: 'Navy Chambray Relaxed',
        price: 3500,
        category: 'Casual',
        color: '#2C3E6B',
        description: 'men casual navy blue chambray shirt relaxed fit',
        imageUrl: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=600&q=80',
        overlayUrl: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=600&q=80',
    },
    {
        id: 'p3',
        name: 'Pure Linen Oatmeal',
        price: 5100,
        category: 'Linen',
        color: '#C8B89A',
        description: 'men premium linen shirt oatmeal beige natural fabric',
        imageUrl: 'https://images.unsplash.com/photo-1621072156002-e2fccdc0b176?w=600&q=80',
        overlayUrl: 'https://images.unsplash.com/photo-1621072156002-e2fccdc0b176?w=600&q=80',
    },
    {
        id: 'p4',
        name: 'Slim Poplin Slate',
        price: 3800,
        category: 'Formal',
        color: '#708090',
        description: 'men slim fit formal poplin shirt grey slate',
        imageUrl: 'https://images.unsplash.com/photo-1598033129183-c4f50c736f10?w=600&q=80',
        overlayUrl: 'https://images.unsplash.com/photo-1598033129183-c4f50c736f10?w=600&q=80',
    },
    {
        id: 'p5',
        name: 'Terracotta Linen Breezy',
        price: 4800,
        category: 'Linen',
        color: '#C17A5A',
        description: 'men terracotta linen shirt relaxed loose cut',
        imageUrl: 'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=600&q=80',
        overlayUrl: 'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=600&q=80',
    },
    {
        id: 'p6',
        name: 'Indigo Denim Casual',
        price: 3200,
        category: 'Casual',
        color: '#3B4C7C',
        description: 'men indigo denim casual shirt light wash button up',
        imageUrl: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=600&q=80',
        overlayUrl: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=600&q=80',
    },
];

export const CATEGORIES: Category[] = ['Casual', 'Formal', 'Linen'];
