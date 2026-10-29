package com.zappy.controller;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import java.time.Year;
import java.util.List;

/**
 * Spring Boot 3.x Controller for Zappy Restaurant OS Landing Page.
 * Replaces React / TypeScript LandingPage.tsx and its subcomponents.
 */
@Controller
public class LandingController {

    // Data records for Thymeleaf template rendering
    public record NavLink(String label, String href) {}
    public record StatItem(String value, String label, String description, String icon) {}
    public record HeroData(String headline, String subtitle, String ctaText, List<StatItem> stats) {}
    public record PainPoint(String badge, String title, String description, String icon, String color) {}
    public record SolutionStep(String number, String title, String description, String icon) {}
    public record FeatureItem(String title, String description, String icon, String glowColor) {}
    public record SolutionCapability(String id, String badge, String title, String description, String icon, String href, List<String> highlights) {}
    public record Testimonial(String quote, String author, String role, int stars) {}
    public record FaqItem(String question, String answer) {}
    public record FooterLink(String name, String href) {}
    public record FooterSection(String title, List<FooterLink> links) {}

    @GetMapping("/")
    public String index(Model model) {
        // 1. Navigation Links
        List<NavLink> navLinks = List.of(
            new NavLink("Problem", "#problem"),
            new NavLink("Solution", "#solution"),
            new NavLink("Features", "#features"),
            new NavLink("Solutions", "#capabilities"),
            new NavLink("Results", "#proof"),
            new NavLink("FAQ", "#faq")
        );

        // 2. Hero Section Data
        List<StatItem> heroStats = List.of(
            new StatItem("100+", "Restaurants", "Active dining venues", "utensils"),
            new StatItem("99.9%", "Uptime", "Enterprise cloud availability", "shield"),
            new StatItem("24/7", "Support", "Dedicated restaurant hotline", "headphones"),
            new StatItem("AI", "Powered", "Smart OCR & automated food media", "sparkles")
        );
        HeroData hero = new HeroData(
            "Run Your Entire Restaurant from One Dashboard",
            "Orders, Tables, Kitchen, Staff, Inventory, Billing, Analytics and Marketing — all powered by ZAPPY.",
            "Start Free Trial",
            heroStats
        );

        // 3. Problem Section (from sections/Problem.tsx)
        List<PainPoint> painPoints = List.of(
            new PainPoint(
                "Feedback Churn",
                "The Silent Loss of Guest Retention",
                "Unhappy guests leave silently without giving you a chance to recover. Their feedback ends up as damaging public reviews on Google or Yelp, eroding your brand reputation.",
                "smartphone",
                "from-red-500/20 to-orange-500/10"
            ),
            new PainPoint(
                "Labor Overhead",
                "Fragmented Order Bottlenecks",
                "Waiters waste critical minutes walking to tables, writing orders manually, and typing them into legacy POS systems. Meanwhile, guests wait, tables turn slower, and orders are miscommunicated.",
                "clock",
                "from-amber-500/20 to-orange-500/10"
            ),
            new PainPoint(
                "Revenue Leakage",
                "Billing and POS Desynchronization",
                "Legacy POS hardware keeps data in silos. Reconciling digital payments, split tabs, and paper receipts is a manual nightmare that slows down guest exits and causes accounting discrepancies.",
                "alert",
                "from-rose-500/20 to-red-500/10"
            )
        );

        // 4. Solution Ecosystem Flow (from sections/Solution.tsx)
        List<SolutionStep> solutionSteps = List.of(
            new SolutionStep(
                "01",
                "Scan Table QR & Pick Seat",
                "Customers scan the unique table QR code, pick their specific seat, and are instantly authenticated with a persistent device ID.",
                "qrcode"
            ),
            new SolutionStep(
                "02",
                "Order & Generate Token",
                "Guests build their order, request kitchen mods, and place it. Zappy instantly generates an order token (e.g. #023) for simple tracking.",
                "clipboard"
            ),
            new SolutionStep(
                "03",
                "Kitchen Receives & Prepares",
                "The order syncs directly to the Kitchen Display System (KDS). Status flows automatically: New → Accepted → Preparing → Ready → Served.",
                "utensils"
            ),
            new SolutionStep(
                "04",
                "Live Tracking & Call Waiter",
                "Guests track their live progress timeline via real-time alerts. If they need assistance, they can call a waiter to their exact table in one tap.",
                "bell"
            ),
            new SolutionStep(
                "05",
                "Instant Billing & Feedback",
                "When finished, customers view their billing summary, settle payments, and submit reviews which feed directly into your Reputation Center.",
                "receipt"
            )
        );

        // 5. Core Platform Features (from sections/Features.tsx)
        List<FeatureItem> features = List.of(
            new FeatureItem(
                "Smart QR Seat Selection",
                "Provide an intuitive dining flow. Guests scan a table QR code and select a specific seat (1-N) with persistent device recognition for future visits.",
                "qrcode",
                "hover:shadow-blue-500/10"
            ),
            new FeatureItem(
                "Chef-Inspired KDS Dashboard",
                "Ensure accurate preparation pacing. The Kitchen Display System dynamically lists live tokens, order items, seat pairings, and tracking state updates.",
                "monitor",
                "hover:shadow-indigo-500/10"
            ),
            new FeatureItem(
                "Unified Live Analytics",
                "Analyze food ratings, review volume, and ticket trends. Spot peak hours and table turnover stats instantly using automated reports.",
                "barchart",
                "hover:shadow-blue-500/10"
            ),
            new FeatureItem(
                "Reputation Center Manager",
                "Capture critical feedback before guest exit. Auto-compute ratings, extract sentiment analysis, and trigger recovery flows for ratings under 3 stars.",
                "heart",
                "hover:shadow-rose-500/10"
            ),
            new FeatureItem(
                "Robust Security & RLS",
                "Protect billing data and user details. Powered by enterprise security policies, ensuring authenticated and guest records remain isolated.",
                "shield",
                "hover:shadow-emerald-500/10"
            ),
            new FeatureItem(
                "Real-Time Table Timers",
                "Never miss a late table or order block. Live timers display table duration and average preparation latency to maximize operational throughput.",
                "compass",
                "hover:shadow-blue-500/10"
            )
        );

        // 6. Deep-Dive Capabilities & Solutions (from src/pages/landing/ 10 subpages)
        List<SolutionCapability> capabilities = List.of(
            new SolutionCapability(
                "menu-ocr",
                "AI Digitization",
                "AI Restaurant Menu OCR",
                "Transform printed paper menus and PDFs into digital, editable QR menus in seconds. Proprietary neural OCR understands complex multi-column typography, dishes, modifiers, and prices.",
                "camera",
                "#menu-ocr",
                List.of("Zero manual typing", "Automatic price & modifier extraction", "Multi-column layout understanding")
            ),
            new SolutionCapability(
                "ai-food-images",
                "Visual Dining",
                "AI Food Image Generator",
                "Generate mouth-watering, photorealistic food photography for every dish on your menu. Increase ticket conversion by 20% without hiring expensive food photographers.",
                "sparkles",
                "#ai-food-images",
                List.of("Photorealistic dish generation", "Brand aesthetic consistency", "20%+ higher dish conversion")
            ),
            new SolutionCapability(
                "digital-menu",
                "Customer Experience",
                "Interactive Digital Menu Software",
                "A visual, high-speed ordering interface that runs in any mobile browser without downloads. Features allergen filters, multi-language translation, and seat isolation.",
                "smartphone",
                "#digital-menu",
                List.of("No app downloads needed", "Dietary & allergy filtering", "Instant multi-language translation")
            ),
            new SolutionCapability(
                "qr-generator",
                "Table Tech",
                "Custom QR Menu Generator",
                "Generate vector-ready branded QR codes embedded with your restaurant logo. Table-specific routing connects guests directly to their exact seating zone.",
                "qrcode",
                "#qr-generator",
                List.of("Custom logos & branded styling", "Per-table seat routing", "Vector SVG/EPS downloads")
            ),
            new SolutionCapability(
                "menu-management",
                "Multi-Outlet",
                "Centralized Menu Management",
                "Manage multi-branch menus from a unified command center. Instantly update prices, 86 sold-out ingredients, and deploy seasonal specials across all outlets.",
                "layers",
                "#menu-management",
                List.of("Single source of truth", "Real-time 86/stock synchronization", "Multi-location franchise overrides")
            ),
            new SolutionCapability(
                "guest-experience",
                "Hospitality",
                "Five-Star Guest Experience",
                "Eliminate dining bottlenecks. Give diners one-tap access to waiter paging, water refills, instant bill splitting, and digital payment receipts.",
                "heart",
                "#guest-experience",
                List.of("Zero waiting time to order", "One-tap waiter summoning", "Seamless digital bill split & pay")
            )
        );

        // 7. Proof & Results (from sections/Proof.tsx)
        List<StatItem> proofStats = List.of(
            new StatItem("+22%", "Avg. Ticket Value", "Smart upsells and seamless re-ordering increase guest spending.", "trending"),
            new StatItem("-30%", "Table Turn Time", "Instant seat QR ordering and rapid billing speed up checkout cycles.", "zap"),
            new StatItem("94%", "Staff Satisfaction", "Reduced manual coordination stress, leading to better gratuities.", "users")
        );

        List<Testimonial> testimonials = List.of(
            new Testimonial(
                "Integrating Zappy completely changed our dinner rush. Orders reach the kitchen instantly, billing is frictionless, and our average checkout time dropped by over 4 minutes per table.",
                "Elena Rostova",
                "General Manager, Bistro L'Avenue",
                5
            ),
            new Testimonial(
                "The reputation engine and recovery flow are pure gold. Catching unhappy diners before they walk out the door saved us from multiple negative online reviews.",
                "Marcus Vance",
                "Owner, Smokehouse Grill Group",
                5
            )
        );

        // 8. Frequently Asked Questions (from FAQSection.tsx)
        List<FaqItem> faqs = List.of(
            new FaqItem(
                "Do my customers need to download an app?",
                "No! ZAPPY works entirely in the browser. Customers simply scan the QR code and the menu opens instantly — no downloads, no sign-ups required."
            ),
            new FaqItem(
                "How long does it take to set up?",
                "You can be up and running in under 15 minutes. Just create your account, add your menu items, configure your tables, and print QR codes."
            ),
            new FaqItem(
                "Can I customize the menu design for my brand?",
                "Absolutely. You can set your logo, brand colors, fonts, cover images, and even a custom splash screen animation for your restaurant."
            ),
            new FaqItem(
                "Does it work with my existing POS or printer?",
                "ZAPPY supports Bluetooth and USB thermal printers (ESC/POS compatible). POS integration is available on the Enterprise plan."
            ),
            new FaqItem(
                "Is my data secure?",
                "Yes. We use enterprise-grade encryption, row-level security policies, and role-based access control to keep your restaurant data safe."
            ),
            new FaqItem(
                "Can I manage multiple restaurant locations?",
                "Yes, our Enterprise plan supports multi-location management with a unified super-admin dashboard for all your outlets."
            )
        );

        // 9. Footer Columns & Links (from Footer.tsx)
        List<FooterSection> footerSections = List.of(
            new FooterSection("PRODUCT", List.of(
                new FooterLink("Core Features", "#features"),
                new FooterLink("AI Menu OCR", "#capabilities"),
                new FooterLink("AI Food Images", "#capabilities"),
                new FooterLink("Guest Experience", "#capabilities")
            )),
            new FooterSection("SOLUTIONS", List.of(
                new FooterLink("Menu Management", "#capabilities"),
                new FooterLink("Digital Menu", "#capabilities"),
                new FooterLink("Restaurant OCR", "#capabilities"),
                new FooterLink("QR Generator", "#capabilities")
            )),
            new FooterSection("COMPANY", List.of(
                new FooterLink("About Us", "#about"),
                new FooterLink("Careers", "#careers"),
                new FooterLink("Product Tour", "javascript:openTourModal()"),
                new FooterLink("Book Demo", "javascript:openDemoModal()")
            ))
        );

        // Push model attributes to Thymeleaf
        model.addAttribute("navLinks", navLinks);
        model.addAttribute("hero", hero);
        model.addAttribute("painPoints", painPoints);
        model.addAttribute("solutionSteps", solutionSteps);
        model.addAttribute("features", features);
        model.addAttribute("capabilities", capabilities);
        model.addAttribute("proofStats", proofStats);
        model.addAttribute("testimonials", testimonials);
        model.addAttribute("faqs", faqs);
        model.addAttribute("footerSections", footerSections);
        model.addAttribute("currentYear", Year.now().getValue());

        return "landing";
    }

    @PostMapping("/book-demo")
    public String bookDemo(
            @RequestParam("name") String name,
            @RequestParam("restaurantName") String restaurantName,
            @RequestParam("phone") String phone,
            @RequestParam("email") String email,
            @RequestParam(value = "branches", defaultValue = "1") int branches,
            @RequestParam("city") String city,
            RedirectAttributes redirectAttributes) {

        // Business logic to persist demo lead
        redirectAttributes.addFlashAttribute("demoSuccess", true);
        redirectAttributes.addFlashAttribute("leadName", name);
        return "redirect:/#demo-success";
    }

    @PostMapping("/subscribe")
    public String subscribeNewsletter(
            @RequestParam("email") String email,
            RedirectAttributes redirectAttributes) {

        // Business logic to store subscriber
        redirectAttributes.addFlashAttribute("subscribed", true);
        return "redirect:/#subscribed";
    }
}

