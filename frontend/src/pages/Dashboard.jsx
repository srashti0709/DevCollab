
import { useRef } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/* ------------------------------------------------------------------ */
/* Keyframes live here so no tailwind.config changes are needed.       */
/* ------------------------------------------------------------------ */
const styles = `
@keyframes dc-cell {
  from { opacity: 0; transform: scale(0.4); }
  to   { opacity: 1; transform: scale(1); }
}
@keyframes dc-grid-move {
  from { background-position: 0 0; }
  to   { background-position: 0 56px; }
}
@keyframes dc-rise {
  from { opacity: 0; transform: translate3d(0, 22px, 0); }
  to   { opacity: 1; transform: translate3d(0, 0, 0); }
}
@keyframes dc-pulse {
  0%, 100% { opacity: 0.55; }
  50%      { opacity: 1; }
}

.dc-rise  { opacity: 0; animation: dc-rise 0.8s cubic-bezier(0.22, 1, 0.36, 1) forwards; }
.dc-cell  { opacity: 0; animation: dc-cell 0.45s cubic-bezier(0.22, 1, 0.36, 1) forwards; }
.dc-grid  { animation: dc-grid-move 3s linear infinite; }
.dc-pulse { animation: dc-pulse 3s ease-in-out infinite; }

@media (prefers-reduced-motion: reduce) {
  .dc-rise, .dc-cell { opacity: 1; animation: none; }
  .dc-grid, .dc-pulse { animation: none; }
}
`;

/* ------------------------------------------------------------------ */
/* 3D tilt card with a cursor-following glare                          */
/* ------------------------------------------------------------------ */
function TiltCard({ children, className = "" }) {
    const ref = useRef(null);

    const handleMove = (e) => {
        const el = ref.current;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width;
        const y = (e.clientY - rect.top) / rect.height;
        el.style.transform = `perspective(900px) rotateX(${(0.5 - y) * 10}deg) rotateY(${(x - 0.5) * 12}deg) translateZ(8px)`;
        el.style.setProperty("--mx", `${x * 100}%`);
        el.style.setProperty("--my", `${y * 100}%`);
    };

    const handleLeave = () => {
        const el = ref.current;
        if (!el) return;
        el.style.transform =
            "perspective(900px) rotateX(0deg) rotateY(0deg) translateZ(0)";
    };

    return (
        <div
            ref={ref}
            onMouseMove={handleMove}
            onMouseLeave={handleLeave}
            className={`group relative overflow-hidden rounded-2xl border border-white/10 bg-slate-900/60 p-6 backdrop-blur-sm transition-[transform,border-color] duration-200 ease-out will-change-transform hover:border-indigo-400/50 ${className}`}
            style={{ transformStyle: "preserve-3d" }}
        >
            <div
                className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                style={{
                    background:
                        "radial-gradient(320px circle at var(--mx, 50%) var(--my, 50%), rgba(129,140,248,0.22), transparent 60%)",
                }}
            />
            <div className="relative">{children}</div>
        </div>
    );
}

/* ------------------------------------------------------------------ */
/* GitHub activity preview (flat)                                      */
/* ------------------------------------------------------------------ */
const WEEKS = 18;
const levelClasses = [
    "bg-slate-800",
    "bg-emerald-900",
    "bg-emerald-700",
    "bg-emerald-500",
    "bg-emerald-300",
];

// Stable sample data so the preview looks the same on every render.
const cells = Array.from({ length: WEEKS * 7 }, (_, n) => {
    const col = Math.floor(n / 7);
    const row = n % 7;
    const x = Math.sin((col + 1) * 12.9898 + (row + 1) * 78.233) * 43758.5453;
    let f = x - Math.floor(x);
    if (row === 0 || row === 6) f *= 0.55;
    const level = f > 0.88 ? 4 : f > 0.7 ? 3 : f > 0.5 ? 2 : f > 0.3 ? 1 : 0;
    return { col, level };
});

function GithubMark({ className = "" }) {
    return (
        <svg viewBox="0 0 16 16" fill="currentColor" className={className} aria-hidden="true">
            <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
        </svg>
    );
}

