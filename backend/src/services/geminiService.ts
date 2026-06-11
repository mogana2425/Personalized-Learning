import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize the Gemini API client
const apiKey = process.env.GEMINI_API_KEY || '';
let aiClient: any = null;

if (apiKey && apiKey !== 'YOUR_GEMINI_API_KEY_HERE') {
  try {
    aiClient = new GoogleGenerativeAI(apiKey);
  } catch (error) {
    console.error('Failed to initialize GoogleGenerativeAI with key:', error);
  }
}

/**
 * Service to handle all interactions with the Gemini API
 */
export class GeminiService {
  /**
   * Generates a personalized learning path roadmap.
   */
  static async generateLearningPath(
    subject: string,
    profile: {
      class: string;
      preferredLearningStyle: string;
      learningInterests: string[];
      learningGoals: string[];
    },
    scores: Record<string, number>
  ): Promise<any> {
    const prompt = `
      You are an AI Education specialist. Create a 4-week personalized learning path for a student in Class: "${profile.class}".
      Subject: "${subject}"
      Preferred Learning Style: "${profile.preferredLearningStyle}"
      Interests: ${JSON.stringify(profile.learningInterests)}
      Goals: ${JSON.stringify(profile.learningGoals)}
      Current skill profile (assessment scores): ${JSON.stringify(scores)}
      
      Create a JSON response with the following format:
      {
        "weeks": [
          {
            "weekNumber": 1,
            "title": "Week 1 Theme/Title",
            "subtopics": [
              {
                "name": "Subtopic Name",
                "description": "Brief description of subtopic",
                "resources": [
                  {
                    "title": "Resource Title",
                    "type": "note" | "video" | "pdf" | "flashcard",
                    "description": "Short details",
                    "estimatedTimeMinutes": 15,
                    "textContent": "Full study notes or flashcard JSON representation here"
                  }
                ]
              }
            ]
          }
        ]
      }
      Important: Customize resources to match the student's learning style. Include at least 2 subtopics per week. Return ONLY valid JSON, do not include markdown blocks.
    `;

    if (aiClient) {
      try {
        const model = aiClient.getGenerativeModel({ model: 'gemini-flash-latest' });
        const result = await model.generateContent(prompt);
        const text = result.response.text();
        // Clean JSON formatting if markdown wraps it
        const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(cleanJson);
      } catch (error) {
        console.error('Gemini generateLearningPath failed, falling back to mock:', error);
      }
    }

    return this.getMockLearningPath(subject, scores, profile.preferredLearningStyle);
  }

  /**
   * Conversational Chat Tutor with Gemini
   */
  static async tutorChat(message: string, chatHistory: { role: 'user' | 'model'; text: string }[], context?: string): Promise<string> {
    if (aiClient) {
      try {
        // Use systemInstruction if context exists
        const model = aiClient.getGenerativeModel({ 
          model: 'gemini-flash-latest',
          ...(context ? { systemInstruction: { role: 'system', parts: [{ text: context }] } } : {})
        });

        // Format history for Gemini API
        const formattedHistory = chatHistory.map((item) => ({
          role: item.role === 'model' ? 'model' : 'user',
          parts: [{ text: item.text }],
        }));

        const chat = model.startChat({
          history: formattedHistory,
          generationConfig: {
            maxOutputTokens: 500,
          },
        });

        const result = await chat.sendMessage(message);
        return result.response.text();
      } catch (error) {
        console.error('Gemini tutorChat failed, falling back to mock:', error);
      }
    }

    return this.getMockTutorResponse(message);
  }

  /**
   * Generates dynamic recommendations based on skill scores
   */
  static async generateRecommendations(scores: Record<string, number>): Promise<string[]> {
    const prompt = `
      Based on the following student's skill scores (out of 100):
      ${JSON.stringify(scores)}
      
      Generate exactly 3 short, encouraging, and actionable recommendations for what they should study next or how they should practice.
      Ensure the response is a strict JSON array of strings:
      ["Recommendation 1", "Recommendation 2", "Recommendation 3"]
      Return ONLY valid JSON array.
    `;

    if (aiClient) {
      try {
        const model = aiClient.getGenerativeModel({ model: 'gemini-flash-latest' });
        const result = await model.generateContent(prompt);
        const text = result.response.text();
        const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(cleanJson);
      } catch (error) {
        console.error('Gemini generateRecommendations failed, falling back to mock:', error);
      }
    }

    // Mock fallback
    return [
      "Review your recent mistakes in your weakest topics.",
      "Try answering an adaptation practice quiz.",
      "Challenge yourself with a Hard difficulty test in your strongest area."
    ];
  }

