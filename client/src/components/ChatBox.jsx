import React, { useState } from "react";
import { auth } from "../firebase";
import ReactMarkdown from "react-markdown";

const ChatBox = ({ language }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim()) return;
    const newMessages = [...messages, { sender: "user", text: input }];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch(`${process.env.REACT_APP_API_BASE}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: input,
          userEmail: auth.currentUser?.email || "anonymous",
          language,
        }),
      });
      const data = await res.json();
      setMessages([
        ...newMessages,
        { sender: "ai", text: data.reply || data.error },
      ]);
    } catch (err) {
      setMessages([
        ...newMessages,
        { sender: "ai", text: "Failed to reach AI." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const extractLinks = (text) => {
    const links = [];
    const regex = /\[([^\]]+)]\((https?:\/\/[^)]+)\)/g;
    let match;
    while ((match = regex.exec(text))) {
      links.push({ label: match[1], url: match[2] });
    }
    return links;
  };

  const latestAIMessage = [...messages].reverse().find((m) => m.sender === "ai");
  const links = latestAIMessage ? extractLinks(latestAIMessage.text) : [];

  return (
    <div className="max-w-xl mx-auto mt-12 p-6 bg-white dark:bg-gray-800 text-gray-800 dark:text-white rounded-md shadow-md">
      <h2 className="text-xl font-semibold mb-4">Chat with AI Coach</h2>

      <div className="h-64 overflow-y-auto border dark:border-gray-700 p-4 mb-4 rounded-md bg-gray-50 dark:bg-gray-700">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`mb-2 text-sm p-2 rounded-md ${
              msg.sender === "user"
                ? "text-right bg-blue-100 dark:bg-blue-900 text-gray-900 dark:text-white"
                : "text-left bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-white"
            }`}
          >
            <div className="prose dark:prose-invert text-sm">
              <ReactMarkdown>{msg.text}</ReactMarkdown>
            </div>
          </div>
        ))}
        {loading && <p><em>Typing...</em></p>}
      </div>

      {links.length > 0 && (
        <div className="mt-4 p-4 bg-gray-100 dark:bg-gray-700 rounded-md border dark:border-gray-600">
          <h4 className="font-semibold mb-2 text-blue-500">Helpful Resources:</h4>
          <ul className="list-disc list-inside text-blue-600 dark:text-blue-300">
            {links.map((link, i) => (
              <li key={i} className="mb-1">
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline hover:text-blue-800 dark:hover:text-blue-200 transition-colors"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex mt-4">
        <input
          className="flex-1 border px-3 py-2 rounded-l-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask your coach..."
        />
        <button
          onClick={sendMessage}
          className="bg-blue-500 text-white px-4 py-2 rounded-r-md hover:bg-blue-600"
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default ChatBox;
