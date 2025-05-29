import React, { useState, useEffect, useCallback } from 'react'; // Added useCallback
import '../Questionnaire.css'; // Import the CSS from the parent 'src' directory

// Define the structure for user preferences
interface UserPreferences {
    destination: string;
    startDate: string;
    endDate: string;
    travelers: string;
    dailyRhythm: string;
    travelStyle: string;
    structureLevel: number;
    interests: string[];
    budget: string;
    dietary: string[];
    foodAdventure: number;
    specialRequirements: string[];
    specialNotes: string;
}

// Define the structure for a single question
interface Question {
    id: number;
    title: string;
    subtitle: string;
    type: 'inputs' | 'options' | 'chips' | 'summary'; // Add more types as needed
    dataKey?: keyof UserPreferences; // Added: For questions of type 'options' or 'chips' directly holding a dataKey
    multiSelect?: boolean;          // Added: For 'options' or 'chips' that allow multiple selections at question level
    maxSelections?: number;         // Added: For 'options' or 'chips' with a max selection limit at question level
    fields?: Array<{ // For 'inputs' type
        name: keyof UserPreferences;
        label: string;
        type: 'text' | 'date' | 'select';
        placeholder?: string;
        required: boolean;
        options?: Array<{ value: string; label: string }>;
    }>;
    options?: Array<{ // For 'options' type
        value: string;
        icon: string;
        title: string;
        description?: string;
        dataKey: keyof UserPreferences; // This is for individual options if they map to different keys, or repeat the question's dataKey
        // multiSelect and maxSelections for individual options are not typical but could be added if needed
    }>;
    chips?: Array<{ // For 'chips' type
        value: string;
        label: string;
        dataKey: keyof UserPreferences; // Same as above for options
        exclusive?: string; // e.g., 'none' chip clears others
    }>;
    slider?: { // For questions with a slider
        label: string;
        dataKey: keyof UserPreferences;
        min: number;
        max: number;
        labels: [string, string, string];
    };
    gridClass?: string; // e.g., 'two-column', 'three-column'
}

const TOTAL_QUESTIONS = 7;

