// Mock Food Detection Service
// Provides realistic food detection responses while backend is being developed

export interface DetectedFood {
  name: string;
  portion: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface FoodAnalysisResult {
  detectedFoods: DetectedFood[];
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  healthInsights: string[];
  analysisType: 'image' | 'video';
  hasTextDescription: boolean;
}

// Common food items with realistic nutritional data
const FOOD_DATABASE = {
  breakfast: [
    { name: 'Scrambled Eggs', portion: '2 large eggs', calories: 140, protein: 12, carbs: 1, fat: 10 },
    { name: 'Whole Wheat Toast', portion: '2 slices', calories: 160, protein: 6, carbs: 28, fat: 2 },
    { name: 'Greek Yogurt', portion: '1 cup', calories: 130, protein: 20, carbs: 9, fat: 0 },
    { name: 'Banana', portion: '1 medium', calories: 105, protein: 1, carbs: 27, fat: 0 },
    { name: 'Oatmeal', portion: '1 cup cooked', calories: 150, protein: 5, carbs: 27, fat: 3 },
    { name: 'Avocado', portion: '1/2 medium', calories: 160, protein: 2, carbs: 9, fat: 15 }
  ],
  lunch: [
    { name: 'Grilled Chicken Breast', portion: '150g', calories: 250, protein: 46, carbs: 0, fat: 5 },
    { name: 'Mixed Vegetables', portion: '100g', calories: 25, protein: 2, carbs: 5, fat: 0 },
    { name: 'Brown Rice', portion: '80g cooked', calories: 110, protein: 2, carbs: 23, fat: 1 },
    { name: 'Salmon Fillet', portion: '120g', calories: 200, protein: 22, carbs: 0, fat: 12 },
    { name: 'Quinoa', portion: '100g cooked', calories: 120, protein: 4, carbs: 22, fat: 2 },
    { name: 'Sweet Potato', portion: '1 medium', calories: 112, protein: 2, carbs: 26, fat: 0 }
  ],
  dinner: [
    { name: 'Pasta with Marinara', portion: '200g', calories: 300, protein: 10, carbs: 60, fat: 2 },
    { name: 'Beef Stir Fry', portion: '150g', calories: 280, protein: 25, carbs: 8, fat: 16 },
    { name: 'Caesar Salad', portion: '1 large bowl', calories: 320, protein: 8, carbs: 12, fat: 28 },
    { name: 'Grilled Fish', portion: '120g', calories: 180, protein: 35, carbs: 0, fat: 4 },
    { name: 'Roasted Vegetables', portion: '150g', calories: 60, protein: 2, carbs: 12, fat: 1 },
    { name: 'Mashed Potatoes', portion: '100g', calories: 83, protein: 2, carbs: 17, fat: 2 }
  ],
  snacks: [
    { name: 'Apple', portion: '1 medium', calories: 95, protein: 0, carbs: 25, fat: 0 },
    { name: 'Almonds', portion: '28g (1 oz)', calories: 160, protein: 6, carbs: 6, fat: 14 },
    { name: 'Protein Bar', portion: '1 bar', calories: 200, protein: 20, carbs: 15, fat: 8 },
    { name: 'Carrot Sticks', portion: '100g', calories: 41, protein: 1, carbs: 10, fat: 0 },
    { name: 'Cheese', portion: '30g', calories: 100, protein: 7, carbs: 1, fat: 8 },
    { name: 'Dark Chocolate', portion: '30g', calories: 150, protein: 2, carbs: 15, fat: 9 }
  ]
};

const HEALTH_INSIGHTS = [
  '✅ High protein content supports muscle health',
  '✅ Good balance of macronutrients',
  '✅ Rich in vitamins and minerals',
  '💡 Consider adding more leafy greens for extra vitamins',
  '💡 Great source of healthy fats',
  '💡 Excellent fiber content for digestive health',
  '💡 Contains antioxidants for immune support',
  '💡 Low sodium content is heart-healthy',
  '💡 Good source of omega-3 fatty acids',
  '💡 High in iron for energy production'
];

export class MockFoodDetectionService {
  private getRandomFoods(category: keyof typeof FOOD_DATABASE, count: number = 2): DetectedFood[] {
    const foods = FOOD_DATABASE[category];
    const shuffled = [...foods].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  }

  private getRandomInsights(count: number = 2): string[] {
    const shuffled = [...HEALTH_INSIGHTS].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  }

