import { Route, Routes } from "react-router-dom";
import "./App.css";
import { NavBar } from "./components/NavBar";
import { AddRecipe } from "./pages/AddRecipe";
import { Groceries } from "./pages/Groceries";
import { RecipeLibrary } from "./pages/RecipeLibrary";

function App() {
  return (
    <div className="app-shell">
      <header>
        <h1>MealFlow</h1>
        <NavBar />
      </header>
      <main>
        <Routes>
          <Route path="/" element={<RecipeLibrary />} />
          <Route path="/add-recipe" element={<AddRecipe />} />
          <Route path="/groceries" element={<Groceries />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
