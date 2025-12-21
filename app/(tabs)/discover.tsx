import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Dimensions, Text, Pressable, TextInput, ActivityIndicator } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DISHES, Dish } from '@/constants/dishes';
import DishCard from '@/components/DishCard';
import { favoritesStore } from '@/store/favoritesStore';
import { preferencesStore } from '@/store/preferencesStore';
import { apiService } from '@/services/api';
import { Link, router } from 'expo-router';
import { Filter, Search } from 'lucide-react-native';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.3;

export default function DiscoverScreen() {
  const [filters, setFilters] = useState(preferencesStore.getFilters());
  const [queue, setQueue] = useState<Dish[]>([]);
  const [rawDishes, setRawDishes] = useState<Dish[]>([]); // Preserves full list for re-filtering
  const [topDish, setTopDish] = useState<Dish | null>(null);
  const [nextDish, setNextDish] = useState<Dish | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);

  const translateX = useSharedValue(0);
  const rotate = useSharedValue(0);

  // Filter Logic
  const getFilteredDishes = (dishList: Dish[]) => {
    const activeFilters = preferencesStore.getFilters();
    const favs = favoritesStore.getFavorites();

    return dishList.filter(d => {
      // 1. Check Diet Filter
      const passesDiet = !d.diet || activeFilters.includes(d.diet);
      // 2. Check if already in favorites (by ID or Name)
      const isFavorited = favs.some(fav => fav.id === d.id || fav.name === d.name);
      // 3. Check if passed (local blacklist) - handled by removing from rawDishes usually, but good to check.

      return passesDiet && !isFavorited;
    });
  };

  // Initial Load & Subscription
  useEffect(() => {
    // Start with mock data
    const initialDishes = DISHES;
    setRawDishes(initialDishes);
    setQueue(getFilteredDishes(initialDishes));

    const unsubscribe = preferencesStore.subscribe(() => {
      setFilters([...preferencesStore.getFilters()]);
      // Re-filter from RAW dishes to restore previously hidden items
      // We need to access the LATEST rawDishes, but in useEffect closure it might be stale?
      // Use setQueue generic updater or ref, or just assume rawDishes state updates trigger re-render anyway.
      // Wait, inside subscription callback, we might not have latest state closure if we don't use a ref or depend on it.
      // Actually `setQueue` doesn't help if we need `rawDishes`.
      // Better approach: Make a separate `useEffect` for when `filters` or `rawDishes` changes.
    });
    return unsubscribe;
  }, []);

  // Re-run filter whenever filters or rawDishes change
  useEffect(() => {
    setQueue(getFilteredDishes(rawDishes));
  }, [filters, rawDishes]);

  // Update topDish and nextDish whenever the queue changes
  useEffect(() => {
    if (queue.length > 0) {
      setTopDish(queue[0]);
      setNextDish(queue[1] || null);
    } else {
      setTopDish(null);
      setNextDish(null);
    }
  }, [queue]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setLoading(true);
    const results = await apiService.searchMeals(searchQuery);
    setLoading(false);

    setRawDishes(results); // Update raw source
    // The useEffect [filters, rawDishes] will handle updating the queue

    if (results.length === 0) {
      alert('No meals found matching your query.');
    } else {
      // Check if current filters hide everything?
      const visible = getFilteredDishes(results);
      if (visible.length === 0) {
        alert('Meals found, but they are hidden by your current filters.');
      }
    }
  };

  const handleSurprise = async () => {
    setLoading(true);
    const meal = await apiService.getRandomMeal();
    setLoading(false);
    if (meal) {
      setRawDishes(prev => [meal, ...prev]);
    }
  };

  const handleSwipeComplete = (direction: 'left' | 'right') => {
    const currentDish = queue[0];
    if (!currentDish) return;

    // Remove from RAW list too so it doesn't reappear
    setRawDishes(prev => prev.filter(d => d.id !== currentDish.id));

    if (direction === 'right') {
      // Add to favorites
      favoritesStore.addDish(currentDish);
      console.log('Saved:', currentDish.name);
    } else {
      // Recycle to bottom
      console.log('Passed:', currentDish.name);
      // The dish is already removed from rawDishes, so it won't be re-added to the queue
      // unless we explicitly add it back to rawDishes at the end.
      // For "recycle to bottom", we need to add it back to rawDishes at the end.
      setRawDishes(prev => [...prev, currentDish]);
    }

    // Reset position instantly
    translateX.value = 0;
    rotate.value = 0;
  };

  const handleTap = () => {
    if (topDish) {
      router.push({
        pathname: '/dish-details',
        params: { dish: JSON.stringify(topDish) }
      });
    }
  };

  const tapGesture = Gesture.Tap().onEnd(() => {
    runOnJS(handleTap)();
  });

  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      translateX.value = event.translationX;
      rotate.value = interpolate(
        event.translationX,
        [-SCREEN_WIDTH, SCREEN_WIDTH],
        [-15, 15] // Rotate ±15 degrees
      );
    })
    .onEnd(() => {
      if (Math.abs(translateX.value) > SWIPE_THRESHOLD) {
        const direction = translateX.value > 0 ? 'right' : 'left';
        // Fly off screen
        translateX.value = withTiming(
          direction === 'right' ? SCREEN_WIDTH * 1.5 : -SCREEN_WIDTH * 1.5,
          {},
          () => {
            runOnJS(handleSwipeComplete)(direction);
          }
        );
      } else {
        // Spring back
        translateX.value = withSpring(0);
        rotate.value = withSpring(0);
      }
    });

  // Render taps and pans
  const composedGesture = Gesture.Race(tapGesture, panGesture);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { rotate: `${rotate.value}deg` },
    ],
  }));

  // Filter Toggle Helper
  const toggleFilter = (diet: any) => {
    preferencesStore.toggleFilter(diet);
  };

  // UI Construction
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Discover</Text>
        <Link href="/favorites" asChild>
          <Pressable style={styles.favButton}>
            <Text style={styles.favText}>Favorites</Text>
          </Pressable>
        </Link>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search cuisine (e.g. Pasta)..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={handleSearch}
        />
        <Pressable onPress={handleSearch} style={styles.searchButton}>
          <Search size={20} color="#666" />
        </Pressable>
      </View>

      {/* Filter Chips */}
      <View style={styles.filterContainer}>
        {['veg', 'non-veg', 'egg'].map((type) => (
          <Pressable
            key={type}
            onPress={() => toggleFilter(type)}
            style={[
              styles.filterChip,
              filters.includes(type as any) && styles.filterChipActive
            ]}
          >
            <Text style={[
              styles.filterText,
              filters.includes(type as any) && styles.filterTextActive
            ]}>
              {type === 'non-veg' ? 'Non-Veg' : type === 'veg' ? 'Veg' : 'Egg'}
            </Text>
          </Pressable>
        ))}
        <Pressable onPress={handleSurprise} style={[styles.filterChip, { backgroundColor: '#ffe0b2' }]}>
          <Text style={styles.filterText}>Surprise Me!</Text>
        </Pressable>
      </View>

      {loading ? (
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color="#007aff" />
        </View>
      ) : (
        <View style={styles.cardContainer}>
          {/* ... Cards ... */}
          {topDish ? (
            <>
              {nextDish && (
                <View style={[styles.cardWrapper, styles.nextCard]}>
                  <DishCard dish={nextDish} />
                  <View style={styles.overlay} />
                </View>
              )}
              <GestureDetector gesture={composedGesture}>
                <Animated.View style={[styles.cardWrapper, animatedStyle]}>
                  <DishCard dish={topDish} />

                  {/* Overlay labels could go here for Like/Nope */}
                </Animated.View>
              </GestureDetector>
            </>
          ) : (
            <View style={styles.emptyState}>
              <Text style={{ fontSize: 18, color: '#666' }}>No more dishes found.</Text>
              <Pressable onPress={handleSurprise} style={{ marginTop: 20 }}>
                <Text style={{ color: '#007aff', fontSize: 16 }}>Load Random Dish</Text>
              </Pressable>
            </View>
          )}
        </View>
      )}

      {topDish && (
        <View style={styles.instructions}>
          <Text style={styles.instructionText}>Swipe Left to Pass • Swipe Right to Save</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  favButton: {
    padding: 8,
  },
  favText: {
    color: '#007aff',
    fontSize: 16,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#e0e0e0',
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: '#007aff',
  },
  filterText: {
    fontSize: 14,
    color: '#333',
  },
  filterTextActive: {
    color: 'white',
    fontWeight: '600',
  },
  cardContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  cardWrapper: {
    position: 'absolute',
    width: SCREEN_WIDTH * 0.9,
    height: 400, // Fixed height for card area
    zIndex: 1,
  },
  nextCard: {
    zIndex: 0,
    transform: [{ scale: 0.95 }, { translateY: 10 }],
    opacity: 0.8,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'white',
    borderRadius: 16,
  },
  instructions: {
    padding: 20,
    alignItems: 'center',
  },
  instructionText: {
    color: '#888',
    fontSize: 14,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 10,
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    height: 40,
    backgroundColor: 'white',
    borderRadius: 20,
    paddingHorizontal: 16,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  searchButton: {
    padding: 8,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
