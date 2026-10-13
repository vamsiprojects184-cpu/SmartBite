import React, { useState, useEffect } from "react";
import { apiService } from "../services/api";

export default function CustomerSupportModal({
  loggedInUser = null,
  orders = [],
  onClose
}) {
  const [activeTab, setActiveTab] = useState("faq"); // "faq" | "new_ticket" | "my_tickets"
  const [category, setCategory] = useState("Order Issue");
  const [selectedOrderId, setSelectedOrderId] = useState("");
  const [priority, setPriority] = useState("Normal");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [speechError, setSpeechError] = useState("");
  const [tickets, setTickets] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeFaqIndex, setActiveFaqIndex] = useState(0);

  const faqs = [
    {
      q: "🛵 Where is my order / Why is delivery delayed?",
      a: "Orders usually take 25-35 minutes during peak hours in Hyderabad. You can track your valet live using the 'Track Delivery' button in My Orders. If your order is delayed past 40 minutes, our support team automatically prioritizes your valet.",
      actionLabel: "Track Active Order",
      actionTab: "orders"
    },
    {
      q: "💳 Payment was deducted but order status is pending or failed?",
      a: "Digital payments via UPI or Card that fail to confirm are automatically refunded within 2 to 4 hours by your bank. If the amount is not credited, raise a ticket below with your transaction ID and we will initiate an instant reversal.",
      actionLabel: "Raise Refund Ticket",
      actionTab: "new_ticket"
    },
    {
      q: "🥗 How are SmartBite calories & macros calculated?",
      a: "All nutritional values (calories, protein, carbs, fats, fiber) are certified based on standard recipe batch analysis by certified clinical dietitians. Use our 'AI Nutritionist' to get tailored meal plans for your fitness goals.",
      actionLabel: "Consult AI Dietitian",
      actionTab: "ai"
    },
    {
      q: "🍽️ How do I cancel or modify a table reservation?",
      a: "Table reservations can be cancelled anytime with zero penalty. Visit the Table Reservations modal and click on 'My Reservations' to cancel or modify your party size and time slot.",
      actionLabel: "My Reservations",
      actionTab: "table"
    },
    {
      q: "📦 Food packaging was damaged or items were missing?",
      a: "We maintain a 100% Customer Happiness Guarantee. Submit a photo or describe the missing item in a ticket, and we will issue an immediate replacement or store credit refund.",
      actionLabel: "Report Food Issue",
      actionTab: "new_ticket"
    }
  ];

  useEffect(() => {
    loadTickets();
  }, [loggedInUser, activeTab]);

  async function loadTickets() {
    try {
      const userTickets = await apiService.getSupportTickets(loggedInUser?.user_id || 1);
      setTickets(userTickets || []);
    } catch (e) {
      console.warn("Error fetching tickets:", e);
    }
  }

  // Voice speech-to-text dictation using Web Speech API
  function handleVoiceInput() {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSpeechError("Voice dictation is not supported in this browser. Please type your message.");
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = "en-IN";
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      setIsListening(true);
      setSpeechError("");

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setDescription((prev) => (prev ? `${prev} ${transcript}` : transcript));
        setIsListening(false);
      };

      recognition.onerror = (event) => {
        console.warn("Speech recognition error:", event.error);
        if (event.error === "not-allowed") {
          setSpeechError("Microphone permission was denied. Please type your query.");
        } else {
          setSpeechError("Could not capture speech. Please speak clearly or type.");
        }
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (e) {
      console.error("Speech recognition startup error:", e);
      setSpeechError("Speech recognition failed to initialize.");
      setIsListening(false);
    }
  }

  async function handleSubmitTicket(e) {
    e.preventDefault();
    if (!subject.trim()) {
      alert("Please enter a subject.");
      return;
    }
    if (!description.trim()) {
      alert("Please enter details of your inquiry or grievance.");
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await apiService.submitSupportTicket({
        user_id: loggedInUser?.user_id || 1,
        category,
        priority,
        subject: subject.trim(),
        description: description.trim(),
        order_id: selectedOrderId || null
      });

      if (res.success) {
        alert(`Support Ticket #${res.ticket.ticket_id} created successfully! Our executive is reviewing your issue.`);
        setSubject("");
        setDescription("");
        setSelectedOrderId("");
        setActiveTab("my_tickets");
        loadTickets();
      }
    } catch (err) {
      console.error("Support submit error:", err);
      alert("Failed to submit ticket. Please reach out via WhatsApp or phone helpline.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="support-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose} aria-label="Close modal">
          ×
        </button>

        {/* Modal Header */}
        <div className="support-modal-header">
          <div className="support-header-badges">
            <span className="live-support-indicator">
              <span className="live-dot"></span> 24/7 Priority Support
            </span>
            <span className="agent-count-pill">🟢 8 Care Agents Online</span>
          </div>
          <h2>🎧 SmartBite Care & Support</h2>
          <p>Instant resolution for orders, food quality, nutrition advice, and dining reservations.</p>

          {/* Quick Communication Channels */}
          <div className="support-quick-channels">
            <a
              href="https://wa.me/919876543210?text=Hello%20SmartBite%20Support%2C%20I%20need%20assistance%20with%20my%20order."
              target="_blank"
              rel="noopener noreferrer"
              className="quick-channel-card whatsapp"
            >
              <span className="channel-icon">💬</span>
              <div>
                <strong>WhatsApp Care</strong>
                <small>Average reply: 2 mins</small>
              </div>
            </a>

            <a href="tel:+919876543210" className="quick-channel-card phone">
              <span className="channel-icon">📞</span>
              <div>
                <strong>Toll-Free Helpline</strong>
                <small>1800-SMARTBITE</small>
              </div>
            </a>

            <a href="mailto:support@smartbite.in" className="quick-channel-card email">
              <span className="channel-icon">✉️</span>
              <div>
                <strong>Email Helpdesk</strong>
                <small>support@smartbite.in</small>
              </div>
            </a>
          </div>

          {/* Navigation Tabs */}
          <div className="support-tabs-bar">
            <button
              type="button"
              className={`support-tab ${activeTab === "faq" ? "active" : ""}`}
              onClick={() => setActiveTab("faq")}
            >
              ⚡ Instant Help & FAQs
            </button>
            <button
              type="button"
              className={`support-tab ${activeTab === "new_ticket" ? "active" : ""}`}
              onClick={() => setActiveTab("new_ticket")}
            >
              ✍️ Raise a Concern
            </button>
            <button
              type="button"
              className={`support-tab ${activeTab === "my_tickets" ? "active" : ""}`}
              onClick={() => setActiveTab("my_tickets")}
            >
              📋 My Tickets {tickets.length > 0 && `(${tickets.length})`}
            </button>
          </div>
        </div>

        {/* Tab 1: Instant Help & FAQs */}
        {activeTab === "faq" && (
          <div className="support-faq-view">
            <div className="faq-intro">
              <h4>Frequently Asked Questions</h4>
              <p>Click on any common issue for immediate resolution instructions:</p>
            </div>

            <div className="faq-accordion">
              {faqs.map((faq, idx) => (
                <div
                  key={idx}
                  className={`faq-item-card ${activeFaqIndex === idx ? "expanded" : ""}`}
                  onClick={() => setActiveFaqIndex(activeFaqIndex === idx ? -1 : idx)}
                >
                  <div className="faq-question-row">
                    <strong>{faq.q}</strong>
                    <span className="faq-toggle-icon">{activeFaqIndex === idx ? "−" : "+"}</span>
                  </div>

                  {activeFaqIndex === idx && (
                    <div className="faq-answer-body" onClick={(e) => e.stopPropagation()}>
                      <p>{faq.a}</p>
                      <button
                        type="button"
                        className="faq-cta-btn"
                        onClick={() => {
                          if (faq.actionTab === "new_ticket") {
                            setActiveTab("new_ticket");
                            setSubject(faq.q.replace(/^[^\w\s]+/, "").trim());
                          } else {
                            setActiveTab("new_ticket");
                          }
                        }}
                      >
                        {faq.actionLabel} →
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="faq-need-more">
              <p>Didn't find your answer? You can submit a direct grievance to our logistics team.</p>
              <button
                type="button"
                className="primary-btn"
                onClick={() => setActiveTab("new_ticket")}
              >
                Raise a Support Ticket Now
              </button>
            </div>
          </div>
        )}

        {/* Tab 2: Raise a Ticket */}
        {activeTab === "new_ticket" && (
          <form onSubmit={handleSubmitTicket} className="support-form">
            <div className="form-row-2">
              <div className="form-group">
                <label>Issue Category *</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="support-input"
                >
                  <option value="Order Issue">Order Issue (Missing / Wrong Item)</option>
                  <option value="Delivery Delay">Delivery Delay / Valet Assigned</option>
                  <option value="Food Quality">Food Quality / Hygiene / Spillage</option>
                  <option value="Payment/Refund">Payment Deducted / Refund Request</option>
                  <option value="Table Booking">Table Reservation Question</option>
                  <option value="Nutrition Inquiry">Nutrition / Macro Consultation</option>
                  <option value="General Inquiry">General Feedback / Suggestion</option>
                </select>
              </div>

              <div className="form-group">
                <label>Urgency Priority</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="support-input"
                >
                  <option value="Normal">🟢 Normal (30-min resolution)</option>
                  <option value="High">🟡 High Priority (10-min resolution)</option>
                  <option value="Urgent">🔴 Urgent - Food In Transit (Immediate)</option>
                </select>
              </div>
            </div>

            {orders.length > 0 && (
              <div className="form-group">
                <label>Link to Specific Order (Optional):</label>
                <select
                  value={selectedOrderId}
                  onChange={(e) => setSelectedOrderId(e.target.value)}
                  className="support-input"
                >
                  <option value="">None / Not Order Specific</option>
                  {orders.map((o) => (
                    <option key={o.order_id} value={o.order_id}>
                      Order #{o.order_id} (₹{o.total_amount}) • {o.restaurant_name || "SmartBite"} • {o.order_status}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="form-group">
              <label>Subject / Brief Summary *</label>
              <input
                type="text"
                placeholder="E.g. Item missing from Bawarchi Biryani order"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                required
                className="support-input"
              />
            </div>

            <div className="form-group">
              <div className="label-with-voice">
                <label>Detailed Description *</label>
                <button
                  type="button"
                  onClick={handleVoiceInput}
                  className={`voice-mic-btn ${isListening ? "listening" : ""}`}
                  title="Click to dictate using microphone"
                >
                  {isListening ? "🔴 Listening... Speak now" : "🎙️ Dictate with Voice"}
                </button>
              </div>

              <textarea
                rows="4"
                placeholder="Please describe what happened, any item names, and how we can make it right..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                className="support-textarea"
              />
              {speechError && <p className="speech-error-msg">{speechError}</p>}
            </div>

            <button type="submit" className="primary-btn" disabled={isSubmitting} style={{ width: "100%", padding: "14px" }}>
              {isSubmitting ? "Dispatching Ticket to Care Team..." : "Submit Grievance to SmartBite Care →"}
            </button>
          </form>
        )}

        {/* Tab 3: My Tickets */}
        {activeTab === "my_tickets" && (
          <div className="my-tickets-container">
            {tickets.length === 0 ? (
              <div className="no-tickets-placeholder">
                <span className="no-tickets-icon">📝</span>
                <h3>No Support Tickets Logged</h3>
                <p>If you face any issues with an order or dining experience, our care team is ready 24/7.</p>
                <button
                  type="button"
                  className="primary-btn"
                  onClick={() => setActiveTab("new_ticket")}
                  style={{ marginTop: "14px" }}
                >
                  Raise a Ticket Now
                </button>
              </div>
            ) : (
              <div className="tickets-cards-list">
                {tickets.map((t) => (
                  <div key={t.ticket_id} className="support-ticket-card">
                    <div className="ticket-top">
                      <div>
                        <div className="ticket-badge-row">
                          <span className="ticket-id-tag">#{t.ticket_id}</span>
                          <span className="ticket-category-tag">{t.category}</span>
                          {t.priority && t.priority !== "Normal" && (
                            <span className="ticket-priority-tag urgent">⚡ {t.priority}</span>
                          )}
                        </div>
                        <h4>{t.subject}</h4>
                      </div>
                      <span className={`status-pill ${t.status?.toLowerCase().replace(/\s+/g, "-")}`}>
                        ● {t.status || "In Review"}
                      </span>
                    </div>

                    <p className="ticket-desc">{t.description}</p>

                    {t.resolution && (
                      <div className="ticket-resolution-box">
                        <div className="executive-header">
                          <span>👩‍💼 SmartBite Care Resolution:</span>
                        </div>
                        <p>{t.resolution}</p>
                      </div>
                    )}

                    <div className="ticket-footer">
                      <small className="ticket-date">Logged: {t.date || "Today"}</small>
                      <span className="ticket-satisfaction">SmartBite Happiness Guarantee 🛡️</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
