import { GoogleGenerativeAI } from "@google/generative-ai";
import { plannerStore } from "@/store/plannerStore";
import { shoppingStore } from "@/store/shoppingStore";
import { DISHES, MealType } from "@/constants/dishes";

// Automatically initialize with the key from our .env file
const GEMINI_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
let genAI: GoogleGenerativeAI | null = GEMINI_KEY ? new GoogleGenerativeAI(GEMINI_KEY) : null;

export const aiService = {
    setApiKey: (key: string) => {
        genAI = new GoogleGenerativeAI(key);
    },

    isConfigured: () => !!genAI,

    generatePlanningResponse: async (userMessage: string, chatHistory: any[] = []) => {
        if (!genAI) throw new Error("Gemini API Key not set. Please add your key in Settings.");

        const model = genAI.getGenerativeModel({
            model: "gemini-1.5-flash",
            systemInstruction: `You are "MealMind", a smart meal planning assistant for the Meal Plex app.
            
            CORE KNOWLEDGE:
            - Available Dishes: ${DISHES.map(d => d.name).join(", ")}.
            - Current Plan: ${JSON.stringify(plannerStore.getPlan())}.
            
            YOUR GOALS:
            1. Help users discover new recipes.
            2. Add meals to their plan.
            3. Add ingredients to their shopping list.
            
            RESPONSE FORMAT:
            Always respond in a helpful, conversational tone. 
            If you perform an action (like adding a meal), tell the user.
            
            JSON ACTIONS:
            At the end of your response, if you need to perform an app action, include a JSON block starting with [ACTION] and ending with [/ACTION].
            Supported actions:
            - {"type": "ADD_MEAL", "dishName": "...", "date": "YYYY-MM-DD", "mealType": "breakfast/lunch/dinner/snack"}
            - {"type": "ADD_SHOPPING", "item": "..."}
            
            Example: "I've added Palak Paneer to your dinner for Tuesday! [ACTION]{"type": "ADD_MEAL", "dishName": "Palak Paneer", "date": "2025-12-23", "mealType": "dinner"}[/ACTION]"
            `
        });

        const chat = model.startChat({
            history: chatHistory,
        });

        const result = await chat.sendMessage(userMessage);
        const response = await result.response;
        const text = response.text();

        // Process actions
        const actionMatch = text.match(/\[ACTION\](.*?)\[\/ACTION\]/);
        if (actionMatch) {
            try {
                const action = JSON.parse(actionMatch[1]);
                if (action.type === 'ADD_MEAL') {
                    // Find dish ID
                    const dish = DISHES.find(d => d.name.toLowerCase() === action.dishName.toLowerCase());
                    const dishId = dish ? dish.id : plannerStore.addCustomDish(action.dishName).id;
                    plannerStore.addDishToDate(action.date, action.mealType, dishId);
                } else if (action.type === 'ADD_SHOPPING') {
                    shoppingStore.addItem(action.item);
                }
            } catch (e) {
                console.error("Failed to parse AI action", e);
            }
        }

        return text.replace(/\[ACTION\].*?\[\/ACTION\]/, "").trim();
    }
};
