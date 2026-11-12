
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Dashboard() {
  const { user } = useAuth();

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-10 text-white sm:px-10">
      <div className="mx-auto max-w-6xl">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              DevCollab
            </h1>
            <p className="mt-1 text-sm text-slate-400">
              Developer Collaboration Platform
            </p>
          </div>

          <Link
            to="/settings"
            className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-indigo-400 hover:text-white"
          >
            Account Settings
          </Link>
        </header>

        <section className="mt-16">
          <p className="text-sm font-medium text-indigo-400">
            YOUR WORKSPACE
          </p>

          <h2 className="mt-3 text-3xl font-bold">
            Welcome, {user?.displayName || "Developer"}!
          </h2>

          <p className="mt-3 max-w-xl text-slate-400">
            Your DevCollab account is ready. Your developer workspace
            will take shape here as we build the platform.
          </p>
        </section>
      </div>
    </main>
  );
}

export default Dashboard;
