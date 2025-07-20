import React, { useEffect, useState } from "react";
import { auth } from "../firebase";

const GamificationCard = () => {
  const [xp, setXp] = useState(0);
  const [badges, setBadges] = useState([]);

  useEffect(() => {
    const fetchXP = async () => {
      const user = auth.currentUser;
      if (!user) return;

      const res = await fetch(`${process.env.REACT_APP_API_BASE}/api/get-xp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userEmail: user.email }),
      });

      const data = await res.json();
      setXp(data.xp || 0);
      setBadges(data.badges || []);
    };

    fetchXP();
  }, []);

  return (
    <div className="bg-white dark:bg-gray-800 p-6 shadow-md rounded-lg col-span-1">
      <h2 className="text-xl font-bold mb-4">Your Achievements</h2>
      <p className="mb-3">XP: <span className="font-bold">{xp}</span></p>
      <div className="flex flex-wrap gap-2">
        {badges.length > 0 ? (
          badges.map((b, i) => (
            <span
              key={i}
              className="bg-yellow-300 dark:bg-yellow-600 text-yellow-900 dark:text-yellow-100 px-3 py-1 rounded-full text-sm font-medium"
            >
              {b}
            </span>
          ))
        ) : (
          <p>No badges yet.</p>
        )}
      </div>
    </div>
  );
};

export default GamificationCard;
