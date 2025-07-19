import React, { useEffect, useState } from "react";
import { auth } from "../firebase";
import ReactMarkdown from "react-markdown";

const DailyPlan = () => {
  const [todayPlan, setTodayPlan] = useState("");
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    const fetchTodayAndHistory = async () => {
      const user = auth.currentUser;
      if (!user) return;

      setLoading(true);
      try {
        const res = await fetch("http://localhost:5000/api/get-daily-plan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userEmail: user.email }),
        });
        const data = await res.json();
        setTodayPlan(data.plan || data.error || "No plan generated.");

        const historyRes = await fetch("http://localhost:5000/api/get-daily-history", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userEmail: user.email }),
        });
        const historyData = await historyRes.json();
        setHistory(historyData.history || []);
      } catch (err) {
        setTodayPlan("Failed to load today's plan.");
      } finally {
        setLoading(false);
      }
    };

    fetchTodayAndHistory();
  }, []);

  const extractLinks = (text) => {
    const regex = /\[([^\]]+)\]\((https?:\/\/[^\)]+)\)/g;
    const links = [];
    let match;
    while ((match = regex.exec(text))) {
      links.push({ label: match[1], url: match[2] });
    }
    return links;
  };

  const links = extractLinks(todayPlan);

  return (
    <div className="max-w-3xl mx-auto mt-12 p-6 bg-white dark:bg-gray-800 text-gray-800 dark:text-white rounded-md shadow-md">
      <h2 className="text-xl font-semibold mb-4">Your Daily Plan</h2>

      {loading && <p className="mb-4">Generating today's plan...</p>}

      {todayPlan && (
        <div className="prose dark:prose-invert whitespace-pre-wrap">
          <ReactMarkdown>{todayPlan}</ReactMarkdown>
        </div>
      )}

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

      {history.length > 0 && (
        <div className="mt-8">
          <h3 className="text-lg font-semibold mb-4">📚 Past Daily Plans</h3>
          <div className="space-y-4 max-h-64 overflow-y-auto">
            {history.map((entry, i) => (
              <div key={i} className="border border-gray-300 dark:border-gray-600 rounded p-3 bg-gray-50 dark:bg-gray-700">
                <div className="text-sm font-semibold mb-2 text-gray-600 dark:text-gray-300">
                  {new Date(entry.timestamp).toLocaleDateString()}
                </div>
                <div className="prose dark:prose-invert whitespace-pre-wrap text-sm">
                  <ReactMarkdown>{entry.plan}</ReactMarkdown>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DailyPlan;
