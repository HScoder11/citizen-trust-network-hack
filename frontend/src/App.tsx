function App() {
  return (
    <div className="min-h-screen bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-xl">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">
          Tailwind CSS is working! 🎉
        </h1>
        <p className="text-gray-600">
          You can now use Tailwind classes anywhere in your app.
        </p>
        <button className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
          Click me
        </button>
      </div>
    </div>
  )
}

export default App