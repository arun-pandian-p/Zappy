import { useLocation, useNavigate, Link } from "react-router-dom";
import { useEffect } from "react";
import { Home, ArrowLeft, UtensilsCrossed } from "lucide-react";
import { Button } from "@/components/ui/button";
import notFoundGif from "@/assets/404-food.gif";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-muted/30 to-background flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Subtle background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-500/10 dark:bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-md w-full text-center space-y-6 relative z-10">
        {/* Animated 404 Roti GIF */}
        <div className="relative group mx-auto inline-block">
          <div className="absolute -inset-2 bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-yellow-500/10 rounded-3xl blur-xl opacity-60 group-hover:opacity-100 transition-opacity" />
          <img
            src={notFoundGif}
            alt="404 - Page Not Found"
            className="w-full max-w-[360px] sm:max-w-[420px] h-auto rounded-2xl shadow-xl border border-border/60 bg-card object-contain mx-auto"
          />
        </div>

        {/* Messaging */}
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
            This dish is off the menu!
          </h1>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed">
            The table or recipe you're looking for doesn't exist or has been moved to another station.
          </p>
          {location.pathname && (
            <p className="text-xs font-mono text-muted-foreground/70 bg-muted/60 py-1 px-3 rounded-full inline-block">
              {location.pathname}
            </p>
          )}
        </div>

        {/* Navigation CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Button
            asChild
            size="lg"
            className="w-full sm:w-auto font-semibold gap-2 shadow-md bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            <Link to="/">
              <Home className="w-4 h-4" />
              Return to Home
            </Link>
          </Button>

          <Button
            variant="outline"
            size="lg"
            onClick={() => {
              if (window.history.length > 1) {
                navigate(-1);
              } else {
                navigate("/");
              }
            }}
            className="w-full sm:w-auto font-semibold gap-2 border-border/80 hover:bg-muted"
          >
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </Button>
        </div>

        <div className="pt-6 flex items-center justify-center gap-1.5 text-xs text-muted-foreground/60">
          <UtensilsCrossed className="w-3.5 h-3.5" />
          <span>Zappy Restaurant OS</span>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
