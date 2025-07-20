import React, { useEffect, useState } from "react";
import { auth } from "../firebase";

const PastPlans = () => {
  const [plans, setPlans] = useState([]);

  useEffect(() => {
    const fetchPlans = async () => {
      const user = auth.currentUser;
      if (!user) return;

      const res = await fetch(`${process.env.REACT_APP_API_BASE}/api/get-plans`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userEmail: user.email }),
      });
      const data = await res.json();
      setPlans(data.plans || []);
    };

    fetchPlans();
  }, []);

  return (
    <div className="max-w-3xl mx-auto mt-10 p-4">
      <h2 className="text-2xl font-bold mb-4">Your Past Plans</h2>
      {plans.length === 0 ? (
        <p>No plans yet.</p>
      ) : (
        plans.map((plan, i) => (
          <div key={i} className="mb-4 p-4 border rounded shadow-sm bg-gray-50 dark:bg-gray-800 whitespace-pre-wrap">
            <p className="text-sm text-gray-500">Generated on: {new Date(plan.timestamp).toLocaleString()}</p>
            <p>{plan.plan}</p>
          </div>
        ))
      )}
    </div>
  );
};

export default PastPlans;
