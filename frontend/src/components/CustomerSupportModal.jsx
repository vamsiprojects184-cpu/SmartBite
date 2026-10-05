import React, { useState, useEffect } from "react";
import { apiService } from "../services/api";

export default function CustomerSupportModal({
  loggedInUser,
  orders = [],
  onClose
}) {
  const [activeTab, setActiveTab] = useState("new_ticket"); // "new_ticket" or "my_tickets"
  const [category, setCategory] = useState("Order Issue");
  const [selectedOrderId, setSelectedOrderId] = useState("");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [speechError, setSpeechError] = useState("");
  const [tickets, setTickets] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (loggedInUser) {
      const userTickets = apiService.getSupportTickets(loggedInUser.user_id);
      setTickets(userTickets);
    }
  }, [loggedInUser, activeTab]);

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
      alert("Please enter details of your inquiry or issue.");
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await apiService.submitSupportTicket({
        user_id: loggedInUser?.user_id || 1,
        category,
        subject: subject.trim(),
        description: description.trim(),
        order_id: selectedOrderId || null
      });

      if (res.success) {
        alert(`Support Ticket #${res.ticket.ticket_id} created successfully! Our team will assist you.`);
        setSubject("");
        setDescription("");
        setSelectedOrderId("");
        setActiveTab("my_tickets");
      }
    } catch (err) {
      console.error("Support submit error:", err);
      alert("Failed to submit ticket. Please reach out via WhatsApp or phone.");
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

        <div className="support-modal-header">
          <span className="section-label">SMARTBITE HELP & CARE</span>
          <h2>🎧 Customer Support & Grievance</h2>
          <p>We are here 24x7 to assist you with orders, nutrition queries, and dining experiences.</p>
        </div>

        {/* Quick Communication Bar */}
        <div className="support-quick-channels">
          <a
            href="https://wa.me/919876543210?text=Hello%20SmartBite%20Support%2C%20I%20need%20help%20with%20my%20order."
            target="_blank"
            rel="noopener noreferrer"
            className="quick-channel-card whatsapp"
          >
            <span className="channel-icon">💬</span>
            <div>
              <strong>WhatsApp Support</strong>
              <small>Instant reply in 2 mins</small>
            </div>
          </a>

          <a href="tel:+919876543210" className="quick-channel-card phone">
            <span className="channel-icon">📞</span>
            <div>
              <strong>Toll-Free Helpline</strong>
              <small>+91 98765 43210</small>
            </div>
          </a>

          <a href="mailto:support@smartbite.in" className="quick-channel-card email">
            <span className="channel-icon">✉️</span>
            <div>
              <strong>Email Support</strong>
              <small>support@smartbite.in</small>
            </div>
          </a>
        </div>

        {/* Navigation Tabs */}
        <div className="support-tabs-bar">
          <button
            className={`support-tab ${activeTab === "new_ticket" ? "active" : ""}`}
            onClick={() => setActiveTab("new_ticket")}
          >
            ✍️ Raise a Concern / Question
          </button>
          <button
            className={`support-tab ${activeTab === "my_tickets" ? "active" : ""}`}
            onClick={() => setActiveTab("my_tickets")}
          >
            📋 My Support Tickets ({tickets.length})
          </button>
        </div>

        {activeTab === "new_ticket" ? (
          <form onSubmit={handleSubmitTicket} className="support-form">
            <div className="form-row-2">
              <div className="form-group">
                <label>Issue Category:</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="support-input"
                >
                  <option value="Order Issue">Order Related Issue</option>
                  <option value="Delivery Delay">Delivery Delay / Valet</option>
                  <option value="Food Quality">Food Quality / Packaging</option>
                  <option value="Payment/Refund">Payment / Refund Status</option>
                  <option value="Nutrition Inquiry">Nutrition / Diet Consultation</option>
                  <option value="General Inquiry">General Feedback / Suggestion</option>
                </select>
              </div>

              {orders.length > 0 && (
                <div className="form-group">
                  <label>Related Order (Optional):</label>
                  <select
                    value={selectedOrderId}
                    onChange={(e) => setSelectedOrderId(e.target.value)}
                    className="support-input"
                  >
                    <option value="">None / Not Order Specific</option>
                    {orders.map((o) => (
                      <option key={o.order_id} value={o.order_id}>
                        Order #{o.order_id} (₹{o.total_amount}) • {o.order_status}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="form-group">
              <label>Subject:</label>
              <input
                type="text"
                placeholder="E.g. Delayed delivery or Missing item"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                required
                className="support-input"
              />
            </div>

            <div className="form-group">
              <div className="label-with-voice">
                <label>Describe the issue:</label>
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
                placeholder="Provide details of your query or grievance..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                className="support-textarea"
              />
              {speechError && <p className="speech-error-msg">{speechError}</p>}
            </div>

            <button type="submit" className="primary-btn" disabled={isSubmitting} style={{ width: "100%" }}>
              {isSubmitting ? "Submitting Ticket..." : "Submit Grievance to SmartBite Care"}
            </button>
          </form>
        ) : (
          /* My Tickets Tab */
          <div className="my-tickets-container">
            {tickets.length === 0 ? (
              <div className="no-tickets-placeholder">
                <p>You have not logged any grievances or inquiries yet.</p>
              </div>
            ) : (
              tickets.map((t) => (
                <div key={t.ticket_id} className="support-ticket-card">
                  <div className="ticket-top">
                    <div>
                      <span className="ticket-id-tag">#{t.ticket_id}</span>
                      <h4>{t.subject}</h4>
                      <small className="ticket-category">Category: {t.category}</small>
                    </div>
                    <span className={`status-pill ${t.status.toLowerCase().replace(" ", "-")}`}>
                      ● {t.status}
                    </span>
                  </div>

                  <p className="ticket-desc">{t.description}</p>

                  {t.resolution && (
                    <div className="ticket-resolution-box">
                      <strong>SmartBite Resolution:</strong>
                      <p>{t.resolution}</p>
                    </div>
                  )}

                  <small className="ticket-date">Logged on: {t.date}</small>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
