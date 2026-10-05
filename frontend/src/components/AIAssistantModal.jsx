import React, { useState, useRef, useEffect } from "react";
import { apiService } from "../services/api";

export default function AIAssistantModal({
  foods = [],
  onClose,
  onAddToCart,
  onSelectFood
}) {
  const [messages, setMessages] = useState([
    {
      sender: "ai",
      text: "Hello! I am your **SmartBite AI Nutritionist & Food Guide**. I can analyze calories, suggest high-protein alternatives, find vegetarian options, or recommend Hyderabad's finest dining picks. What would you like to eat today?",
      recommendedFoods: []
    }
  ]);
  const [inputVal, setInputVal] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [speechNotice, setSpeechNotice] = useState("");
  const chatBottomRef = useRef(null);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  async function handleSendQuery(queryText) {
    const textToSend = queryText || inputVal;
    if (!textToSend.trim()) return;

    const userMessage = { sender: "user", text: textToSend };
    setMessages((prev) => [...prev, userMessage]);
    setInputVal("");
    setIsTyping(true);

    try {
      const aiResponse = await apiService.queryNutritionAI(textToSend, null, foods);
      setMessages((prev) => [
        ...prev,
        {
          sender: "ai",
          text: aiResponse.text,
          recommendedFoods: aiResponse.recommendedFoods || []
        }
      ]);
    } catch (err) {
      console.error("AI Assistant error:", err);
      setMessages((prev) => [
        ...prev,
        {
          sender: "ai",
          text: "I experienced a minor glitch querying nutrition records. Please try asking again or select one of the suggested topics below.",
          recommendedFoods: []
        }
      ]);
    } finally {
      setIsTyping(false);
    }
  }

  function handleVoiceInput() {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSpeechNotice("Voice input not supported in this browser. Please type your query.");
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = "en-IN";
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      setIsListening(true);
      setSpeechNotice("Listening... Please speak your question now.");

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInputVal(transcript);
        setIsListening(false);
        setSpeechNotice("");
        handleSendQuery(transcript);
      };

      recognition.onerror = (event) => {
        console.warn("Speech recognition error:", event.error);
        if (event.error === "not-allowed") {
          setSpeechNotice("Microphone permission denied. Please allow mic access or type.");
        } else {
          setSpeechNotice("Speech not recognized. Please try speaking again.");
        }
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (e) {
      console.error("Voice trigger error:", e);
      setSpeechNotice("Failed to start voice recognition.");
      setIsListening(false);
    }
  }

  const promptChips = [
    "High protein meals under ₹300",
    "Healthier alternative to biryani",
    "Best low calorie meals for dinner",
    "Pure vegetarian options with high fiber",
    "What are the most popular dishes in Hyderabad?"
  ];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="ai-chat-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose} aria-label="Close modal">
          ×
        </button>

        <div className="ai-chat-header">
          <div className="ai-header-info">
            <span className="ai-status-pulse">● Online</span>
            <h2>🤖 SmartBite AI Nutrition Assistant</h2>
            <small>Dietitian & Hyderabad Food Guide Intelligence</small>
          </div>
        </div>

        {/* Quick Suggestion Chips */}
        <div className="ai-prompt-chips">
          {promptChips.map((chip, i) => (
            <button
              key={i}
              className="prompt-chip"
              onClick={() => handleSendQuery(chip)}
            >
              {chip}
            </button>
          ))}
        </div>

        {/* Messages Body */}
        <div className="ai-chat-body">
          {messages.map((msg, index) => (
            <div key={index} className={`chat-message ${msg.sender}`}>
              <div className="message-bubble">
                <p>{msg.text}</p>

                {/* Embedded Food Cards in AI response */}
                {msg.recommendedFoods && msg.recommendedFoods.length > 0 && (
                  <div className="ai-recommended-cards-grid">
                    {msg.recommendedFoods.map((f) => (
                      <div key={f.food_id} className="ai-food-pill-card">
                        <img
                          src={f.image_url}
                          alt={f.food_name}
                          className="ai-food-thumb"
                          onError={(e) => {
                            e.currentTarget.src =
                              "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&auto=format&fit=crop&q=80";
                          }}
                        />
                        <div className="ai-food-text">
                          <strong>{f.food_name}</strong>
                          <span className="ai-food-meta">
                            ₹{f.price} • 🔥 {f.calories} kcal • 💪 {f.protein}g protein
                          </span>
                        </div>
                        <div className="ai-food-actions">
                          <button
                            className="ai-view-btn"
                            onClick={() => {
                              onClose();
                              onSelectFood(f);
                            }}
                          >
                            Details
                          </button>
                          <button
                            className="ai-add-btn"
                            onClick={() => {
                              onAddToCart(f);
                            }}
                          >
                            + Cart
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="chat-message ai">
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          )}

          <div ref={chatBottomRef} />
        </div>

        {speechNotice && <div className="speech-status-bar">{speechNotice}</div>}

        {/* Chat Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendQuery();
          }}
          className="ai-chat-input-bar"
        >
          <button
            type="button"
            className={`mic-button ${isListening ? "listening" : ""}`}
            onClick={handleVoiceInput}
            title="Click to speak using voice"
          >
            {isListening ? "🔴" : "🎙️"}
          </button>

          <input
            type="text"
            placeholder="Ask about calories, high protein meals, healthy swaps..."
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
          />

          <button type="submit" className="send-button" disabled={!inputVal.trim() && !isListening}>
            Send ➔
          </button>
        </form>

        <div className="ai-disclaimer">
          ⚠️ General nutrition guidelines. Consult a physician for clinical medical advice.
        </div>
      </div>
    </div>
  );
}