function GithubCard() {
    return (
        <div
            className="dc-rise mx-auto w-full max-w-[440px] rounded-2xl border border-white/10 bg-slate-900/70 p-6 shadow-2xl shadow-black/30 backdrop-blur"
            style={{ animationDelay: "0.35s" }}
        >
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-slate-900">
                        <GithubMark className="h-6 w-6" />
                    </div>
                    <div>
                        <h3 className="text-base font-semibold leading-tight">
                            GitHub activity
                        </h3>
                        <p className="text-xs text-slate-400">Not connected</p>
                    </div>
                </div>
                <span className="rounded-full border border-slate-700 px-2.5 py-0.5 text-xs text-slate-400">
                    Sample preview
                </span>
            </div>

            <div
                className="mt-6 grid grid-flow-col grid-rows-7 gap-1"
                style={{ gridAutoColumns: "1fr" }}
                aria-hidden="true"
            >
                {cells.map((c, i) => (
                    <span
                        key={i}
                        className={`dc-cell aspect-square rounded-[3px] ${levelClasses[c.level]}`}
                        style={{ animationDelay: `${0.6 + c.col * 0.035}s` }}
                    />
                ))}
            </div>

            <div className="mt-3 flex items-center justify-end gap-1.5 text-xs text-slate-500">
                <span>Less</span>
                {levelClasses.map((c) => (
                    <span key={c} className={`h-3 w-3 rounded-[3px] ${c}`} />
                ))}
                <span>More</span>
            </div>

            <div className="mt-6 flex items-center justify-between gap-4 border-t border-white/10 pt-5">
                <p className="text-sm text-slate-400">
                    Connect GitHub to see your commits and pull requests here.
                </p>
                <button
                    type="button"
                    className="shrink-0 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-slate-900 transition duration-200 hover:-translate-y-0.5 hover:bg-indigo-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
                >
                    Connect
                </button>
            </div>
        </div>
    );
}

/* ------------------------------------------------------------------ */
/* Quick-start cards                                                   */
/* ------------------------------------------------------------------ */
const iconProps = {
    width: 22,
    height: 22,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round",
    strokeLinejoin: "round",
};

