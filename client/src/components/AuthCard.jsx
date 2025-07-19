import { useState } from "react";
import { auth } from "../firebase";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { motion, AnimatePresence } from "framer-motion";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";

const AuthCard = () => {
  const [tab, setTab] = useState("login");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async () => {
    try {
      await signInWithEmailAndPassword(auth, email, pass);
      setError("");
    } catch (err) {
      setError(err.message);
    }
  };

    const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
        await signInWithPopup(auth, provider);
        setError("");
    } catch (err) {
        console.error("Google Sign-In Error:", err);
        setError(err.message);
    }
    };

  const handleSignup = async () => {
    if (!email.includes("@") || !email.includes(".")) {
      setError("Please enter a valid email.");
      return;
    }
    if (pass.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    try {
      await createUserWithEmailAndPassword(auth, email, pass);
      setError("");
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 text-gray-800 dark:text-white p-6 rounded-lg shadow-xl w-full max-w-md mx-auto mt-20">
    <div className="my-6">
    <button
        onClick={handleGoogleLogin}
        className="w-full flex items-center justify-center gap-3 bg-white border border-gray-300 rounded-lg py-2 px-4 shadow hover:shadow-md transition"
    >
        <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="h-5 w-5" />
        <span className="text-sm font-medium text-gray-700">Continue with Google</span>
    </button>
    </div>
      {/* Tabs */}
      <div className="flex justify-center mb-6">
        <button
          onClick={() => setTab("login")}
          className={`px-4 py-2 font-medium ${tab === "login" ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-500"}`}
        >
          Log In
        </button>
        <button
          onClick={() => setTab("signup")}
          className={`px-4 py-2 font-medium ${tab === "signup" ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-500"}`}
        >
          Sign Up
        </button>
      </div>

      {/* Animated Form */}
      <AnimatePresence mode="wait">
        {tab === "login" ? (
          <motion.div
            key="login"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3 }}
          >
            <input
              type="email"
              className="w-full mb-4 p-2 border rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-300"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <input
              type="password"
              className="w-full mb-4 p-2 border rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-300"
              placeholder="Password"
              value={pass}
              onChange={(e) => setPass(e.target.value)}
            />
            <button
              onClick={handleLogin}
              className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700 transition"
            >
              Log In
            </button>
          </motion.div>
        ) : (
          <motion.div
            key="signup"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3 }}
          >
            <input
              type="email"
              className="w-full mb-4 p-2 border rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-300"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <input
              type="password"
              className="w-full mb-4 p-2 border rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-300"
              placeholder="Password"
              value={pass}
              onChange={(e) => setPass(e.target.value)}
            />
            <button
              onClick={handleSignup}
              className="w-full bg-green-600 text-white p-2 rounded hover:bg-green-700 transition"
            >
              Sign Up
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {error && <p className="text-red-500 mt-4 text-sm text-center">{error}</p>}
    </div>
  );
};

export default AuthCard;