const questionsData: Question[] = [
    {
        id: 1,
        title: "Where would you like to go?",
        subtitle: "Tell us your destination and travel dates",
        type: 'inputs',
        fields: [
            { name: 'destination', label: 'Destination', type: 'text', placeholder: 'e.g., Tokyo, Japan', required: true },
            { name: 'startDate', label: 'Start Date', type: 'date', required: true },
            { name: 'endDate', label: 'End Date', type: 'date', required: true },
            { name: 'travelers', label: 'Number of Travelers', type: 'select', required: true, options: [
                { value: "", label: "Select number of travelers" },
                { value: "1", label: "Solo (1 person)" },
                { value: "2", label: "Couple (2 people)" },
                { value: "3-4", label: "Small Group (3-4 people)" },
                { value: "5-8", label: "Medium Group (5-8 people)" },
                { value: "9+", label: "Large Group (9+ people)" },
            ]}
        ]
    },
    {
        id: 2,
        title: "What's your daily rhythm?",
        subtitle: "When do you prefer to start and end your day?",
        type: 'options',
        dataKey: 'dailyRhythm',
        gridClass: 'two-column',
        options: [
            { value: "early-bird", icon: "🌅", title: "Early Bird", description: "Start: 6-8 AM, End: 9-10 PM", dataKey: 'dailyRhythm' },
            { value: "balanced", icon: "☀️", title: "Balanced", description: "Start: 8-10 AM, End: 10-11 PM", dataKey: 'dailyRhythm' },
            { value: "night-owl", icon: "🌙", title: "Night Owl", description: "Start: 10 AM-12 PM, End: 12-2 AM", dataKey: 'dailyRhythm' },
            { value: "flexible", icon: "🔄", title: "Flexible", description: "No fixed schedule preference", dataKey: 'dailyRhythm' },
        ]
    },
    {
        id: 3,
        title: "How do you like to travel?",
        subtitle: "Choose your preferred travel pace",
        type: 'options',
        dataKey: 'travelStyle',
        options: [
            { value: "relaxed", icon: "🧘", title: "Slow & Relaxed", description: "1-2 activities per day, plenty of free time, deep cultural immersion", dataKey: 'travelStyle' },
            { value: "balanced", icon: "⚖️", title: "Balanced Explorer", description: "3-4 activities per day, mix of must-sees and hidden gems", dataKey: 'travelStyle' },
            { value: "packed", icon: "🏃", title: "Fast-Paced Adventurer", description: "5+ activities per day, maximize experiences, see everything", dataKey: 'travelStyle' },
        ],
        slider: {
            label: "How much structure do you want?",
            dataKey: 'structureLevel',
            min: 1,
            max: 5,
            labels: ["Very Flexible", "Some Structure", "Fully Planned"]
        }
    },
    {
        id: 4,
        title: "What excites you most?",
        subtitle: "Select up to 5 interests (we'll prioritize your top choices)",
        type: 'options',
        dataKey: 'interests', // This question directly maps to 'interests' in UserPreferences
        gridClass: 'three-column',
        multiSelect: true, // This question allows multiple selections
        maxSelections: 5,  // Max 5 selections for this question
        options: [
            { value: "food", icon: "🍜", title: "Food & Dining", dataKey: 'interests' },
            { value: "culture", icon: "🏛️", title: "Culture & History", dataKey: 'interests' },
            { value: "adventure", icon: "🏔️", title: "Adventure & Outdoors", dataKey: 'interests' },
            { value: "shopping", icon: "🛍️", title: "Shopping", dataKey: 'interests' },
            { value: "nightlife", icon: "🎉", title: "Nightlife", dataKey: 'interests' },
            { value: "nature", icon: "🌿", title: "Nature & Wildlife", dataKey: 'interests' },
            { value: "art", icon: "🎨", title: "Art & Museums", dataKey: 'interests' },
            { value: "relaxation", icon: "🏖️", title: "Beach & Relaxation", dataKey: 'interests' },
            { value: "photography", icon: "📸", title: "Photography Spots", dataKey: 'interests' },
        ]
    },
    {
        id: 5,
        title: "What's your budget style?",
        subtitle: "Per person, per day (excluding flights)",
        type: 'options',
        dataKey: 'budget',
        options: [
            { value: "backpacker", icon: "🎒", title: "Backpacker", description: "$30-50/day • Hostels, street food, public transport", dataKey: 'budget' },
            { value: "budget", icon: "💰", title: "Budget Conscious", description: "$50-100/day • Budget hotels, local restaurants, some taxis", dataKey: 'budget' },
            { value: "comfort", icon: "🏨", title: "Comfortable", description: "$100-200/day • Nice hotels, good restaurants, private transport", dataKey: 'budget' },
            { value: "luxury", icon: "💎", title: "Luxury", description: "$200+/day • Premium hotels, fine dining, exclusive experiences", dataKey: 'budget' },
        ]
    },
    {
        id: 6,
        title: "Any dietary preferences?",
        subtitle: "Select all that apply",
        type: 'chips',
        dataKey: 'dietary',
        chips: [
            { value: "none", label: "No Restrictions", dataKey: 'dietary', exclusive: 'none' },
            { value: "vegetarian", label: "Vegetarian", dataKey: 'dietary' },
            { value: "vegan", label: "Vegan", dataKey: 'dietary' },
            { value: "halal", label: "Halal", dataKey: 'dietary' },
            { value: "kosher", label: "Kosher", dataKey: 'dietary' },
            { value: "gluten-free", label: "Gluten-Free", dataKey: 'dietary' },
            { value: "dairy-free", label: "Dairy-Free", dataKey: 'dietary' },
            { value: "nut-allergy", label: "Nut Allergy", dataKey: 'dietary' },
            { value: "seafood-allergy", label: "Seafood Allergy", dataKey: 'dietary' },
            { value: "low-sugar", label: "Low Sugar", dataKey: 'dietary' },
            { value: "keto", label: "Keto", dataKey: 'dietary' },
        ],
        slider: {
            label: "Food adventurousness?",
            dataKey: 'foodAdventure',
            min: 1,
            max: 5,
            labels: ["Familiar foods only", "Some new things", "Try everything!"]
        }
    },
    {
        id: 7,
        title: "Anything else we should know?",
        subtitle: "Help us make your trip perfect",
        type: 'chips',
        dataKey: 'specialRequirements',
        chips: [
            { value: "family-kids", label: "Traveling with Kids", dataKey: 'specialRequirements' },
            { value: "elderly", label: "Elderly Travelers", dataKey: 'specialRequirements' },
            { value: "wheelchair", label: "Wheelchair Accessible", dataKey: 'specialRequirements' },
            { value: "pet-friendly", label: "Pet Friendly", dataKey: 'specialRequirements' },
            { value: "business", label: "Business Travel", dataKey: 'specialRequirements' },
            { value: "honeymoon", label: "Honeymoon/Romance", dataKey: 'specialRequirements' },
            { value: "photography", label: "Photography Focus", dataKey: 'specialRequirements' },
            { value: "no-flying", label: "Avoid Internal Flights", dataKey: 'specialRequirements' },
        ],
        fields: [ // Using fields for the additional notes input
            { name: 'specialNotes', label: 'Additional notes (optional)', type: 'text', placeholder: 'e.g., celebrating anniversary, fear of heights, love hidden cafes...', required: false }
        ]
    },
    {
        id: TOTAL_QUESTIONS + 1, // Summary page
        title: "All Set!",
        subtitle: "",
        type: 'summary',
    }
];


