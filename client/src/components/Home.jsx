const Home = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-blue-100 to-white px-4 text-center">
      <h1 className="text-5xl font-extrabold mb-6 text-gray-800">
        AI Fitness & Diet Coach
      </h1>
      <p className="text-lg text-gray-600 max-w-2xl mb-8">
        Get personalized fitness and nutrition plans powered by AI. Track your progress and receive intelligent insights — all in one place.
      </p>
      <a
        href="/auth"
        className="bg-blue-600 text-white px-8 py-3 rounded-lg text-lg font-semibold shadow-md hover:bg-blue-700 transition"
      >
        Get Started
      </a>
    </div>
  );
};

export default Home;
