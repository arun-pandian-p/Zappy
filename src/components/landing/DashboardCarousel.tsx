import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  ChefHat,
  Users,
  BarChart3,
  QrCode,
  CheckCircle2,
  Shield,
} from "lucide-react";

const roles = [
  {
    id: "owner",
    label: "Owner",
    icon: LayoutDashboard,
    title: "Owner Dashboard",
    desc: "Real-time revenue, table turnover, and multi-branch analytics in one view.",
    items: [
      "Today's Revenue",
      "₹48,250",
      "Active Tables",
      "12 / 18",
      "Avg Order Value",
      "₹620",
    ],
  },
  {
    id: "kitchen",
    label: "Kitchen Staff",
    icon: ChefHat,
    title: "Kitchen Display System",
    desc: "Live order queue with prep timers, sorted by table and priority.",
    items: [
      "Table 4",
      "2x Paneer Tikka",
      "Table 7",
      "1x Biryani",
      "Table 2",
      "Ready to Serve",
    ],
  },
  {
    id: "waiter",
    label: "Waiter",
    icon: Users,
    title: "Service Tracker",
    desc: "Assigned tables, order status, and instant notifications when food is ready.",
    items: [
      "Table 9",
      "Order Placed",
      "Table 3",
      "Bill Requested",
      "Table 12",
      "Served",
    ],
  },
  {
    id: "admin",
    label: "Admin Panel",
    icon: Shield,
    title: "Admin Control Center",
    desc: "Manage users, customize settings, set permissions, and view system logs.",
    items: [
      "Active Staff",
      "8 Members",
      "Menu OCR Sync",
      "Success (1.2s)",
      "Printer Status",
      "Online",
    ],
  },
  {
    id: "analytics",
    label: "Analytics",
    icon: BarChart3,
    title: "Insights & Reports",
    desc: "Track top-selling items, peak hours, and customer feedback trends.",
    items: [
      "Top Dish",
      "Chicken Biryani",
      "Peak Hour",
      "8–9 PM",
      "Repeat Visits",
      "34%",
    ],
  },
];

const features = [
  "Real-time sync across devices",
  "Role-based access & permissions",
  "Works on any tablet or phone",
];

const SparklineMini = () => (
  <svg viewBox="0 0 80 24" className="w-16 h-5 opacity-40">
    <path
      d="M0 18 Q8 16 16 14 T32 10 T48 12 T64 6 T80 4"
      fill="none"
      stroke="rgba(96,165,250,0.7)"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
);