  /**
   * AI Evaluation of OCR-extracted Answer Sheet text
   */
  static async evaluateAnswerSheet(
    extractedText: string,
    subject: string,
    topic?: string
  ): Promise<{
    score: number;
    totalMarks: number;
    conceptUnderstanding: string;
    mistakes: string[];
    suggestions: string[];
    feedback: string;
  }> {
    const prompt = `
      You are an expert examiner. Grade the following student's handwritten answer sheet text for Subject: "${subject}", Topic: "${topic || 'General'}".
      
      Extracted Paper Text:
      "${extractedText}"

      Evaluate it out of 100 marks and generate a detailed report.
      Ensure the response is a strict JSON object with this shape:
      {
        "score": 75,
        "totalMarks": 100,
        "conceptUnderstanding": "A detailed summary of which topics the student understood well and where they lacked depth.",
        "mistakes": ["Point form list of specific mistakes found in the work"],
        "suggestions": ["Specific list of study topics or resources they should review"],
        "feedback": "An encouraging and actionable summary of their attempt."
      }
      Return ONLY valid JSON.
    `;

    if (aiClient) {
      try {
        const model = aiClient.getGenerativeModel({ model: 'gemini-flash-latest' });
        const result = await model.generateContent(prompt);
        const text = result.response.text();
        const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(cleanJson);
      } catch (error) {
        console.error('Gemini evaluateAnswerSheet failed, falling back to mock:', error);
      }
    }

    return this.getMockEvaluation(extractedText, subject, topic);
  }

  /**
   * Adapts next quiz difficulty level based on previous performance
   */
  static adaptDifficulty(previousScore: number, currentDifficulty: 'easy' | 'medium' | 'hard'): 'easy' | 'medium' | 'hard' {
    if (previousScore >= 80) {
      if (currentDifficulty === 'easy') return 'medium';
      if (currentDifficulty === 'medium') return 'hard';
      return 'hard';
    } else if (previousScore < 50) {
      if (currentDifficulty === 'hard') return 'medium';
      if (currentDifficulty === 'medium') return 'easy';
      return 'easy';
    }
    return currentDifficulty;
  }

  /**
   * Generates dynamic Lesson Notes for a given topic
   */
  static async generateLessonNotes(topic: string, subject: string, difficulty: string): Promise<string> {
    const prompt = `
      You are an expert tutor. Create comprehensive, structured study notes for the topic "${topic}" in "${subject}".
      The student's proficiency level is: ${difficulty}.
      
      - If Beginner: Use simple analogies, step-by-step breakdowns, and highly accessible language.
      - If Intermediate: Cover standard curriculum with practical examples.
      - If Advanced: Dive deep into edge cases, complex applications, and theoretical foundations.
      
      Structure the output with clear markdown headings, bullet points, and code/math blocks if necessary.
      Make it engaging and highly educational.
    `;

    if (aiClient) {
      try {
        const model = aiClient.getGenerativeModel({ model: 'gemini-flash-latest' });
        const result = await model.generateContent(prompt);
        return result.response.text();
      } catch (error) {
        console.error('Gemini generateLessonNotes failed, falling back:', error);
      }
    }

    return `# Lesson Notes: ${topic}\n\n(Mock generated notes for ${difficulty} level...)`;
  }

  /**
   * Generates dynamic Flashcards for a given topic
   */
  static async generateFlashcards(topic: string, subject: string, difficulty: string): Promise<any[]> {
    const prompt = `
      You are a study aide. Generate 5-7 highly effective flashcards for the topic "${topic}" in "${subject}".
      The difficulty level is ${difficulty}.
      
      Return ONLY a JSON array with objects in this shape:
      [
        { "q": "Question text here?", "a": "Answer text here" }
      ]
    `;

    if (aiClient) {
      try {
        const model = aiClient.getGenerativeModel({ model: 'gemini-flash-latest' });
        const result = await model.generateContent(prompt);
        const text = result.response.text();
        const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(cleanJson);
      } catch (error) {
        console.error('Gemini generateFlashcards failed, falling back:', error);
      }
    }

    return [{ q: "What is the core concept of " + topic + "?", a: "It is the foundational idea of " + subject }];
  }