const cards = [
    {
        title: "Start a project",
        text: "Set up a shared space for your repo, tasks and discussions.",
        icon: (
            <svg {...iconProps}>
                <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <path d="M12 11v4M10 13h4" />
            </svg>
        ),
    },
    {
        title: "Invite teammates",
        text: "Bring collaborators in and decide who can see what.",
        icon: (
            <svg {...iconProps}>
                <circle cx="9" cy="8" r="3.5" />
                <path d="M2.5 20a6.5 6.5 0 0 1 13 0" />
                <path d="M19 8v6M16 11h6" />
            </svg>
        ),
    },
    {
        title: "Connect GitHub",
        text: "Link your repositories so pull requests show up here.",
        icon: (
            <svg {...iconProps}>
                <circle cx="6" cy="6" r="2.5" />
                <circle cx="6" cy="18" r="2.5" />
                <circle cx="18" cy="9" r="2.5" />
                <path d="M6 8.5v7M18 11.5c0 3-4 3-10.5 5.2" />
            </svg>
        ),
    },
];

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */
function Dashboard() {
    const { user } = useAuth();
    const name = user?.displayName || "Developer";
    const initial = name.trim().charAt(0).toUpperCase();

    return (
        <main className="relative min-h-screen overflow-hidden bg-slate-950 px-6 py-8 text-white sm:px-10">
            <style>{styles}</style>

            {/* ambient background */}
            <div className="pointer-events-none absolute inset-0">
                <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-indigo-600/20 blur-3xl" />
                <div className="absolute -right-24 top-1/3 h-80 w-80 rounded-full bg-violet-600/15 blur-3xl" />

                {/* perspective grid floor */}
                <div
                    className="absolute inset-x-0 bottom-0 h-[55%]"
                    style={{
                        perspective: "500px",
                        maskImage: "linear-gradient(to top, black 15%, transparent 95%)",
                        WebkitMaskImage: "linear-gradient(to top, black 15%, transparent 95%)",
                    }}
                >
                    <div
                        className="dc-grid absolute -inset-x-1/2 bottom-0 h-[200%] origin-bottom"
                        style={{
                            transform: "rotateX(62deg)",
                            backgroundSize: "56px 56px",
                            backgroundImage:
                                "linear-gradient(to right, rgba(129,140,248,0.22) 1px, transparent 1px), linear-gradient(to bottom, rgba(129,140,248,0.22) 1px, transparent 1px)",
                        }}
                    />
                </div>
            </div>

            <div className="relative mx-auto max-w-6xl">
                {/* header */}
                <header
                    className="dc-rise flex flex-wrap items-center justify-between gap-4"
                    style={{ animationDelay: "0.05s" }}
                >
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 font-mono text-sm font-bold shadow-lg shadow-indigo-500/30">
                            DC
                        </div>
                        <div>
                            <h1 className="text-lg font-bold leading-tight tracking-tight">
                                DevCollab
                            </h1>
                            <p className="text-xs text-slate-400">
                                Developer Collaboration Platform
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <Link
                            to="/issues"
                            className="rounded-lg border border-slate-700 bg-slate-900/60 px-4 py-2 text-sm font-medium text-slate-200 backdrop-blur transition duration-200 hover:-translate-y-0.5 hover:border-indigo-400 hover:text-white hover:shadow-lg hover:shadow-indigo-500/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
                        >
                            Issues
                        </Link>

                        <Link
                            to="/repositories"
                            className="rounded-lg border border-slate-700 bg-slate-900/60 px-4 py-2 text-sm font-medium text-slate-200 backdrop-blur transition duration-200 hover:-translate-y-0.5 hover:border-indigo-400 hover:text-white hover:shadow-lg hover:shadow-indigo-500/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
                        >
                            Repositories
                        </Link>

                        <Link
                            to="/saved-issues"
                            className="rounded-lg border border-slate-700 bg-slate-900/60 px-4 py-2 text-sm font-medium text-slate-200 backdrop-blur transition duration-200 hover:-translate-y-0.5 hover:border-indigo-400 hover:text-white hover:shadow-lg hover:shadow-indigo-500/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
                        >
                            Saved Issues
                        </Link>

                        <Link
                            to="/settings"
                            className="rounded-lg border border-slate-700 bg-slate-900/60 px-4 py-2 text-sm font-medium text-slate-200 backdrop-blur transition duration-200 hover:-translate-y-0.5 hover:border-indigo-400 hover:text-white hover:shadow-lg hover:shadow-indigo-500/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
                        >
                            Account Settings
                        </Link>

                        <div
                            className="flex h-10 w-10 items-center justify-center rounded-full border border-indigo-400/40 bg-indigo-500/20 text-sm font-semibold text-indigo-100"
                            title={name}
                        >
                            {initial}
                        </div>
                    </div>
                </header>

                {/* hero */}
                <section className="mt-14 grid items-center gap-10 lg:mt-20 lg:grid-cols-2">
                    <div>
                        <p
                            className="dc-rise text-sm font-medium text-indigo-400"
                            style={{ animationDelay: "0.15s" }}
                        >
                            Your workspace
                        </p>

                        <h2
                            className="dc-rise mt-3 text-4xl font-bold leading-tight tracking-tight sm:text-5xl"
                            style={{ animationDelay: "0.25s" }}
                        >
                            Welcome back,{" "}
                            <span className="bg-gradient-to-r from-indigo-300 via-violet-300 to-indigo-400 bg-clip-text text-transparent">
                                {name}
                            </span>
                            .
                        </h2>

                        <p
                            className="dc-rise mt-5 max-w-md text-base leading-relaxed text-slate-400"
                            style={{ animationDelay: "0.35s" }}
                        >
                            Your account is ready. Projects, teammates and pull requests
                            will appear here as you add them.
                        </p>

                        <div
                            className="dc-rise mt-8 flex flex-wrap gap-3"
                            style={{ animationDelay: "0.45s" }}
                        >
                            <button
                                type="button"
                                className="rounded-lg bg-indigo-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition duration-200 hover:-translate-y-0.5 hover:bg-indigo-400 hover:shadow-indigo-400/40 active:translate-y-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
                            >
                                Start a project
                            </button>
                            <Link
                                to="/settings"
                                className="rounded-lg border border-slate-700 px-5 py-2.5 text-sm font-semibold text-slate-200 transition duration-200 hover:border-slate-500 hover:bg-slate-800/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
                            >
                                Edit your profile
                            </Link>
                        </div>
                    </div>

                    <GithubCard />
                </section>

                {/* quick start */}
                <section className="mt-16 pb-10 lg:mt-20">
                    <h3
                        className="dc-rise text-lg font-semibold"
                        style={{ animationDelay: "0.6s" }}
                    >
                        Get set up
                    </h3>

                    <div
                        className="dc-rise mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
                        style={{ animationDelay: "0.7s" }}
                    >
                        {cards.map((c) => (
                            <TiltCard key={c.title}>
                                <div className="flex items-start justify-between">
                                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-500/15 text-indigo-300 transition duration-300 group-hover:scale-110 group-hover:bg-indigo-500/25">
                                        {c.icon}
                                    </div>
                                    <span className="rounded-full border border-slate-700 px-2.5 py-0.5 text-xs text-slate-400">
                                        Coming soon
                                    </span>
                                </div>
                                <h4 className="mt-5 text-base font-semibold">{c.title}</h4>
                                <p className="mt-1.5 text-sm leading-relaxed text-slate-400">
                                    {c.text}
                                </p>
                            </TiltCard>
                        ))}
                    </div>
                </section>
            </div>
        </main>
    );
}

export default Dashboard;
