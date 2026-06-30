import {
  Bot,
  Send,
  Sparkles,
  TrendingUp,
  Map,
  Trophy,
  User,
  ChevronRight,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";

const SUGGESTED_PROMPTS = [
  {
    id: "analyze",
    icon: Sparkles,
    label: "Analyze my profile",
    text: "Analyze my coding profile and give me a detailed assessment of my strengths and weaknesses.",
  },
  {
    id: "study",
    icon: TrendingUp,
    label: "What should I study next?",
    text: "Based on my current skill level and solved problems, what topics should I focus on next?",
  },
  {
    id: "roadmap",
    icon: Map,
    label: "Create a 30-day roadmap",
    text: "Create a personalized 30-day study roadmap to help me improve my competitive programming skills.",
  },
  {
    id: "rating",
    icon: Trophy,
    label: "Improve contest rating",
    text: "How can I improve my contest rating? Give me specific strategies and problem types to focus on.",
  },
];

const INITIAL_MESSAGES = [
  {
    id: 1,
    role: "assistant",
    text: "👋 Hey! I'm your **AI Mentor**, here to help you level up your competitive programming journey.\n\nI can analyze your profiles, create study plans, suggest topics, and guide you toward your coding goals. Try one of the prompts below or ask me anything!",
    time: "Just now",
  },
];

const MOCK_RESPONSES = {
  analyze:
    "📊 **Profile Analysis**\n\nBased on your connected profiles, here's what I see:\n\n• **Codeforces**: You're strong in greedy algorithms and math, but could improve in graph problems and DP.\n• **LeetCode**: Your acceptance rate is solid. Focus on medium-difficulty tree and graph problems.\n• **GitHub**: Good contribution streak! Your projects show strong frontend skills.\n\n**Top recommendation**: Spend 2 weeks on graph algorithms — BFS, DFS, Dijkstra, and Union-Find.",
  study:
    "📚 **Next Study Topics**\n\nHere's your personalized learning path:\n\n1. **Dynamic Programming** — You have the foundation. Practice interval DP and bitmask DP.\n2. **Graph Algorithms** — Shortest paths, minimum spanning trees, topological sort.\n3. **Segment Trees** — Essential for range-query problems in Codeforces Div. 2 C/D.\n\nStart with Codeforces EDU section on DP — it's structured and has great problem sets.",
  roadmap:
    "🗓️ **Your 30-Day Roadmap**\n\n**Week 1 (Days 1–7)**: Graph fundamentals\n— BFS/DFS, bipartite check, cycle detection\n— Solve 3 Codeforces 1400–1600 graph problems daily\n\n**Week 2 (Days 8–14)**: Dynamic Programming\n— Classic DP (knapsack, LCS, LIS)\n— Tree DP problems\n\n**Week 3 (Days 15–21)**: Data Structures\n— Segment tree with lazy propagation\n— Fenwick tree applications\n\n**Week 4 (Days 22–30)**: Contest simulations\n— Participate in 2 virtual Codeforces rounds\n— Review all wrong answers thoroughly",
  rating:
    "🏆 **Boosting Your Contest Rating**\n\nHere's the strategy that works:\n\n**Short-term (next 4 weeks)**:\n• Solve A and B problems in under 15 minutes each\n• Practice reading problem statements carefully\n• Always attempt C problems even if you can't fully solve them\n\n**Medium-term (2–3 months)**:\n• Upsolve every problem you couldn't solve in a contest\n• Maintain a problem journal with key observations\n• Target Div. 2 and Div. 3 rounds for rating gains\n\n**Key insight**: Consistency beats intensity. Solving 2 problems daily beats 14 problems on Sunday.",
};

const formatMessage = (text) => {
  return text.split("\n").map((line, i) => {
    const boldLine = line.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
    return (
      <span key={i}>
        <span dangerouslySetInnerHTML={{ __html: boldLine }} />
        {i < text.split("\n").length - 1 && <br />}
      </span>
    );
  });
};

const AiMentor = () => {
  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const sendMessage = (text) => {
    if (!text.trim() || isTyping) return;

    const userMsg = {
      id: Date.now(),
      role: "user",
      text: text.trim(),
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    // Find matching mock response
    const matchKey = Object.keys(MOCK_RESPONSES).find((k) =>
      SUGGESTED_PROMPTS.find((p) => p.id === k && p.text === text.trim())
    );
    const responseText =
      MOCK_RESPONSES[matchKey] ||
      "🤖 That's a great question! I'm currently in demo mode, but once integrated with your real data, I'll be able to give you a detailed, personalized answer. In the meantime, try one of the suggested prompts to see what I can do!";

    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          role: "assistant",
          text: responseText,
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
      setIsTyping(false);
    }, 1400);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handlePromptClick = (prompt) => {
    sendMessage(prompt.text);
    inputRef.current?.focus();
  };

  return (
    <div className="ai-mentor-page">
      {/* ── Welcome Banner ── */}
      <div className="ai-mentor-welcome">
        <div className="ai-mentor-welcome-icon">
          <Bot size={32} />
        </div>
        <div className="ai-mentor-welcome-text">
          <h2 className="ai-mentor-welcome-title">AI Mentor</h2>
          <p className="ai-mentor-welcome-sub">
            Your personal AI-powered coding coach. Get tailored advice, study
            plans, and insights based on your competitive programming profile.
          </p>
        </div>
        <div className="ai-mentor-welcome-badge">
          <Sparkles size={14} />
          Powered by AI
        </div>
      </div>

      {/* ── Main layout: Chat + Sidebar ── */}
      <div className="ai-mentor-layout">
        {/* Chat Area */}
        <div className="ai-chat-panel">
          {/* Messages */}
          <div className="ai-chat-messages">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`ai-chat-message ai-chat-message--${msg.role}`}
              >
                <div className="ai-chat-avatar">
                  {msg.role === "assistant" ? (
                    <Bot size={16} />
                  ) : (
                    <User size={16} />
                  )}
                </div>
                <div className="ai-chat-bubble">
                  <div className="ai-chat-bubble-text">
                    {formatMessage(msg.text)}
                  </div>
                  <span className="ai-chat-time">{msg.time}</span>
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {isTyping && (
              <div className="ai-chat-message ai-chat-message--assistant">
                <div className="ai-chat-avatar">
                  <Bot size={16} />
                </div>
                <div className="ai-chat-bubble ai-chat-bubble--typing">
                  <span />
                  <span />
                  <span />
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <form className="ai-chat-input-wrap" onSubmit={handleSubmit}>
            <input
              ref={inputRef}
              className="ai-chat-input"
              placeholder="Ask me anything about your coding journey..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isTyping}
              aria-label="Chat input"
              id="ai-chat-input"
            />
            <button
              className="ai-chat-send-btn"
              type="submit"
              disabled={!input.trim() || isTyping}
              aria-label="Send message"
              id="ai-chat-send-btn"
            >
              <Send size={17} />
            </button>
          </form>
        </div>

        {/* Sidebar: Suggested Prompts */}
        <aside className="ai-mentor-sidebar">
          <div className="ai-prompts-header">
            <Sparkles size={16} />
            <span>Suggested Prompts</span>
          </div>
          <div className="ai-prompts-list">
            {SUGGESTED_PROMPTS.map((prompt) => {
              const Icon = prompt.icon;
              return (
                <button
                  key={prompt.id}
                  id={`prompt-${prompt.id}`}
                  className="ai-prompt-chip"
                  onClick={() => handlePromptClick(prompt)}
                  disabled={isTyping}
                >
                  <span className="ai-prompt-chip-icon">
                    <Icon size={16} />
                  </span>
                  <span className="ai-prompt-chip-text">{prompt.label}</span>
                  <ChevronRight size={14} className="ai-prompt-chip-arrow" />
                </button>
              );
            })}
          </div>

          {/* Quick stats */}
          <div className="ai-mentor-stats">
            <p className="ai-mentor-stats-title">Demo Mode</p>
            <p className="ai-mentor-stats-desc">
              Connect your platforms on the Platforms page to unlock personalized
              AI insights based on your real data.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default AiMentor;
