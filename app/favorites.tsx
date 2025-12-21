import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Image } from 'react-native';
import { favoritesStore } from '@/store/favoritesStore';
import { Dish } from '@/constants/dishes';

export default function FavoritesScreen() {
    const [favorites, setFavorites] = useState<Dish[]>(favoritesStore.getFavorites());

    useEffect(() => {
        const unsubscribe = favoritesStore.subscribe(() => {
            setFavorites([...favoritesStore.getFavorites()]);
        });
        return unsubscribe;
    }, []);

    return (
        <View style={styles.container}>
            {favorites.length === 0 ? (
                <View style={styles.emptyState}>
                    <Text style={styles.emptyText}>No favorites yet.</Text>
                    <Text style={styles.subText}>Swipe right on dishes to add them here!</Text>
                </View>
            ) : (
                <FlatList
                    data={favorites}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.listContent}
                    renderItem={({ item }) => (
                        <View style={styles.item}>
                            <Image source={{ uri: item.image }} style={styles.itemImage} />
                            <View style={styles.itemInfo}>
                                <Text style={styles.itemName}>{item.name}</Text>
                                <Text style={styles.itemCuisine}>{item.cuisine}</Text>
                            </View>
                        </View>
                    )}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    emptyState: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
    },
    emptyText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
    },
    subText: {
        marginTop: 8,
        color: '#666',
        fontSize: 16,
        textAlign: 'center',
    },
    listContent: {
        padding: 16,
    },
    item: {
        flexDirection: 'row',
        backgroundColor: 'white',
        borderRadius: 12,
        marginBottom: 12,
        overflow: 'hidden',
        height: 80,
        alignItems: 'center',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    itemImage: {
        width: 80,
        height: 80,
    },
    itemInfo: {
        flex: 1,
        paddingHorizontal: 16,
        justifyContent: 'center',
    },
    itemName: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    itemCuisine: {
        fontSize: 14,
        color: '#666',
    },
});
