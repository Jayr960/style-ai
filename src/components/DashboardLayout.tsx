import { useState, useEffect } from "react";
import { useNavigate, useLocation, Outlet } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Home, Shirt, Sparkles, CalendarDays, ShoppingBag, LogOut, Menu, X, ChevronLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

const navItems = [
  { icon: Home, label: "Dashboard", path: "/dashboard" },
  { icon: Shirt, label: "Wardrobe", path: "/dashboard/wardrobe" },
  { icon: Sparkles, label: "Outfits", path: "/dashboard/outfits" },
  { icon: CalendarDays, label: "Planner", path: "/dashboard/planner" },
  { icon: ShoppingBag, label: "Shop", path: "/dashboard/shop" },
];

const DashboardLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) navigate("/login");
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) navigate("/login");
    });
    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const isActive = (path: string) =>
    path === "/dashboard" ? location.pathname === "/dashboard" : location.pathname.startsWith(path);

  return (
    <div className="flex min-h-screen">
      {/* Desktop Sidebar */}
      <motion.aside
        className="glass fixed left-0 top-0 z-30 hidden h-screen flex-col border-r border-border md:flex"
        animate={{ width: collapsed ? 72 : 240 }}
        transition={{ duration: 0.3, ease: [0.2, 0, 0, 1] }}
      >
        <div className="relative z-10 flex h-full flex-col">
          <div className="flex items-center justify-between p-4">
            {!collapsed && <span className="text-lg font-bold tracking-tighter gradient-text">FitAI</span>}
            <button onClick={() => setCollapsed(!collapsed)} className="rounded-lg p-1.5 text-muted-foreground hover:text-foreground">
              <ChevronLeft className={cn("h-4 w-4 transition-transform", collapsed && "rotate-180")} strokeWidth={1.5} />
            </button>
          </div>

          <nav className="mt-4 flex flex-1 flex-col gap-1 px-3">
            {navItems.map((item) => (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                  isActive(item.path)
                    ? "bg-gradient-to-r from-violet/20 to-coral/10 text-foreground"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                )}
              >
                <item.icon className={cn("h-5 w-5 shrink-0", isActive(item.path) && "text-violet")} strokeWidth={1.5} />
                {!collapsed && <span>{item.label}</span>}
                {isActive(item.path) && (
                  <motion.div
                    layoutId="sidebar-active"
                    className="absolute left-0 h-8 w-0.5 rounded-r-full bg-gradient-to-b from-violet to-coral"
                  />
                )}
              </button>
            ))}
          </nav>

          <div className="border-t border-border p-3">
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              <LogOut className="h-5 w-5 shrink-0" strokeWidth={1.5} />
              {!collapsed && <span>Sign Out</span>}
            </button>
          </div>
        </div>
      </motion.aside>

      {/* Mobile Bottom Nav */}
      <nav className="glass fixed bottom-0 left-0 right-0 z-30 flex items-center justify-around border-t border-border py-2 md:hidden">
        {navItems.map((item) => (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className={cn(
              "flex flex-col items-center gap-1 px-3 py-1 text-xs transition-colors",
              isActive(item.path) ? "text-foreground" : "text-muted-foreground"
            )}
          >
            <item.icon className={cn("h-5 w-5", isActive(item.path) && "text-violet")} strokeWidth={1.5} />
            <span>{item.label}</span>
            {isActive(item.path) && (
              <motion.div layoutId="mobile-active" className="h-0.5 w-4 rounded-full bg-gradient-to-r from-violet to-coral" />
            )}
          </button>
        ))}
      </nav>

      {/* Main Content */}
      <main className={cn("flex-1 pb-20 md:pb-0", collapsed ? "md:ml-[72px]" : "md:ml-[240px]")}>
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