export default function DashboardCarousel() {
  const [active, setActive] = useState("owner");
  const [visible, setVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const activeRole = roles.find((r) => r.id === active)!;

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setVisible(true);
      },
      { threshold: 0.15 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="dashboards"
      className="relative py-20 md:py-28 overflow-hidden"
      style={{ background: "#fbfcfc" }}
    >
      {/* Subtle blue gradient backdrop */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 50% 40%, rgba(37,99,235,0.03) 0%, transparent 70%)",
        }}
      />

      <div className="relative z-10 container mx-auto px-4 sm:px-6">
        {/* ── Header ── */}
        <div
          className={`text-center mb-12 md:mb-16 transition-all duration-700 ease-out ${
            visible
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-8"
          }`}
        >
          <div className="inline-flex items-center gap-2 mb-4">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500" />
            </span>
            <span className="text-xs font-semibold tracking-widest uppercase text-blue-600">
              Role-Based Views
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-slate-900 mb-3 tracking-tight">
            Powerful{" "}
            <span className="bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent">
              Dashboards
            </span>
          </h2>
          <p className="text-slate-500 text-base sm:text-lg max-w-xl mx-auto leading-relaxed">
            Purpose-built interfaces for every role in your restaurant.
          </p>
        </div>

        {/* ── Role Tab Switcher ── */}
        <div
          className={`flex justify-center mb-12 md:mb-16 transition-all duration-700 delay-150 ease-out ${
            visible
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-8"
          }`}
        >
          <div className="inline-flex flex-wrap justify-center gap-1 bg-[#0B1220] rounded-full p-1.5 shadow-lg shadow-blue-900/10 border border-slate-800/80">
            {roles.map((role) => {
              const Icon = role.icon;
              const isActive = active === role.id;
              return (
                <button
                  key={role.id}
                  onClick={() => setActive(role.id)}
                  className="relative flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-300 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                  style={
                    isActive
                      ? {
                          background:
                            "linear-gradient(135deg, #60a5fa 0%, #2563eb 100%)",
                          color: "#ffffff",
                          boxShadow: "0 0 24px rgba(37,99,235,0.4)",
                        }
                      : { color: "rgba(191,219,254,0.55)" }
                  }
                  onMouseEnter={(e) => {
                    if (!isActive)
                      (e.currentTarget as HTMLButtonElement).style.color =
                        "rgba(191,219,254,0.9)";
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive)
                      (e.currentTarget as HTMLButtonElement).style.color =
                        "rgba(191,219,254,0.55)";
                  }}
                >
                  <Icon size={16} />
                  <span className="hidden sm:inline">{role.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Content Grid ── */}
        <div
          className={`grid md:grid-cols-2 gap-8 md:gap-12 items-center max-w-5xl mx-auto transition-all duration-700 delay-300 ease-out ${
            visible
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-8"
          }`}
        >
          {/* Left: Description */}
          <AnimatePresence mode="wait">
            <motion.div
              key={active + "-text"}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            >
              <h3 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-3">
                {activeRole.title}
              </h3>
              <p className="text-slate-500 mb-6 leading-relaxed text-base sm:text-lg">
                {activeRole.desc}
              </p>
              <ul className="space-y-3">
                {features.map((feat, i) => (
                  <motion.li
                    key={feat}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{
                      delay: 0.15 + i * 0.08,
                      duration: 0.4,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                    className="flex items-center gap-3 text-slate-700"
                  >
                    <CheckCircle2
                      className="text-blue-500 shrink-0"
                      size={20}
                    />
                    <span className="text-sm sm:text-base">{feat}</span>
                  </motion.li>
                ))}
              </ul>
            </motion.div>
          </AnimatePresence>

          {/* Right: Dashboard Mockup */}
          <div className="relative">
            {/* Ambient glow */}
            <div
              className="absolute inset-0 rounded-3xl blur-3xl pointer-events-none"
              style={{
                background:
                  "linear-gradient(135deg, rgba(37,99,235,0.08) 0%, transparent 60%)",
              }}
            />

            <div
              className="relative rounded-3xl p-5 sm:p-6 shadow-2xl overflow-hidden min-h-[340px] border border-slate-800/80"
              style={{ background: "#0B1220" }}
            >
              {/* Orbit rings */}
              <div
                className="absolute -right-16 -bottom-16 w-64 h-64 rounded-full pointer-events-none"
                style={{ border: "1px solid rgba(37,99,235,0.15)" }}
              />
              <div
                className="absolute -right-8 -bottom-8 w-44 h-44 rounded-full pointer-events-none"
                style={{ border: "1px solid rgba(37,99,235,0.08)" }}
              />
              <div
                className="absolute -left-10 -top-10 w-32 h-32 rounded-full pointer-events-none"
                style={{ border: "1px solid rgba(37,99,235,0.06)" }}
              />

              {/* Header bar */}
              <div className="flex items-center justify-between mb-5 relative z-10">
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{
                      background:
                        "linear-gradient(135deg, #60a5fa 0%, #2563eb 100%)",
                    }}
                  >
                    <QrCode size={15} color="#ffffff" strokeWidth={2.5} />
                  </div>
                  <span className="text-white font-semibold text-sm tracking-wide">
                    Zappy
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <SparklineMini />
                  <span
                    className="text-xs px-3 py-1 rounded-full font-medium flex items-center gap-1.5"
                    style={{
                      background: "rgba(37,99,235,0.15)",
                      color: "#60a5fa",
                    }}
                  >
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-blue-400" />
                    </span>
                    Live
                  </span>
                </div>
              </div>

              {/* Active role label */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={active + "-label"}
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  transition={{ duration: 0.3 }}
                  className="mb-4 relative z-10"
                >
                  <span
                    className="text-[10px] font-semibold tracking-[0.15em] uppercase"
                    style={{ color: "rgba(191,219,254,0.4)" }}
                  >
                    {activeRole.title}
                  </span>
                </motion.div>
              </AnimatePresence>

              {/* Data rows */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={active + "-rows"}
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                  variants={{
                    visible: { transition: { staggerChildren: 0.07 } },
                    hidden: {},
                  }}
                  className="space-y-2.5 relative z-10"
                >
                  {activeRole.items.map((item, i) =>
                    i % 2 === 0 ? (
                      <motion.div
                        key={`${active}-${i}`}
                        variants={{
                          hidden: { opacity: 0, x: 24 },
                          visible: { opacity: 1, x: 0 },
                        }}
                        transition={{
                          duration: 0.4,
                          ease: [0.22, 1, 0.36, 1],
                        }}
                        className="flex items-center justify-between rounded-xl px-4 py-3"
                        style={{
                          background: "rgba(255,255,255,0.05)",
                          backdropFilter: "blur(8px)",
                        }}
                      >
                        <span
                          className="text-sm"
                          style={{ color: "rgba(191,219,254,0.6)" }}
                        >
                          {item}
                        </span>
                        <span className="text-white font-semibold text-sm">
                          {activeRole.items[i + 1]}
                        </span>
                      </motion.div>
                    ) : null
                  )}
                </motion.div>
              </AnimatePresence>

              {/* Bottom gradient fade */}
              <div
                className="absolute bottom-0 left-0 right-0 h-16 pointer-events-none"
                style={{
                  background:
                    "linear-gradient(to top, #0B1220 0%, transparent 100%)",
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
