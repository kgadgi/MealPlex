import React from 'react';
import { View, Text, Image, StyleSheet, Dimensions } from 'react-native';
import { Dish } from '@/constants/dishes';

const { width } = Dimensions.get('window');

interface DishCardProps {
    dish: Dish;
    showDescription?: boolean;
}

export default function DishCard({ dish, showDescription = true }: DishCardProps) {
    return (
        <View style={styles.card}>
            <Image source={{ uri: dish.image }} style={styles.image} resizeMode="cover" />
            <View style={styles.content}>
                <Text style={styles.name}>{dish.name}</Text>
                <Text style={styles.cuisine}>{dish.cuisine}</Text>
                {showDescription && <Text style={styles.description}>{dish.description}</Text>}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: 'white',
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
        marginBottom: 16,
    },
    image: {
        width: '100%',
        height: 200,
    },
    content: {
        padding: 16,
    },
    name: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    cuisine: {
        fontSize: 14,
        color: '#666',
        marginBottom: 8,
        textTransform: 'uppercase',
    },
    description: {
        fontSize: 16,
        lineHeight: 24,
        color: '#333',
    },
});