  /**
   * Generates a dynamic Quiz for a given topic
   */
  static async generateQuiz(topic: string, subject: string, difficulty: string): Promise<any> {
    const prompt = `
      You are an expert quiz generator. Create a short, adaptive quiz (5 questions) for the topic "${topic}" in "${subject}".
      The student's difficulty level is ${difficulty}.
      
      - If Beginner: Focus on definitions and basic application.
      - If Intermediate: Include standard problem-solving.
      - If Advanced: Include multi-step analysis or tricky conceptual questions.
      
      Return ONLY valid JSON in this shape:
      {
        "title": "Quiz: ${topic}",
        "questions": [
          {
            "questionText": "What is...?",
            "options": ["A", "B", "C", "D"],
            "correctAnswer": 0,
            "explanation": "Because..."
          }
        ]
      }
    `;

    if (aiClient) {
      try {
        const model = aiClient.getGenerativeModel({ model: 'gemini-flash-latest' });
        const result = await model.generateContent(prompt);
        const text = result.response.text();
        const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(cleanJson);
      } catch (error) {
        console.error('Gemini generateQuiz failed, falling back:', error);
      }
    }

    return {
      title: `Quiz: ${topic}`,
      questions: [
        {
          questionText: `Mock question for ${topic} (${difficulty})`,
          options: ["Opt 1", "Opt 2", "Opt 3", "Opt 4"],
          correctAnswer: 0,
          explanation: "Mock explanation."
        }
      ]
    };
  }
  /**
   * Generates a Comprehensive AI-powered Lesson Page for a given topic
   */
  static async generateComprehensiveLesson(topic: string, subject: string, difficulty: string): Promise<any> {
    const prompt = `
      You are an expert, adaptive AI tutor. Generate a comprehensive lesson page for the topic "${topic}" in "${subject}".
      The student's difficulty level is: ${difficulty}.
      
      Adapt the tone, depth, and complexity to the difficulty level:
      - Beginner: Simple analogies, foundational focus, step-by-step.
      - Intermediate: Standard curriculum, practical focus.
      - Advanced: Deep dives, theoretical underpinnings, complex examples.
      
      Return ONLY valid JSON in this exact shape:
      {
        "overview": "A 2-3 sentence engaging overview of the topic.",
        "recommendationReason": "A 1-2 sentence explanation of why this topic is important for their current level.",
        "learningObjectives": ["Objective 1", "Objective 2", "Objective 3"],
        "keyConcepts": [
          { "title": "Concept 1", "explanation": "Detailed explanation..." },
          { "title": "Concept 2", "explanation": "Detailed explanation..." }
        ],
        "workedExamples": [
          { "problem": "Example problem...", "solution": "Step-by-step solution..." }
        ],
        "practiceQuestions": [
          {
            "question": "A multiple choice practice question...",
            "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
            "correctAnswerIndex": 0
          },
          {
            "question": "Another multiple choice practice question...",
            "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
            "correctAnswerIndex": 2
          }
        ],
        "studyNotes": "Markdown formatted detailed notes covering the entire topic...",
        "flashcards": [
          { "q": "Question 1?", "a": "Answer 1" },
          { "q": "Question 2?", "a": "Answer 2" },
          { "q": "Question 3?", "a": "Answer 3" }
        ],
        "youtubeSearchQuery": "A highly targeted YouTube search string for this topic, e.g., 'Learn ${topic} ${subject} tutorial'"
      }
      
      IMPORTANT: Generate at least 3-5 practiceQuestions and 3-5 flashcards.
    `;

    if (aiClient) {
      try {
        const model = aiClient.getGenerativeModel({ model: 'gemini-flash-latest' });
        const result = await model.generateContent(prompt);
        const text = result.response.text();
        const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(cleanJson);
      } catch (error) {
        console.error('Gemini generateComprehensiveLesson failed, falling back:', error);
      }
    }

    return {
      overview: `Mock overview for ${topic}`,
      recommendationReason: `You need to master this to improve in ${subject}.`,
      learningObjectives: ["Understand the basics", "Apply formulas"],
      keyConcepts: [{ title: "Concept 1", explanation: "Mock explanation" }],
      workedExamples: [{ problem: "1 + 1", solution: "2" }],
      practiceQuestions: [
        {
          question: "What is 2 + 2?",
          options: ["3", "4", "5", "6"],
          correctAnswerIndex: 1
        },
        {
          question: "Which of the following is true about " + topic + "?",
          options: ["It is false", "It is true", "Neither", "Both"],
          correctAnswerIndex: 1
        },
        {
          question: "Solve for x in x + 1 = 2",
          options: ["0", "1", "2", "3"],
          correctAnswerIndex: 1
        }
      ],
      studyNotes: `# ${topic}\nMock notes for ${difficulty} level.`,
      flashcards: [
        { q: "What is " + topic + "?", a: "A topic in " + subject },
        { q: "Why learn " + topic + "?", a: "To master " + subject },
        { q: "What is the key formula?", a: "It depends on the subtopic." }
      ],
      youtubeSearchQuery: `${topic} ${subject} lesson`
    };
  }

