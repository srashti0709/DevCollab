
import { useState } from "react";
import {
    BrowserRouter,
    Navigate,
    Route,
    Routes,
} from "react-router-dom";

import DarkLogin from "./components/DarkLogin";
import LightLogin from "./components/LightLogin";
import ProtectedRoute from "./components/ProtectedRoute";
import IssueDetails from "./pages/IssueDetails";
import { AuthProvider } from "./context/AuthContext";

import Dashboard from "./pages/Dashboard";
import AccountSettings from "./pages/AccountSettings";
import SavedIssues from "./pages/SavedIssues";
import Issues from "./pages/Issues";
import Repositories from "./pages/Repositories";
import RepositoryDetails from "./pages/RepositoryDetails";
import PullRequests from "./pages/PullRequests";
import PullRequestDetails from "./pages/PullRequestDetails";
function LoginPage() {
    const [dark, setDark] = useState(true);

    const handleToggleTheme = () => {
        setDark((current) => !current);
    };

    return dark ? (
        <DarkLogin onToggleTheme={handleToggleTheme} />
    ) : (
        <LightLogin onToggleTheme={handleToggleTheme} />
    );
}

function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <Routes>
                    <Route path="/login" element={<LoginPage />} />

                    <Route element={<ProtectedRoute />}>
                        <Route path="/dashboard" element={<Dashboard />} />
                        <Route path="/settings" element={<AccountSettings />} />
                        <Route path="/issues" element={<Issues />} />
                        <Route path="/repositories" element={<Repositories />} />
                        <Route
                            path="/repositories/:repositoryId"
                            element={<RepositoryDetails />}
                        />
                        <Route
                            path="/repositories/:repositoryId/issues/:issueNumber"
                            element={<IssueDetails />}
                        />
                        <Route path="/saved-issues" element={<SavedIssues />} />
                        <Route path="/pull-requests" element={<PullRequests />} />
                        <Route
                            path="/repositories/:repositoryId/pull-requests/:pullRequestNumber"
                            element={<PullRequestDetails />}
                        />
                    </Route>

                    <Route path="/" element={<Navigate to="/login" replace />} />

                    <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Routes>
            </AuthProvider>
        </BrowserRouter>
    );
}

export default App;
