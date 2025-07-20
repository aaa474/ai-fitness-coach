import React, { useState, useEffect } from "react";
import { auth } from "../firebase";

const ProgressTimeline = () => {
  const [entries, setEntries] = useState([]);

  useEffect(() => {
    const fetchEntries = async () => {
      const user = auth.currentUser;
      if (!user) return;

      const res = await fetch(`${process.env.REACT_APP_API_BASE}/api/get-progress`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userEmail: user.email }),
      });

      const data = await res.json();
      const sorted = (data.entries || []).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      setEntries(sorted);
    };

    fetchEntries();
  }, []);

  return (
    <div className="max-w-3xl mx-auto mt-10 p-4">
      <h2 className="text-2xl font-bold mb-6">Progress Timeline</h2>
      <div className="space-y-4">
        {entries.map((entry, i) => (
          <div
            key={i}
            className="border-l-4 pl-4 border-blue-500 bg-white dark:bg-gray-800 p-3 rounded shadow"
          >
            <p className="text-sm text-gray-500 dark:text-gray-300 mb-1">
              {new Date(entry.timestamp).toLocaleString()}
            </p>
            <p className="font-semibold text-lg">Weight: {entry.weight} kg</p>
            {entry.note && <p className="text-sm mt-1 text-gray-700 dark:text-gray-200">💬 {entry.note}</p>}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProgressTimeline;
