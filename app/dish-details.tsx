import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image, Pressable, Linking } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Dish } from '@/constants/dishes';

export default function DishDetailsScreen() {
    const params = useLocalSearchParams();

    // Parse dish from params
    let dish: Dish | null = null;
    if (params.dish) {
        try {
            dish = JSON.parse(params.dish as string);
        } catch (e) {
            console.error('Failed to parse dish', e);
        }
    }

    if (!dish) {
        return (
            <View style={styles.container}>
                <Text>Dish not found</Text>
            </View>
        );
    }

    return (
        <ScrollView style={styles.container}>
            <Image source={{ uri: dish.image }} style={styles.image} />

            <View style={styles.content}>
                <View style={styles.header}>
                    <Text style={styles.title}>{dish.name}</Text>
                    <View style={styles.badges}>
                        <View style={[styles.badge, styles.cuisineBadge]}>
                            <Text style={styles.badgeText}>{dish.cuisine}</Text>
                        </View>
                        {dish.diet && (
                            <View style={[styles.badge, dish.diet === 'non-veg' ? styles.redBadge : styles.greenBadge]}>
                                <Text style={styles.badgeText}>{dish.diet === 'non-veg' ? 'Non-Veg' : dish.diet === 'veg' ? 'Veg' : 'Egg'}</Text>
                            </View>
                        )}
                    </View>
                </View>

                <Text style={styles.description}>{dish.description}</Text>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Ingredients</Text>
                    {dish.ingredients && dish.ingredients.length > 0 ? (
                        dish.ingredients.map((ing, index) => (
                            <Text key={index} style={styles.text}>• {ing}</Text>
                        ))
                    ) : (
                        <Text style={styles.text}>No ingredients listed.</Text>
                    )}
                </View>

                {dish.instructions ? (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Instructions</Text>
                        <Text style={styles.text}>{dish.instructions}</Text>
                    </View>
                ) : (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Instructions</Text>
                        <Text style={styles.text}>No instructions provided.</Text>
                    </View>
                )}
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    image: {
        width: '100%',
        height: 300,
        resizeMode: 'cover',
    },
    content: {
        padding: 20,
    },
    header: {
        marginBottom: 16,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 8,
        color: '#333',
    },
    badges: {
        flexDirection: 'row',
    },
    badge: {
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
        marginRight: 8,
    },
    cuisineBadge: {
        backgroundColor: '#eee',
    },
    greenBadge: {
        backgroundColor: '#e8f5e9',
    },
    redBadge: {
        backgroundColor: '#ffebee',
    },
    badgeText: {
        fontSize: 12,
        fontWeight: '600',
    },
    description: {
        fontSize: 16,
        color: '#666',
        lineHeight: 24,
        marginBottom: 20,
        fontStyle: 'italic',
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 12,
        color: '#333',
    },
    text: {
        fontSize: 16,
        lineHeight: 24,
        color: '#444',
        marginBottom: 4,
    },
    linkButton: {
        marginTop: 10,
        backgroundColor: '#007aff',
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    linkButtonText: {
        color: 'white',
        fontWeight: '600',
        fontSize: 16,
    },
});
