import { useState } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";

const SignUp = () => {
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [error, setError] = useState("");

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
      alert("Signed up successfully!");
      setError("");
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md text-left">
      <h2 className="text-2xl font-bold mb-4">Create an Account</h2>

      <label className="block mb-2 text-sm font-medium text-gray-700">Email</label>
      <input
        className="w-full mb-4 p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        type="email"
        placeholder="you@example.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <label className="block mb-2 text-sm font-medium text-gray-700">Password</label>
      <input
        type="password"
        className="w-full mb-4 p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        placeholder="••••••••"
        value={pass}
        onChange={(e) => setPass(e.target.value)}
      />

      <button
        onClick={handleSignup}
        className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700 transition"
      >
        Sign Up
      </button>

      {error && <p className="text-red-500 mt-3 text-sm">{error}</p>}
    </div>
  );
};

export default SignUp;
