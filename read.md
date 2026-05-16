# 🚀 Zappy Enterprise Services Architecture

This document provides a comprehensive summary of the advanced AI and logic engines built within the `src/services/` directory. These services transform Zappy from a basic menu viewer into a **production-grade enterprise restaurant operating system**.

---

## 1. Enterprise Promotion Engine (`src/services/promotions`)

**Core File:** `cartPricingEngine.ts`

The Promotion Engine replaces static, single-discount logic with a dynamic cart pricing rule system capable of complex B2B promotion stacking.

### Features
*   **Smart Stacking & Priority Resolution**: Automatically sorts active promotions by `priority` weight. Evaluates multiple valid offers and resolves conflicts without double-discounting inappropriately.
*   **Granular Targets**: Handles both `cart-wide` (global percentage off) and `item-specific` (discount applies only to certain `target_menu_item_ids`) logic.
*   **Conditionals & Thresholds**: Strict enforcement of `min_order_value` (customer must spend X amount) and `max_discount` (caps the maximum savings amount).
*   **Real-time Math Validation**: Calculates subtotal, applies discount arrays, computes exact tax values on the newly discounted total, and outputs a strict `CartPricingResult` object to the UI.

### Workflow
1. Customer adds items to the cart.
2. `CustomerMenu.tsx` passes the `cart` and all `activePromotions` (fetched via Supabase) to `evaluateCartDiscounts()`.
3. The engine iterates over rules, filters out invalid ones (e.g. cart subtotal < 500), and calculates the exact `discountAmount`.
4. Returns a fully calculated receipt breakdown (Subtotal, Total Discount, Tax, Final Total).

---

## 2. AI Food Graph & Recommendations (`src/services/recommendations`)

**Core File:** `foodGraph.ts`

Inspired by semantic network models (like KitcheNette), this module upgrades Zappy's basic upselling into a personalized, graph-based relationship engine.

### Features
*   **Semantic Tagging**: Menu items are analyzed for metadata tags (e.g., `spicy`, `sweet`, `carb`, `protein`).
*   **Intelligent Pairing Rules**: Detects cart context to suggest the perfect missing element. (e.g., "Customer has a spicy Main Course -> Suggest a sweet/cooling Beverage or Dessert").
*   **Cross-Selling Optimization**: Prevents redundant recommendations. If the user already has a drink, it won't suggest another drink; it will suggest a side or appetizer.
*   **Automated Bundling Concepts**: Lays the foundation for AI-generated combo meals by understanding food compatibility.

### Workflow
1. When a user views an item or proceeds to checkout, the system calls `getSmartRecommendations(cartItems, allMenu)`.
2. The engine scans the current cart's dominant tags (e.g., heavily savory).
3. It filters the remaining menu to find complementary items (e.g., drinks, light sides).
4. Results are ranked by compatibility scores and presented beautifully in the UI as "Perfect Pairings".

---

## 3. Intelligent Review & Reputation Ecosystem (`src/services/reviews`)

**Core Files:** `sentimentAnalysisService.ts`, `recoveryEngine.ts`

This is a proactive damage-control and customer satisfaction engine designed to intercept bad experiences before they reach public platforms like Google Reviews.

### Features
*   **Heuristic Sentiment Analysis**: Evaluates customer text for specific pain points using structured NLP/keyword maps (e.g., `food_cold`, `service_slow`, `price_high`).
*   **Smart Routing Framework**: 
    *   **4-5 Stars**: Automatically prompts the user to share their love on Google Reviews.
    *   **1-3 Stars**: Captures feedback internally to shield public reputation.
*   **Automated Review Recovery**: Unhappy customers are processed by the `recoveryEngine.ts`. Based on severity, it automatically issues unique apology coupons (e.g., "15% off your next visit to make up for the slow service").
*   **Fraud / Spam Detection**: Flags repetitive or nonsensical 1-star reviews for Superadmin moderation before affecting platform metrics.

### Workflow
1. Kitchen marks an order as `Served`.
2. Customer is prompted with a dynamic review modal.
3. If they leave a 2-star review complaining about "cold food", `analyzeReviewSentiment` flags the `cold_food` category.
4. `generateRecoveryPlan` creates a unique promo code (`SORRY-XYZ`).
5. Customer instantly sees an apology overlay with the coupon.
6. The event is logged in the `ReputationCenter` dashboard for the manager to review and mark as "Resolved".

---

## 4. Local Architecture Migration (Replacing Gemini)

As requested, the project's dependency on external Google Gemini APIs has been structurally stripped in favor of localized, robust pipelines.

*   **Offline First**: Crucial operations (like Cart Pricing and Food Pairings) now run entirely via strict TypeScript logic without network lag to an LLM.
*   **OCR & Menu Import**: Re-architected to utilize open-source local processing stacks (e.g., OCRmyPDF / Tesseract) instead of relying on Gemini vision APIs, ensuring absolute privacy and zero recurring API costs for bulk menu ingestion.

---

## Summary of Impact
By centralizing these logics into strict `services/`, Zappy is now highly modular. UI components simply pass data to the engines, ensuring that cart math is always exact, recommendations are always smart, and customer sentiment is always protected.
