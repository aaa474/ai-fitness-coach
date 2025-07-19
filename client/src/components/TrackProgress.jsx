import React, { useState } from "react";
import { auth } from "../firebase";

const TrackProgress = () => {
  const [weight, setWeight] = useState("");
  const [note, setNote] = useState("");
  const [response, setResponse] = useState("");

  const handleSubmit = async () => {
    const user = auth.currentUser;
    if (!user) {
      setResponse("Please log in first.");
      return;
    }

    if (!weight || isNaN(weight)) {
      setResponse("Enter a valid weight.");
      return;
    }

    if (!user) {
      setResponse("You must be logged in to track progress.");
      return;
    }

    try {
      const res = await fetch("http://localhost:5000/api/track-progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userEmail: user.email,
          weight,
          note,
        }),
      });

      const data = await res.json();
      setResponse(data.message || "Progress saved!");
    } catch (err) {
      console.error(err);
      setResponse("Error saving progress.");
    }
  };

  if (!auth.currentUser) {
      return (
        <div className="text-center mt-6 text-red-500">
          Please log in to track your progress.
        </div>
      );
    }

  return (
    <div className="max-w-xl mx-auto mt-12 p-6 bg-white dark:bg-gray-800 text-gray-800 dark:text-white rounded-md shadow-md">
      <h2 className="text-xl font-semibold mb-4">Track Your Progress</h2>

      <input
        type="number"
        placeholder="Current weight (kg)"
        value={weight}
        onChange={(e) => setWeight(e.target.value)}
        className="w-full mb-2 p-2 border rounded bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
      />

      <textarea
        placeholder="Note or workout (optional)"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        className="w-full mb-2 p-2 border rounded bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
      />

      <button
        onClick={handleSubmit}
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition"
      >
        Save Progress
      </button>

      {response && (
        <p className="mt-2 text-green-600 dark:text-green-400">{response}</p>
      )}
    </div>
  );
};

export default TrackProgress;