// Helper function to get a random element from an array (should be outside component or memoized if inside)
const getRandomElement = <T,>(arr: T[]): T => {
    if (!arr || arr.length === 0) return undefined as T; // Handle empty or undefined arrays
    return arr[Math.floor(Math.random() * arr.length)];
};

// Helper function to get multiple random elements from an array
const getRandomElements = <T,>(arr: T[], count: number): T[] => {
    if (!arr || arr.length === 0) return []; // Handle empty or undefined arrays
    const shuffled = [...arr].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, Math.min(count, arr.length));
};

const Questionnaire: React.FC = () => {
    const [currentQuestion, setCurrentQuestion] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitFeedback, setSubmitFeedback] = useState<{type: 'success' | 'error', message: string} | null>(null); // Added for feedback
    const [userPreferences, setUserPreferences] = useState<UserPreferences>({
        destination: '',
        startDate: '',
        endDate: '',
        travelers: '',
        dailyRhythm: '',
        travelStyle: '',
        structureLevel: 3,
        interests: [],
        budget: '',
        dietary: [],
        foodAdventure: 3,
        specialRequirements: [],
        specialNotes: ''
    });

    const [progress, setProgress] = useState(0);

    useEffect(() => {
        setProgress(((currentQuestion - 1) / TOTAL_QUESTIONS) * 100);
    }, [currentQuestion]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setUserPreferences(prev => ({ ...prev, [name]: value }));
    };
    
    const handleSliderChange = (name: keyof UserPreferences, value: number) => {
        setUserPreferences(prev => ({ ...prev, [name]: value }));
    };

    const handleOptionSelect = (questionKey: keyof UserPreferences, value: string, multiSelect: boolean = false, maxSelections?: number) => {
        setUserPreferences(prev => {
            if (multiSelect) {
                const currentSelection = prev[questionKey] as string[];
                if (currentSelection.includes(value)) {
                    return { ...prev, [questionKey]: currentSelection.filter(item => item !== value) };
                } else if (maxSelections && currentSelection.length >= maxSelections) {
                    alert(`Please select up to ${maxSelections} options.`);
                    return prev;
                }
                return { ...prev, [questionKey]: [...currentSelection, value] };
            }
            return { ...prev, [questionKey]: value };
        });
    };

    const handleChipSelect = (questionKey: keyof UserPreferences, value: string, exclusiveValue?: string) => {
        setUserPreferences(prev => {
            let currentSelection = [...(prev[questionKey] as string[])];

            if (exclusiveValue && value === exclusiveValue) {
                return { ...prev, [questionKey]: [exclusiveValue] };
            }
            
            if (exclusiveValue) { // Remove exclusive if another is selected
                currentSelection = currentSelection.filter(item => item !== exclusiveValue);
            }

            if (currentSelection.includes(value)) {
                currentSelection = currentSelection.filter(item => item !== value);
            } else {
                currentSelection.push(value);
            }
            return { ...prev, [questionKey]: currentSelection };
        });
    };


    const validateCurrentQuestion = (): boolean => {
        const q = questionsData[currentQuestion - 1];
        if (q.id === 1) { // Question 1: Destination & Dates
            if (!userPreferences.destination || !userPreferences.startDate || !userPreferences.endDate || !userPreferences.travelers) {
                alert('Please fill in all fields');
                return false;
            }
        } else if (q.id === 2) { // Question 2: Daily Rhythm
            if (!userPreferences.dailyRhythm) {
                alert('Please select your daily rhythm preference');
                return false;
            }
        } else if (q.id === 3) { // Question 3: Travel Style
            if (!userPreferences.travelStyle) {
                alert('Please select your travel style');
                return false;
            }
        } else if (q.id === 4) { // Question 4: Interests
            if (userPreferences.interests.length === 0) {
                alert('Please select at least one interest');
                return false;
            }
        } else if (q.id === 5) { // Question 5: Budget
            if (!userPreferences.budget) {
                alert('Please select your budget preference');
                return false;
            }
        } else if (q.id === 6) { // Question 6: Dietary
            if (userPreferences.dietary.length === 0) {
                 // Default to 'none' if nothing selected, as per original logic
                setUserPreferences(prev => ({...prev, dietary: ['none']}));
            }
        }
        // Question 7 has optional notes, no specific validation here beyond what's handled by input fields
        return true;
    };

    const nextQuestion = () => {
        if (!validateCurrentQuestion()) {
            return;
        }
        if (currentQuestion < TOTAL_QUESTIONS) {
            setCurrentQuestion(prev => prev + 1);
        } else if (currentQuestion === TOTAL_QUESTIONS) {
            // Move to summary
            setCurrentQuestion(prev => prev + 1); 
            submitPreferences();
        }
    };

    const previousQuestion = () => {
        if (currentQuestion > 1) {
            setCurrentQuestion(prev => prev - 1);
        }
    };

    const populateWithRandomData = useCallback(() => {
        const randomDestination = getRandomElement(["Tokyo, Japan", "Paris, France", "Rome, Italy", "Bali, Indonesia", "New York, USA"]);
        
        const today = new Date();
        const randomStartOffset = Math.floor(Math.random() * 30) + 7; // 7 to 36 days from now
        const startDate = new Date(today.setDate(today.getDate() + randomStartOffset));
        
        const randomDuration = Math.floor(Math.random() * 10) + 3; // 3 to 12 days duration
        const endDate = new Date(new Date(startDate).setDate(startDate.getDate() + randomDuration));

        const formatDate = (date: Date) => date.toISOString().split('T')[0];

        const randomTravelers = getRandomElement(questionsData[0].fields?.find(f => f.name === 'travelers')?.options?.slice(1) || [])?.value || '1';
        const randomDailyRhythm = getRandomElement(questionsData[1].options || [])?.value || 'balanced';
        const randomTravelStyle = getRandomElement(questionsData[2].options || [])?.value || 'balanced';
        const randomStructureLevel = Math.floor(Math.random() * 5) + 1;
        
        const interestOptions = questionsData[3].options?.map(opt => opt.value) || [];
        const randomInterestsCount = Math.floor(Math.random() * (questionsData[3].maxSelections || 5)) + 1;
        const randomInterests = getRandomElements(interestOptions, randomInterestsCount);

        const randomBudget = getRandomElement(questionsData[4].options || [])?.value || 'comfort';
        
        const dietaryOptions = questionsData[5].chips?.map(chip => chip.value) || [];
        const randomDietaryCount = Math.floor(Math.random() * 3); // 0 to 2 selections
        let randomDietary = getRandomElements(dietaryOptions.filter(d => d !== 'none'), randomDietaryCount);
        if (randomDietary.length === 0 && dietaryOptions.includes('none')) {
            randomDietary = ['none'];
        }


        const randomFoodAdventure = Math.floor(Math.random() * 5) + 1;

        const specialReqOptions = questionsData[6].chips?.map(chip => chip.value) || [];
        const randomSpecialReqCount = Math.floor(Math.random() * 2); // 0 or 1 selection
        const randomSpecialRequirements = getRandomElements(specialReqOptions, randomSpecialReqCount);
        
        const randomSpecialNotes = getRandomElement(["Celebrating an anniversary!", "Need a quiet room.", "Love local markets.", ""])

        setUserPreferences({
            destination: randomDestination,
            startDate: formatDate(startDate),
            endDate: formatDate(endDate),
            travelers: randomTravelers,
            dailyRhythm: randomDailyRhythm,
            travelStyle: randomTravelStyle,
            structureLevel: randomStructureLevel,
            interests: randomInterests,
            budget: randomBudget,
            dietary: randomDietary,
            foodAdventure: randomFoodAdventure,
            specialRequirements: randomSpecialRequirements,
            specialNotes: randomSpecialNotes,
        });

        // Optionally, move to the last question or summary to allow quick submission
        // setCurrentQuestion(TOTAL_QUESTIONS + 1);
        // For now, let's just fill and stay on the current question or move to first if not started
        if (currentQuestion > TOTAL_QUESTIONS) setCurrentQuestion(1); // Reset to first if on summary
        alert("Form has been filled with random data!");

    }, [currentQuestion]); // Add currentQuestion to dependencies if you auto-navigate

    const submitPreferences = async () => {
        console.log('User Preferences:', userPreferences);
        setIsSubmitting(true);
        setSubmitFeedback(null);

        // Update summary text to show loading
        const summarySection = document.querySelector('.summary-text');
        if (summarySection) {
            summarySection.innerHTML = `Submitting your preferences... <br />This will take just a few seconds...`;
        }


        try {
            const response = await fetch('/api/submit_questionnaire/', { // Proxied by Vite
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(userPreferences),
            });

            setIsSubmitting(false);

            if (response.ok) {
                const result = await response.json();
                console.log('Backend Response:', result);
                const successMessage = result.message || 'Your preferences have been submitted successfully! 🎉';
                setSubmitFeedback({ type: 'success', message: successMessage });
                if (summarySection) {
                    summarySection.innerHTML = `Your personalized itinerary for ${userPreferences.destination} is being prepared! <br /> ${successMessage}`;
                }
                alert(successMessage);
            } else {
                const errorResult = await response.json().catch(() => ({ message: 'An unknown error occurred during submission.' }));
                console.error('Submission Error:', response.status, errorResult);
                const errorMessage = `Error: ${response.status} - ${errorResult.message || response.statusText}`;
                setSubmitFeedback({ type: 'error', message: errorMessage });
                if (summarySection) {
                    summarySection.innerHTML = `Oops! Something went wrong. <br /> ${errorMessage}`;
                }
                alert(`Error submitting preferences: ${errorMessage}`);
            }
        } catch (error) {
            setIsSubmitting(false);
            const networkErrorMessage = `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`;
            console.error('Network or other error:', error);
            setSubmitFeedback({ type: 'error', message: networkErrorMessage });
            if (summarySection) {
                summarySection.innerHTML = `Oops! A network error occurred. <br /> Please check your connection and try again.`;
            }
            alert(networkErrorMessage);
        }
    };

    return (
        <div className="questionnaire-container">
            <div style={{ position: 'absolute', top: '20px', right: '20px', zIndex: 100 }}>
                <button
                    onClick={populateWithRandomData}
                    className="nav-button"
                    style={{backgroundColor: '#f0ad4e', color: 'white', padding: '10px 15px', border: 'none', borderRadius: '8px', cursor: 'pointer'}}
                >
                    Fill Randomly
                </button>
            </div>
            <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${progress}%` }}></div>
            </div>

            {currentQuestion <= TOTAL_QUESTIONS && (
                 <div className="header">
                    <h1>Let's Personalize Your Journey</h1>
                    <p>Answer a few quick questions to create your perfect itinerary</p>
                </div>
            )}

            {questionsData.map((q) => (
                <div
                    key={q.id}
                    className={`question-section ${currentQuestion === q.id ? 'question-section-active' : 'question-section-inactive'}`}
                    style={{ animation: currentQuestion === q.id ? 'fadeIn 0.5s ease' : 'none' }}
                >
                    <h2 className="question-title">{q.title}</h2>
                    {q.subtitle && <p className="question-subtitle">{q.subtitle}</p>}

                    {q.type === 'inputs' && q.fields?.map(field => (
                        <div className="input-group" key={field.name}>
                            <label htmlFor={field.name}>{field.label}</label>
                            {field.type === 'select' ? (
                                <select 
                                    id={field.name} 
                                    name={field.name} 
                                    value={userPreferences[field.name] as string} 
                                    onChange={handleInputChange} 
                                    required={field.required}
                                >
                                    {field.options?.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                                </select>
                            ) : (
                                <input 
                                    type={field.type} 
                                    id={field.name} 
                                    name={field.name} 
                                    placeholder={field.placeholder} 
                                    value={userPreferences[field.name] as string} 
                                    onChange={handleInputChange} 
                                    required={field.required}
                                />
                            )}
                        </div>
                    ))}

                    {q.type === 'options' && (
                        <div className={`options-grid ${q.gridClass || ''}`}>
                            {q.options?.map(opt => (
                                <div
                                    key={opt.value}
                                    className={`option-card ${( (q.multiSelect && userPreferences[opt.dataKey]) ? (userPreferences[opt.dataKey] as string[]).includes(opt.value) : userPreferences[opt.dataKey] === opt.value) ? 'selected' : ''}`}
                                    onClick={() => handleOptionSelect(opt.dataKey, opt.value, q.multiSelect, q.maxSelections)}
                                >
                                    {opt.icon && <div className="option-icon">{opt.icon}</div>}
                                    <div className="option-title">{opt.title}</div>
                                    {opt.description && <div className="option-description">{opt.description}</div>}
                                </div>
                            ))}
                        </div>
                    )}
                    
                    {q.type === 'chips' && q.chips && (
                        <div className="chip-container">
                            {q.chips.map(chip => (
                                <div
                                    key={chip.value}
                                    className={`chip ${(userPreferences[chip.dataKey] as string[]).includes(chip.value) ? 'selected' : ''}`}
                                    onClick={() => handleChipSelect(chip.dataKey, chip.value, chip.exclusive)}
                                >
                                    {chip.label}
                                </div>
                            ))}
                        </div>
                    )}

                    {q.slider && (
                        <div className="slider-container">
                             <p className="question-subtitle" style={{ marginTop: q.id === 3 ? '30px' : '0', marginBottom: '15px' }}>{q.slider.label}</p>
                            <div className="slider-labels">
                                <span>{q.slider.labels[0]}</span>
                                <span>{q.slider.labels[1]}</span>
                                <span>{q.slider.labels[2]}</span>
                            </div>
                            <input 
                                type="range" 
                                className="slider" 
                                id={q.slider.dataKey}
                                name={q.slider.dataKey}
                                min={q.slider.min} 
                                max={q.slider.max} 
                                value={userPreferences[q.slider.dataKey] as number}
                                onChange={(e) => handleSliderChange(q.slider!.dataKey, parseInt(e.target.value))}
                            />
                        </div>
                    )}
                    
                    {/* For Question 7 additional notes, which is part of a 'chips' type question */}
                    {q.id === 7 && q.fields?.map(field => (
                         <div className="input-group" key={field.name} style={{ marginTop: '30px' }}>
                            <label htmlFor={field.name}>{field.label}</label>
                            <input 
                                type={field.type} 
                                id={field.name} 
                                name={field.name} 
                                placeholder={field.placeholder} 
                                value={userPreferences[field.name] as string} 
                                onChange={handleInputChange} 
                                required={field.required}
                            />
                        </div>
                    ))}


                    {q.type === 'summary' && (
                        <div className="summary-section">
                            <div className="summary-icon">🎉</div>
                            <h2 className="summary-title">{q.title}</h2>
                            <p className="summary-text">
                                We're creating your personalized itinerary for {userPreferences.destination}.<br />
                                {submitFeedback ? submitFeedback.message : 'This will take just a few seconds...'}
                            </p>
                            {submitFeedback && (
                                <p style={{ color: submitFeedback.type === 'error' ? 'red' : 'green', marginTop: '10px' }}>
                                    {submitFeedback.message}
                                </p>
                            )}
                        </div>
                    )}
                </div>
            ))}

            {currentQuestion <= TOTAL_QUESTIONS && (
                <div className="navigation">
                    <button 
                        className="nav-button back-button" 
                        onClick={previousQuestion} 
                        style={{ display: currentQuestion > 1 ? 'block' : 'none' }}
                    >
                        Back
                    </button>
                    <button 
                        className="nav-button next-button"
                        onClick={nextQuestion}
                        disabled={isSubmitting} // Disable button when submitting
                    >
                        {currentQuestion === TOTAL_QUESTIONS ? (isSubmitting ? 'Submitting...' : 'Create My Itinerary') : 'Next'}
                    </button>
                </div>
            )}
        </div>
    );
};

export default Questionnaire;