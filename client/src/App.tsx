import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import AdminDashboard from "@/pages/AdminDashboard";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import JournalPost from "./pages/JournalPost";
import Commission from "./pages/Commission";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/commission" component={Commission} />
      <Route path="/journal/:slug" component={JournalPost} />
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/admin/canvases" component={AdminDashboard} />
      <Route path="/admin/events" component={AdminDashboard} />
      <Route path="/admin/journal" component={AdminDashboard} />
      <Route path="/admin/images" component={AdminDashboard} />
      <Route path="/admin/enquiries" component={AdminDashboard} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster position="bottom-right" />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
