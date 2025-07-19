import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";

const Login = () => {
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async () => {
    if (!email.includes("@") || !email.includes(".")) {
      setError("Please enter a valid email.");
      return;
    }

    try {
      await signInWithEmailAndPassword(auth, email, pass);
      alert("Logged in!");
      setError("");
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md text-left">
      <h2 className="text-2xl font-bold mb-4">Log In</h2>
      <input
        className="w-full mb-3 p-2 border rounded"
        placeholder="Email"
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        type="password"
        className="w-full mb-3 p-2 border rounded"
        placeholder="Password"
        onChange={(e) => setPass(e.target.value)}
      />
      <button
        onClick={handleLogin}
        className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700"
      >
        Log In
      </button>
      {error && <p className="text-red-500 mt-2">{error}</p>}
    </div>
  );
};

export default Login;