  // --- MOCK FALLBACK DATA GENERATORS ---

  private static getMockLearningPath(subject: string, scores: Record<string, number>, learningStyle: string): any {
    const lowerSub = subject.toLowerCase();
    
    if (lowerSub.includes('math') || lowerSub.includes('calculus') || lowerSub.includes('algebra')) {
      return {
        weeks: [
          {
            weekNumber: 1,
            title: "Linear Functions & Foundations",
            status: "active",
            subtopics: [
              {
                name: "Algebra Revision",
                description: "Review linear equations, slope, graphs, and system of equations.",
                status: "active",
                resources: [
                  {
                    title: "Algebraic Equations Crash Course",
                    type: learningStyle === 'visual' ? 'video' : 'note',
                    description: "Step-by-step concepts to solve systems of linear equations.",
                    estimatedTimeMinutes: 15,
                    textContent: "In linear algebra, a system of equations consists of two or more equations. Methods of solving: Substitution, Elimination, and Graphing. \nExample: 2x + y = 10, x - y = 2.\nAdd them: 3x = 12 => x = 4. \nSubstitute back: 4 - y = 2 => y = 2."
                  },
                  {
                    title: "Practice Flashcards: Algebra Basics",
                    type: "flashcard",
                    description: "Key formulas and definition terms.",
                    estimatedTimeMinutes: 8,
                    textContent: "Q: What is the slope-intercept form?\nA: y = mx + c (where m is slope, c is y-intercept)\n\nQ: What is a linear equation?\nA: An equation of first degree (highest power is 1)."
                  }
                ]
              },
              {
                name: "Quadratic Equations Intro",
                description: "Factoring, quadratic formula, and completing the square.",
                status: "locked",
                resources: [
                  {
                    title: "Solving Quadratics Guide",
                    type: "pdf",
                    description: "Comprehensive notes for formula application.",
                    estimatedTimeMinutes: 20,
                    textContent: "Quadratic Equation: ax^2 + bx + c = 0.\nFormula: x = [-b ± √(b^2 - 4ac)] / 2a.\nDiscriminant (D) = b^2 - 4ac.\nIf D > 0, 2 real roots. If D = 0, 1 real root. If D < 0, complex roots."
                  }
                ]
              }
            ]
          },
          {
            weekNumber: 2,
            title: "Calculus Foundations",
            status: "locked",
            subtopics: [
              {
                name: "Introduction to Limits",
                description: "Understanding limit definition, graphical limits, and algebraic solutions.",
                status: "locked",
                resources: [
                  {
                    title: "Limits Made Visual",
                    type: "video",
                    description: "Short video visualizing limit convergence.",
                    estimatedTimeMinutes: 12
                  }
                ]
              },
              {
                name: "Calculus Basics: Derivatives",
                description: "Derivative rules: Power rule, Product rule, and Quotient rule.",
                status: "locked",
                resources: [
                  {
                    title: "Derivatives Formula Cheat Sheet",
                    type: "note",
                    description: "Power, Product, Chain, Quotient rules summarized.",
                    estimatedTimeMinutes: 10,
                    textContent: "1. Power Rule: d/dx(x^n) = n*x^(n-1).\n2. Product Rule: d/dx(u*v) = u*v' + v*u'.\n3. Chain Rule: d/dx(f(g(x))) = f'(g(x)) * g'(x)."
                  }
                ]
              }
            ]
          },
          {
            weekNumber: 3,
            title: "Calculus Derivatives & Curves",
            status: "locked",
            subtopics: [
              {
                name: "Slope of Curves & Maxima",
                description: "Finding stationary points, increasing/decreasing functions.",
                status: "locked",
                resources: [
                  {
                    title: "Maxima & Minima Applications",
                    type: "pdf",
                    description: "Applied calculus optimisation notes.",
                    estimatedTimeMinutes: 18
                  }
                ]
              }
            ]
          },
          {
            weekNumber: 4,
            title: "Calculus Mock Assessment",
            status: "locked",
            subtopics: [
              {
                name: "Comprehensive Quiz Prep",
                description: "Practice questions covering all algebra and basic derivatives topics.",
                status: "locked",
                resources: [
                  {
                    title: "Complete Exam Practice Booklet",
                    type: "pdf",
                    description: "Set of 25 practice problems with solutions.",
                    estimatedTimeMinutes: 30
                  }
                ]
              }
            ]
          }
        ]
      };
    }

    // Default template for non-math subjects
    return {
      weeks: [
        {
          weekNumber: 1,
          title: `Introductory Foundations in ${subject}`,
          status: "active",
          subtopics: [
            {
              name: `Core concepts of ${subject}`,
              description: "Getting started with definitions and primary frameworks.",
              status: "active",
              resources: [
                {
                  title: `${subject} Basics notes`,
                  type: "note",
                  description: "Introduction study notes.",
                  estimatedTimeMinutes: 15,
                  textContent: `Welcome to ${subject}. This introductory note covers basic definitions, historical contexts, and fundamental laws that serve as a basis for the rest of our modules.`
                }
              ]
            }
          ]
        },
        {
          weekNumber: 2,
          title: `Intermediate Analysis in ${subject}`,
          status: "locked",
          subtopics: [
            {
              name: "Methodological Tools",
              description: "Deeper concepts and analysis methodologies.",
              status: "locked",
              resources: [
                {
                  title: "Analysis Video Lecture",
                  type: "video",
                  description: "Expert talk detailing advanced theories.",
                  estimatedTimeMinutes: 20
                }
              ]
            }
          ]
        }
      ]
    };
  }

