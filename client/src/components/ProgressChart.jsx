import React, { useState, useEffect } from "react";
import { auth } from "../firebase";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";

const ProgressChart = () => {
  const [data, setData] = useState([]);
  const [range, setRange] = useState(null);
  const [summary, setSummary] = useState("");
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const fetchProgress = async () => {
      const user = auth.currentUser;
      if (!user) return;

      try {
        const res = await fetch("http://localhost:5000/api/get-progress", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userEmail: user.email }),
        });

        const result = await res.json();
        let entries = result.entries || [];

        if (range) {
          const cutoff = new Date();
          cutoff.setDate(cutoff.getDate() - range);
          entries = entries.filter((entry) => new Date(entry.timestamp) >= cutoff);
        }

        const sorted = entries.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

        setData(
          sorted.map((entry) => ({
            date: new Date(entry.timestamp).toLocaleDateString(),
            weight: parseFloat(entry.weight),
          }))
        );
      } catch (error) {
        console.error("Error fetching progress:", error);
      }
    };

    if (mounted) {
      fetchProgress();
    }
  }, [range, mounted]);

  const analyzeProgress = async () => {
    setLoadingSummary(true);
    const user = auth.currentUser;
    if (!user) {
      setLoadingSummary(false);
      return;
    }

    const message = `Here is my weight log:\n${data
      .map((entry) => `${entry.date}: ${entry.weight} kg`)
      .join("\n")}\n\nPlease summarize my trend and progress.`;

    try {
      const res = await fetch("http://localhost:5000/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });

      const result = await res.json();
      setSummary(result.reply || "No response from AI.");
    } catch (err) {
      console.error(err);
      setSummary("Failed to analyze progress.");
    } finally {
      setLoadingSummary(false);
    }
  };

  if (!mounted) {
    return <div>Loading...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto mt-10">
      <div className="flex gap-4 mb-4">
        <button 
          onClick={() => setRange(7)}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Last 7 Days
        </button>
        <button 
          onClick={() => setRange(30)}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Last 30 Days
        </button>
        <button 
          onClick={() => setRange(null)}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          All Time
        </button>
      </div>
      <h2 className="text-xl font-bold mb-4">Weight Over Time</h2>
      {data.length > 0 && (
        <div className="mb-4">
          <button
            onClick={analyzeProgress}
            disabled={loadingSummary}
            className="bg-indigo-500 text-white px-4 py-2 rounded hover:bg-indigo-600 disabled:opacity-50"
          >
            {loadingSummary ? "Analyzing..." : "Analyze My Progress"}
          </button>
        </div>
      )}
      {data.length > 0 ? (
        <div style={{ width: '100%', height: '300px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis domain={["auto", "auto"]} />
              <Tooltip />
              <Line type="monotone" dataKey="weight" stroke="#8884d8" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <p className="text-center text-gray-500">No progress data yet.</p>
      )}
      {summary && (
        <div className="mt-6 p-4 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-white border rounded">
          <h3 className="font-semibold text-lg mb-2">AI Progress Summary</h3>
          <p>{summary}</p>
        </div>
      )}
    </div>
  );
};

export default ProgressChart;