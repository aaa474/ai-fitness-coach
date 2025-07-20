import React, { useState } from "react";
import { auth } from "../firebase";
import html2pdf from "html2pdf.js";
import ReactMarkdown from "react-markdown";

const GoalForm = () => {
  const [formData, setFormData] = useState({
    goal: "",
    age: "",
    height: "",
    weight: "",
    activityLevel: "",
    dietPreference: "",
  });

  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const validateInputs = (data) => {
    const { age, height, weight, goal, activityLevel, dietPreference } = data;
    if (!goal || !activityLevel || !dietPreference) {
      return "Goal, Activity Level, and Diet Preference are required.";
    }
    if (!age || isNaN(age) || age <= 0 || age > 120) {
      return "Please enter a valid age.";
    }
    if (!height || isNaN(height) || height <= 50 || height > 300) {
      return "Please enter a valid height in cm.";
    }
    if (!weight || isNaN(weight) || weight <= 20 || weight > 300) {
      return "Please enter a valid weight in kg.";
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResponse("");

    const validationError = validateInputs(formData);
    if (validationError) {
      setResponse(validationError);
      setLoading(false);
      return;
    }

    const user = auth.currentUser;
    try {
      const res = await fetch(`${process.env.REACT_APP_API_BASE}/api/generate-plan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          userEmail: user?.email || "anonymous",
        }),
      });
      const data = await res.json();
      setResponse(data.plan || data.error || "No plan returned");
    } catch (error) {
      console.error("Error:", error);
      setResponse("Failed to generate plan. Please try again.");
    } finally {
      setLoading(false);
    }
  };

    const handleDownload = () => {
      const element = document.getElementById("pdf-content");
      const opt = {
        margin: 0.5,
        filename: "fitness-plan.pdf",
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: "in", format: "letter", orientation: "portrait" },
      };
      html2pdf().set(opt).from(element).save();
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

  const links = extractLinks(response);

  return (
    <div
      id="pdf-content"
      className="mt-6 max-h-[600px] overflow-y-auto bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-white p-4 rounded-md border border-gray-300 dark:border-gray-600 whitespace-pre-wrap"
    >
      <h2 className="text-2xl font-bold mb-6 text-center">Enter Your Fitness Info</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        {["goal", "age", "height", "weight", "activityLevel", "dietPreference"].map((field) => (
          <input
            key={field}
            type="text"
            name={field}
            value={formData[field]}
            onChange={handleChange}
            placeholder={
              {
                goal: "Goal (e.g. lose fat)",
                age: "Age",
                height: "Height (cm)",
                weight: "Weight (kg)",
                activityLevel: "Activity Level (e.g. moderate)",
                dietPreference: "Diet preference (e.g. vegan)",
              }[field]
            }
            className="w-full px-4 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-300"
          />
        ))}
        <button
          type="submit"
          className="w-full py-2 px-4 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition"
        >
          {loading ? "Generating..." : "Generate Plan"}
        </button>
      </form>

      {response && (
        <>
          <div className="mt-6 bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-white p-4 rounded-md border border-gray-300 dark:border-gray-600 whitespace-pre-wrap">
            <h3 className="font-semibold text-lg mb-2">Your AI Fitness Plan:</h3>
            <div className="prose dark:prose-invert whitespace-pre-wrap">
              <ReactMarkdown>{response}</ReactMarkdown>
            </div>
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

          <button
            onClick={handleDownload}
            className="mt-4 w-full py-2 px-4 bg-green-500 text-white rounded-md hover:bg-green-600 transition"
          >
            Download as PDF
          </button>
        </>
      )}
    </div>
  );
};

export default GoalForm;
