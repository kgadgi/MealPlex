export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';
export type Diet = 'veg' | 'non-veg' | 'egg';

export interface Dish {
  id: string;
  name: string;
  description: string;
  image: string;
  cuisine: string;
  type?: MealType[];
  diet?: Diet;
  ingredients?: string[];
  instructions?: string;
  sourceUrl?: string;
}

export const DISHES: Dish[] = [
  // Existing Indian Items (Updated)
  {
    id: '1',
    name: 'Butter Chicken',
    description: 'Tender chicken in a rich, creamy tomato sauce.',
    image: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&w=800&q=80',
    cuisine: 'North Indian',
    type: ['lunch', 'dinner'],
    diet: 'non-veg',
    ingredients: ['Chicken', 'Butter', 'Tomato Puree', 'Cream', 'Spices'],
    instructions: '1. Marinate chicken. 2. Cook chicken. 3. Prepare tomato gravy with butter and spices. 4. Mix chicken with gravy and simmer.',
  },
  {
    id: '2',
    name: 'Masala Dosa',
    description: 'Crispy rice crepe filled with spiced potato masala.',
    image: 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?auto=format&fit=crop&w=800&q=80',
    cuisine: 'South Indian',
    type: ['breakfast', 'lunch', 'dinner'],
    diet: 'veg',
    ingredients: ['Rice Batter', 'Potato', 'Onion', 'Mustard Seeds'],
    instructions: '1. Ferment rice batter. 2. Prepare potato masala. 3. Spread batter on hot griddle. 4. Add stuffing and roll.',
  },
  {
    id: '3',
    name: 'Palak Paneer',
    description: 'Cottage cheese cubes in a smooth spinach gravy.',
    image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=800&q=80',
    cuisine: 'North Indian',
    type: ['lunch', 'dinner'],
    diet: 'veg',
    ingredients: ['Spinach', 'Paneer', 'Cream', 'Garlic', 'Spices'],
  },
  {
    id: '4',
    name: 'Biryani',
    description: 'Fragrant rice dish with aromatic spices and herbs.',
    image: 'https://images.unsplash.com/photo-1633945274405-b6c8069047b0?auto=format&fit=crop&w=800&q=80',
    cuisine: 'Hyderabadi',
    type: ['lunch', 'dinner'],
    diet: 'non-veg',
    ingredients: ['Basmati Rice', 'Chicken/Mutton', 'Saffron', 'Spices', 'Yoghurt'],
  },
  {
    id: '5',
    name: 'Chole Bhature',
    description: 'Spicy chickpea curry served with fried bread.',
    image: 'https://images.unsplash.com/photo-1626074353765-517a681e40be?auto=format&fit=crop&w=800&q=80',
    cuisine: 'Punjabi',
    type: ['breakfast', 'lunch'],
    diet: 'veg',
    ingredients: ['Chickpeas', 'Flour', 'Spices', 'Oil'],
  },
  {
    id: '6',
    name: 'Vada Pav',
    description: 'Deep fried potato dumpling placed inside a bread bun.',
    image: 'https://images.unsplash.com/photo-1626132647523-66f5bf380027?auto=format&fit=crop&w=800&q=80',
    cuisine: 'Maharashtrian',
    type: ['snack', 'breakfast'],
    diet: 'veg',
    ingredients: ['Potato', 'Gram Flour', 'Bread Bun', 'Garlic Chutney'],
  },
  // New American Breakfast Items
  {
    id: '101',
    name: 'Classic Pancakes',
    description: 'Fluffy pancakes served with butter and maple syrup.',
    image: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?auto=format&fit=crop&w=800&q=80',
    cuisine: 'American',
    type: ['breakfast'],
    diet: 'egg',
    ingredients: ['Flour', 'Milk', 'Eggs', 'Maple Syrup', 'Butter'],
    instructions: '1. Mix dry ingredients. 2. Whisk wet ingredients. 3. Combine. 4. Cook on griddle until bubbly.',
  },
  {
    id: '102',
    name: 'Bacon & Eggs',
    description: 'Crispy bacon rashers with sunny-side up eggs.',
    image: 'https://images.unsplash.com/photo-1606850979803-db7d4778bc0f?auto=format&fit=crop&w=800&q=80',
    cuisine: 'American',
    type: ['breakfast'],
    diet: 'non-veg',
    ingredients: ['Eggs', 'Bacon', 'Bread', 'Butter'],
  },
  {
    id: '103',
    name: 'Avocado Toast',
    description: 'Smashed avocado on toasted sourdough bread.',
    image: 'https://images.unsplash.com/photo-1588137372308-15f75323ca8d?auto=format&fit=crop&w=800&q=80',
    cuisine: 'American',
    type: ['breakfast'],
    diet: 'veg',
    ingredients: ['Avocado', 'Sourdough Bread', 'Chili Flakes', 'Lemon', 'Olive Oil'],
  },
  {
    id: '104',
    name: 'Waffles',
    description: 'Golden Belgian waffles topped with fresh berries.',
    image: 'https://images.unsplash.com/photo-1562376552-0d160a2f238d?auto=format&fit=crop&w=800&q=80',
    cuisine: 'American',
    type: ['breakfast'],
    diet: 'egg',
    ingredients: ['Waffle Mix', 'Strawberries', 'Blueberries', 'Whipped Cream'],
  },
];
