import React, { useEffect, useState } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from './firebase';
import GoalForm from './components/GoalForm';
import ChatBox from './components/ChatBox';
import TrackProgress from './components/TrackProgress';
import ProgressChart from './components/ProgressChart';
import './index.css';
import Home from './components/Home';
import AuthCard from './components/AuthCard';
import PastPlans from './components/PastPlans';
import ProgressTimeline from './components/ProgressTimeline';
import GamificationCard from './components/GamificationCard';
import DailyPlan from './components/DailyPlan';

function App() {
  const [user, setUser] = useState(null);
  const [result, setResult] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem("theme") === "dark";
  });
  const [checkInMsg, setCheckInMsg] = useState("");
  const [language, setLanguage] = useState("English");
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const checkDailyStatus = async () => {
      const user = auth.currentUser;
      if (!user) return;

      const res = await fetch("http://localhost:5000/api/daily-checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userEmail: user.email }),
      });
      const data = await res.json();
      setCheckInMsg(data.message || "");
    };

    checkDailyStatus();
  }, []);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [darkMode]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      const currentPath = window.location.pathname;

      if (u && currentPath === "/auth") {
        navigate("/dashboard");
      } else if (!u && currentPath !== "/" && currentPath !== "/auth") {
        navigate("/auth");
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  const handleLogout = async () => {
    await signOut(auth);
    setUser(null);
    navigate("/auth");
  };

  const handleResult = (res) => {
    if (res.error) {
      setError(res.error);
      setResult('');
    } else {
      setResult(res.plan);
      setError('');
    }
    setLoading(false);
  };

  return (
    <div className={`min-h-screen ${darkMode ? "bg-gray-100 dark:bg-gray-900" : "bg-white"} text-gray-900 dark:text-white`}>
      {/* Top Navigation Bar */}
      <nav className="bg-gray-900 text-white px-6 py-4 shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          
          {/* Logo */}
          <div className="text-xl font-bold whitespace-nowrap">
            AI Fitness & Diet Coach
          </div>

          {/* Hamburger Icon for Mobile */}
          <div className="md:hidden">
            <button onClick={() => setMenuOpen(!menuOpen)}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d={menuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
              </svg>
            </button>
          </div>

          {/* Nav */}
          <div className="hidden md:flex gap-6 items-center text-sm">
            {user && (
              <>
                <button onClick={() => navigate("/dashboard")} className="hover:text-blue-400">Dashboard</button>
                <button onClick={() => navigate("/daily")} className="hover:text-blue-400">Daily Plan</button>
                <button onClick={() => navigate("/progress")} className="hover:text-blue-400">Progress</button>
                <button onClick={() => navigate("/plans")} className="hover:text-blue-400">My Plans</button>
                <button onClick={() => navigate("/timeline")} className="hover:text-blue-400">Timeline</button>
              </>
            )}

            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="bg-gray-800 border border-gray-600 text-white rounded px-2 py-1"
            >
              <option>English</option>
              <option>Español</option>
              <option>Français</option>
              <option>Deutsch</option>
              <option>हिन्दी</option>
              <option>中文</option>
            </select>

            <button onClick={() => setDarkMode(!darkMode)} className="hover:text-yellow-300 text-sm">
              {darkMode ? "Dark" : "Light"}
            </button>

            {user && (
              <button onClick={handleLogout} className="text-red-400 hover:text-red-600 font-medium text-sm">
                Logout
              </button>
            )}
          </div>
        </div>

        {/* Dropdown */}
        {menuOpen && (
          <div className="md:hidden mt-4 space-y-3 text-sm">
            {user && (
              <>
                <button onClick={() => navigate("/dashboard")} className="block w-full text-left px-4 py-2 hover:bg-gray-800">Dashboard</button>
                <button onClick={() => navigate("/daily")} className="block w-full text-left px-4 py-2 hover:bg-gray-800">Daily Plan</button>
                <button onClick={() => navigate("/progress")} className="block w-full text-left px-4 py-2 hover:bg-gray-800">Progress</button>
                <button onClick={() => navigate("/plans")} className="block w-full text-left px-4 py-2 hover:bg-gray-800">My Plans</button>
                <button onClick={() => navigate("/timeline")} className="block w-full text-left px-4 py-2 hover:bg-gray-800">Timeline</button>
              </>
            )}
            <div className="px-4 py-2">
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full bg-gray-800 border border-gray-600 text-white rounded px-2 py-1"
              >
                <option>English</option>
                <option>Español</option>
                <option>Français</option>
                <option>Deutsch</option>
                <option>हिन्दी</option>
                <option>中文</option>
              </select>
            </div>

            <div className="px-4 pb-4 flex justify-between items-center">
              <button onClick={() => setDarkMode(!darkMode)} className="hover:text-yellow-300">
                {darkMode ? "Dark" : "Light"}
              </button>
              {user && (
                <button onClick={handleLogout} className="text-red-400 hover:text-red-600 font-medium">
                  Logout
                </button>
              )}
            </div>
          </div>
        )}
      </nav>
      {/* Routes */}
      <Routes>
        <Route
          path="/auth"
          element={
            <div className="flex flex-col gap-6 items-center mt-12">
              <AuthCard />
            </div>
          }
        />

        <Route
          path="/dashboard"
          element={
            user ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <GamificationCard />
                {/* Plan Generator */}
                <div className="bg-white dark:bg-gray-800 p-6 shadow-md rounded-lg col-span-1">
                  <h2 className="text-xl font-bold mb-4">Today's Plan</h2>
                  <GoalForm onResult={handleResult} setLoading={setLoading} />
                  {loading && <p className="text-blue-600 mt-2">Generating plan...</p>}
                  {error && <p className="text-red-500 mt-2">{error}</p>}
                  {result && (
                    <div className="mt-4 max-h-[300px] overflow-y-auto border rounded p-3 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-white text-sm">
                      <strong className="block mb-2">Your Plan:</strong>
                      <pre className="whitespace-pre-wrap break-words text-gray-800 dark:text-white">
                        {result}
                      </pre>
                    </div>
                  )}
                  {checkInMsg && (
                    <div className="text-center bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100 p-4 rounded shadow mb-4">
                      {checkInMsg}
                    </div>
                  )}
                </div>

                {/* Chat Coach */}
                <div className="bg-white dark:bg-gray-800 p-6 shadow-md rounded-lg col-span-1">
                  <h2 className="text-xl font-bold mb-4">Ask the Coach</h2>
                  <ChatBox language={language} />
                </div>

                {/* Progress Summary */}
                <div className="bg-white dark:bg-gray-800 p-6 shadow-md rounded-lg md:col-span-2">
                  <h2 className="text-xl font-bold mb-4">AI Progress Summary</h2>
                  <ProgressChart />
                </div>
              </div>
            ) : (
              <p className="text-center mt-6">Please log in to view your dashboard.</p>
            )
          }
        />

        <Route
          path="/progress"
          element={
            user ? (
              <div className="p-6 space-y-8 max-w-5xl mx-auto">
                <section className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6">
                  <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">Track Your Progress</h2>
                  <TrackProgress />
                </section>

                <section className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6">
                  <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">Weight Over Time</h2>
                  <ProgressChart />
                </section>
              </div>
            ) : (
              <p className="text-center mt-6">Please log in to view your progress.</p>
            )
          }
        />

        <Route path="*" element={<p className="text-center mt-10">404 - Page Not Found</p>} />
        <Route path="/daily" element={user ? <DailyPlan /> : <p className="text-center mt-6">Please log in to view today's plan.</p>} />
        <Route path="/" element={<Home />} />
        <Route path="/auth" element={<AuthCard />} />
        <Route path="/plans" element={<PastPlans />} />
        <Route
          path="/timeline"
          element={
            user ? <ProgressTimeline /> : <p className="text-center mt-6">Please log in to view your timeline.</p>
          }
        />
      </Routes>
    </div>
  );
}

export default App;
