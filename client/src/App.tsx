// ABOUTME: App shell and client routes.
import { Route, Routes } from "react-router-dom";
import "./App.css";
import { NavBar } from "./components/NavBar";
import { FrysReview } from "./pages/FrysReview";
import { Groceries } from "./pages/Groceries";
import { ImportRecipe } from "./pages/ImportRecipe";
import { RecipeDetail } from "./pages/RecipeDetail";
import { RecipeForm } from "./pages/RecipeForm";
import { RecipeLibrary } from "./pages/RecipeLibrary";
import { Settings } from "./pages/Settings";
import { ThisWeek } from "./pages/ThisWeek";

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
          <Route path="/recipes/new" element={<RecipeForm />} />
          <Route path="/recipes/import" element={<ImportRecipe />} />
          <Route path="/recipes/:id" element={<RecipeDetail />} />
          <Route path="/recipes/:id/edit" element={<RecipeForm />} />
          <Route path="/this-week" element={<ThisWeek />} />
          <Route path="/groceries" element={<Groceries />} />
          <Route path="/frys" element={<FrysReview />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