  private static getMockTutorResponse(message: string): string {
    const msg = message.toLowerCase();
    
    if (msg.includes('hello') || msg.includes('hi')) {
      return "Hi there! 👋 I'm your friendly AI Teacher! I'm so excited to help you learn today. What fun topic are we diving into?";
    }
    
    if (msg.includes('how are you')) {
      return "I'm doing fantastic, thank you for asking! 🌟 Just sitting here in the digital world, ready to solve some puzzles with you! What's on your mind today?";
    }
    
    if (msg.includes('explain maths') || msg.includes('maths')) {
      return "Maths is like a giant puzzle game! 🧩 The big picture is that math gives us the tools to understand how the universe works, from counting apples to launching rockets! \n\nWe break it down into small rules (like addition or algebra). Which specific math puzzle do you want to tackle first?";
    }
    
    if (msg.includes('derivative') || msg.includes('calculus')) {
      return "Calculus time! 🚀 Imagine you're driving a car. Your speedometer tells you how fast you're going at ONE exact second. \n\nThat's exactly what a **derivative** is! It's the *instantaneous rate of change*! \n\nWant to try a quick practice problem to test your new superpower? 🦸‍♂️";
    }
    
    if (msg.includes('quadratic') || msg.includes('algebra')) {
      return "Ah, Algebra! 🧮 A **quadratic equation** is just a fancy U-shaped curve (like a smiley face! 😃) that looks like: $ax^2 + bx + c = 0$. \n\nWe can find where it crosses the line using the magical **quadratic formula**. \n\nShould we solve one together step-by-step?";
    }
    
    return `That's a fantastic question about "${message}"! 🌟 \n\nThe big picture here is that we just need to identify the core pieces and put them together like Lego blocks! 🧱 \n\nShall we break this down into a simpler, bite-sized example? Let me know!`;
  }

  private static getMockEvaluation(text: string, subject: string, topic?: string): any {
    const marks = Math.floor(Math.random() * 25) + 65; // random mark between 65 and 90
    return {
      score: marks,
      totalMarks: 100,
      conceptUnderstanding: `The student demonstrates a strong conceptual understanding of ${subject} - ${topic || 'Core Topics'}. They correctly laid out the basic formulas and attempted all questions. However, mathematical computational precision and final simplification steps require attention.`,
      mistakes: [
        "Incorrectly computed the discriminant in question 2, leading to faulty root outcomes.",
        "Missed the units in the final velocity calculation in question 5.",
        "Algebraic sign error during substitution step of the simultaneous equations."
      ],
      suggestions: [
        "Review 'Quadratic Discriminant application and properties'.",
        "Practice substitution algebra to reduce sign errors.",
        "Double-check arithmetic steps before completing worksheets."
      ],
      feedback: `Good attempt! You scored ${marks}/100. You clearly understand the core methods, but simple arithmetic errors and sign flips cost you points. Practice more problems in linear substitution and you will score much higher next time!`
    };
  }
}