  private detectFoodsFromText(text: string): DetectedFood[] {
    const lowerText = text.toLowerCase();
    const detectedFoods: DetectedFood[] = [];

    // Check for specific food mentions
    if (lowerText.includes('chicken')) {
      detectedFoods.push(FOOD_DATABASE.lunch[0]); // Grilled Chicken Breast
    }
    if (lowerText.includes('rice')) {
      detectedFoods.push(FOOD_DATABASE.lunch[2]); // Brown Rice
    }
    if (lowerText.includes('vegetable') || lowerText.includes('veggie')) {
      detectedFoods.push(FOOD_DATABASE.lunch[1]); // Mixed Vegetables
    }
    if (lowerText.includes('egg')) {
      detectedFoods.push(FOOD_DATABASE.breakfast[0]); // Scrambled Eggs
    }
    if (lowerText.includes('salmon') || lowerText.includes('fish')) {
      detectedFoods.push(FOOD_DATABASE.lunch[3]); // Salmon Fillet
    }
    if (lowerText.includes('pasta')) {
      detectedFoods.push(FOOD_DATABASE.dinner[0]); // Pasta with Marinara
    }
    if (lowerText.includes('salad')) {
      detectedFoods.push(FOOD_DATABASE.dinner[2]); // Caesar Salad
    }
    if (lowerText.includes('apple')) {
      detectedFoods.push(FOOD_DATABASE.snacks[0]); // Apple
    }

    return detectedFoods;
  }

  private getMealCategory(): keyof typeof FOOD_DATABASE {
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 11) return 'breakfast';
    if (hour >= 11 && hour < 16) return 'lunch';
    if (hour >= 16 && hour < 22) return 'dinner';
    return 'snacks';
  }

  analyzeFood(textDescription?: string, analysisType: 'image' | 'video' = 'image'): FoodAnalysisResult {
    let detectedFoods: DetectedFood[] = [];

    // If user provided text description, try to detect foods from it
    if (textDescription && textDescription.trim()) {
      detectedFoods = this.detectFoodsFromText(textDescription);
    }

    // If no foods detected from text or no text provided, use random foods based on time
    if (detectedFoods.length === 0) {
      const mealCategory = this.getMealCategory();
      detectedFoods = this.getRandomFoods(mealCategory, 2);
    }

    // Add one more random food for variety
    const allCategories: (keyof typeof FOOD_DATABASE)[] = ['breakfast', 'lunch', 'dinner', 'snacks'];
    const randomCategory = allCategories[Math.floor(Math.random() * allCategories.length)];
    const additionalFood = this.getRandomFoods(randomCategory, 1)[0];
    
    if (!detectedFoods.some(food => food.name === additionalFood.name)) {
      detectedFoods.push(additionalFood);
    }

    // Calculate totals
    const totalCalories = detectedFoods.reduce((sum, food) => sum + food.calories, 0);
    const totalProtein = detectedFoods.reduce((sum, food) => sum + food.protein, 0);
    const totalCarbs = detectedFoods.reduce((sum, food) => sum + food.carbs, 0);
    const totalFat = detectedFoods.reduce((sum, food) => sum + food.fat, 0);

    return {
      detectedFoods,
      totalCalories,
      totalProtein,
      totalCarbs,
      totalFat,
      healthInsights: this.getRandomInsights(2),
      analysisType,
      hasTextDescription: !!textDescription?.trim()
    };
  }

  formatAnalysisResult(result: FoodAnalysisResult): string {
    const { detectedFoods, totalCalories, totalProtein, totalCarbs, totalFat, healthInsights, analysisType, hasTextDescription } = result;
    
    let analysisText = `${hasTextDescription ? 'Combined' : 'Image-Only'} Analysis:\n\n`;
    analysisText += `Image Content: ✅ Available\n`;
    
    if (hasTextDescription) {
      analysisText += `Text Description: "${result.hasTextDescription ? 'User provided description' : 'None'}"\n`;
    }
    
    analysisText += `\nDetected Items:\n`;
    detectedFoods.forEach(food => {
      analysisText += `• ${food.name} (${food.portion})\n`;
    });

    analysisText += `\nNutritional Analysis:\n`;
    analysisText += `• Calories: ~${totalCalories} kcal\n`;
    analysisText += `• Protein: ~${totalProtein}g\n`;
    analysisText += `• Carbs: ~${totalCarbs}g\n`;
    analysisText += `• Fat: ~${totalFat}g\n`;

    analysisText += `\nHealth Insights:\n`;
    healthInsights.forEach(insight => {
      analysisText += `${insight}\n`;
    });

    if (!hasTextDescription) {
      analysisText += `\nTip: Add text description for better accuracy!`;
    }

    return analysisText;
  }
}

export const mockFoodDetectionService = new MockFoodDetectionService();
