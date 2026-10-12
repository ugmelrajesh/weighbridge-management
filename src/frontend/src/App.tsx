import { Toaster } from "@/components/ui/sonner";
import {
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
  useNavigate,
} from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Layout } from "./components/Layout";
import { PinLock } from "./components/PinLock";
import { Management } from "./pages/Management";
import { NewTransaction } from "./pages/NewTransaction";
import { Transactions } from "./pages/Transactions";
import { store } from "./store/weighbridge";

// Initialize seed data
store.init();

function Root() {
  return (
    <Layout>
      <Outlet />
    </Layout>
  );
}

function HomeRedirect() {
  const navigate = useNavigate();
  useEffect(() => {
    navigate({ to: "/transactions/new" });
  }, [navigate]);
  return null;
}

const rootRoute = createRootRoute({ component: Root });
const dashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: HomeRedirect,
});
const newTxRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/transactions/new",
  component: NewTransaction,
});
const txRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/transactions",
  component: Transactions,
});
const mgmtRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/management",
  component: Management,
});

const routeTree = rootRoute.addChildren([
  dashboardRoute,
  newTxRoute,
  txRoute,
  mgmtRoute,
]);
const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  const [unlocked, setUnlocked] = useState(false);

  if (!unlocked) {
    return (
      <>
        <PinLock onUnlock={() => setUnlocked(true)} />
        <Toaster richColors />
      </>
    );
  }

  return (
    <>
      <RouterProvider router={router} />
      <Toaster richColors />
      <footer className="hidden">
        <a
          href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(typeof window !== "undefined" ? window.location.hostname : "")}`}
        >
          &copy; {new Date().getFullYear()}. Built with love using caffeine.ai
        </a>
      </footer>
    </>
  );
}
