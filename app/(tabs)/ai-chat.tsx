import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, Pressable, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/components/useColorScheme';
import { Radius, Shadows, Spacing } from '@/constants/Colors';
import { aiService } from '@/services/ai';
import { Send, User, Sparkles, AlertCircle } from 'lucide-react-native';
import Animated, { FadeIn, SlideInRight, SlideInLeft } from 'react-native-reanimated';
import { useResponsive } from '@/hooks/useResponsive';

interface Message {
    id: string;
    text: string;
    sender: 'user' | 'ai';
    timestamp: Date;
}

export default function AIChatScreen() {
    const theme = useTheme();
    const { isTablet, contentMaxWidth } = useResponsive();
    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            text: "Hi! I'm MealMind, your personal chef assistant. Tell me what's on your mind or ask for a meal suggestion!",
            sender: 'ai',
            timestamp: new Date()
        }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const scrollViewRef = useRef<ScrollView>(null);

    const handleSend = async () => {
        if (!input.trim() || loading) return;

        const userMsg: Message = {
            id: Date.now().toString(),
            text: input.trim(),
            sender: 'user',
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setLoading(true);

        try {
            const aiResponse = await aiService.generatePlanningResponse(userMsg.text);
            const aiMsg: Message = {
                id: (Date.now() + 1).toString(),
                text: aiResponse,
                sender: 'ai',
                timestamp: new Date()
            };
            setMessages(prev => [...prev, aiMsg]);
        } catch (error) {
            const errorMsg: Message = {
                id: (Date.now() + 1).toString(),
                text: "Sorry, I ran into an error. Make sure your API key is correctly configured.",
                sender: 'ai',
                timestamp: new Date()
            };
            setMessages(prev => [...prev, errorMsg]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
    }, [messages, loading]);

    const styles = createStyles(theme);

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
            <View style={styles.centerWrapper}>
                <View style={[styles.content, isTablet && { maxWidth: contentMaxWidth, width: '100%' }]}>
                    {/* Header */}
                    <View style={[styles.header, { backgroundColor: theme.surface }, Shadows.sm]}>
                        <View style={[styles.botIcon, { backgroundColor: theme.primaryLight + '20' }]}>
                            <Sparkles size={20} color={theme.primary} />
                        </View>
                        <View>
                            <Text style={[styles.title, { color: theme.text }]}>MealMind AI</Text>
                            <Text style={[styles.status, { color: theme.success }]}>Online and ready to help</Text>
                        </View>
                    </View>

                    {/* Chat Area */}
                    <ScrollView
                        ref={scrollViewRef}
                        style={styles.chatArea}
                        contentContainerStyle={styles.chatContent}
                        showsVerticalScrollIndicator={false}
                    >
                        {messages.map((msg, index) => (
                            <Animated.View
                                key={msg.id}
                                entering={msg.sender === 'user' ? SlideInRight : SlideInLeft}
                                style={[
                                    styles.messageRow,
                                    msg.sender === 'user' ? styles.userRow : styles.aiRow
                                ]}
                            >
                                {msg.sender === 'ai' && (
                                    <View style={[styles.avatar, { backgroundColor: theme.primaryLight + '30' }]}>
                                        <Sparkles size={14} color={theme.primary} />
                                    </View>
                                )}
                                <View style={[
                                    styles.messageBubble,
                                    msg.sender === 'user'
                                        ? { backgroundColor: theme.primary }
                                        : { backgroundColor: theme.surface }
                                ]}>
                                    <Text style={[
                                        styles.messageText,
                                        { color: msg.sender === 'user' ? theme.onPrimary : theme.text }
                                    ]}>
                                        {msg.text}
                                    </Text>
                                </View>
                            </Animated.View>
                        ))}
                        {loading && (
                            <View style={styles.loadingRow}>
                                <ActivityIndicator size="small" color={theme.primary} />
                                <Text style={[styles.loadingText, { color: theme.textSecondary }]}>MealMind is thinking...</Text>
                            </View>
                        )}
                    </ScrollView>

                    {/* Input Area */}
                    <KeyboardAvoidingView
                        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                        keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
                    >
                        <View style={[styles.inputWrapper, { backgroundColor: theme.surface, borderTopColor: theme.border }]}>
                            <View style={[styles.inputBar, { backgroundColor: theme.background }]}>
                                <TextInput
                                    style={[styles.input, { color: theme.text }]}
                                    placeholder="Type your message..."
                                    placeholderTextColor={theme.textMuted}
                                    value={input}
                                    onChangeText={setInput}
                                    multiline
                                    maxLength={500}
                                />
                                <Pressable
                                    onPress={handleSend}
                                    disabled={!input.trim() || loading}
                                    style={[
                                        styles.sendButton,
                                        { backgroundColor: theme.primary },
                                        (!input.trim() || loading) && { opacity: 0.5 }
                                    ]}
                                >
                                    <Send size={20} color={theme.onPrimary} />
                                </Pressable>
                            </View>
                        </View>
                    </KeyboardAvoidingView>
                </View>
            </View>
        </SafeAreaView>
    );
}

const createStyles = (theme: any) => StyleSheet.create({
    container: {
        flex: 1,
    },
    centerWrapper: {
        flex: 1,
        width: '100%',
        alignItems: 'center',
    },
    content: {
        flex: 1,
        width: '100%',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: Spacing.md,
        marginHorizontal: Spacing.md,
        marginTop: Spacing.sm,
        borderRadius: Radius.lg,
        gap: Spacing.md,
    },
    botIcon: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
    },
    title: {
        fontSize: 18,
        fontWeight: '700',
    },
    status: {
        fontSize: 12,
        fontWeight: '500',
    },
    chatArea: {
        flex: 1,
    },
    chatContent: {
        padding: Spacing.md,
        paddingBottom: Spacing.xxl,
    },
    messageRow: {
        flexDirection: 'row',
        marginBottom: Spacing.md,
        maxWidth: '85%',
    },
    userRow: {
        alignSelf: 'flex-end',
        justifyContent: 'flex-end',
    },
    aiRow: {
        alignSelf: 'flex-start',
    },
    avatar: {
        width: 28,
        height: 28,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: Spacing.sm,
        marginTop: 4,
    },
    messageBubble: {
        padding: Spacing.md,
        borderRadius: Radius.lg,
        ...Shadows.sm,
    },
    messageText: {
        fontSize: 15,
        lineHeight: 22,
    },
    loadingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: Spacing.md,
        gap: Spacing.sm,
    },
    loadingText: {
        fontSize: 14,
        fontStyle: 'italic',
    },
    inputWrapper: {
        padding: Spacing.md,
        paddingBottom: Platform.OS === 'ios' ? Spacing.xl : Spacing.md,
        borderTopWidth: 1,
    },
    inputBar: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: Radius.full,
        paddingHorizontal: Spacing.md,
        paddingVertical: 4,
    },
    input: {
        flex: 1,
        fontSize: 16,
        maxHeight: 100,
        paddingVertical: Spacing.sm,
    },
    sendButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: Spacing.sm,
    },
});
