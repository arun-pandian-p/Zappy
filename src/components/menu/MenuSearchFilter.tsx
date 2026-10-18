import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Search,
  X,
  SlidersHorizontal,
  Clock,
  Sparkles,
  Leaf,
  Utensils,
  Flame,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Check,
  RotateCcw,
  UtensilsCrossed,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import type { MenuItem } from "@/hooks/useMenuItems";

export interface MenuFilterOptions {
  dietary: "all" | "veg" | "non-veg" | "vegan";
  popularOnly: boolean;
  sortBy: "default" | "price-asc" | "price-desc" | "name-asc";
}

export const DEFAULT_MENU_FILTERS: MenuFilterOptions = {
  dietary: "all",
  popularOnly: false,
  sortBy: "default",
};

interface MenuSearchFilterProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  filters: MenuFilterOptions;
  onFiltersChange: (filters: MenuFilterOptions) => void;
  menuItems: MenuItem[];
  categories?: { id: string; name: string }[];
  currencySymbol?: string;
  restaurantId?: string;
  onSelectMenuItem?: (item: MenuItem) => void;
  onSelectCategory?: (categoryName: string) => void;
  filteredCount?: number;
  inputRef?: React.RefObject<HTMLInputElement>;
}

// Local storage key helper
const getStorageKey = (restaurantId?: string) =>
  `ashnora_recent_searches_${restaurantId || "default"}`;

export function MenuSearchFilter({
  searchQuery,
  onSearchChange,
  filters,
  onFiltersChange,
  menuItems,
  categories = [],
  currencySymbol = "₹",
  restaurantId,
  onSelectMenuItem,
  onSelectCategory,
  filteredCount,
  inputRef,
}: MenuSearchFilterProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const localInputRef = useRef<HTMLInputElement>(null);
  const resolvedInputRef = inputRef || localInputRef;

  const [isFocused, setIsFocused] = useState(false);
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
  const [draftFilters, setDraftFilters] = useState<MenuFilterOptions>(filters);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  // Keep draft filters in sync when opened
  useEffect(() => {
    if (isFilterSheetOpen) {
      setDraftFilters(filters);
    }
  }, [isFilterSheetOpen, filters]);

  // Load recent searches from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(getStorageKey(restaurantId));
      if (raw) {
        setRecentSearches(JSON.parse(raw));
      }
    } catch {
      setRecentSearches([]);
    }
  }, [restaurantId]);

  // Save term to recent searches
  const saveRecentSearch = (term: string) => {
    const trimmed = term.trim();
    if (!trimmed || trimmed.length < 2) return;
    try {
      const updated = [
        trimmed,
        ...recentSearches.filter((s) => s.toLowerCase() !== trimmed.toLowerCase()),
      ].slice(0, 6);
      setRecentSearches(updated);
      localStorage.setItem(getStorageKey(restaurantId), JSON.stringify(updated));
    } catch {
      // ignore local storage errors
    }
  };

  // Remove individual recent search
  const removeRecentSearch = (e: React.MouseEvent, term: string) => {
    e.stopPropagation();
    try {
      const updated = recentSearches.filter((s) => s.toLowerCase() !== term.toLowerCase());
      setRecentSearches(updated);
      localStorage.setItem(getStorageKey(restaurantId), JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  // Clear all recent searches
  const clearAllRecentSearches = (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      setRecentSearches([]);
      localStorage.removeItem(getStorageKey(restaurantId));
    } catch {
      // ignore
    }
  };

  // Close dropdown on outside clicks
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsFocused(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, []);

  // Compute live autocomplete matched items (up to 5 items)
  const matchedSuggestions = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    const tokens = q.split(/\s+/).filter(Boolean);

    return menuItems
      .filter((item) => {
        const name = (item.name || "").toLowerCase();
        const category = (item.category?.name || "").toLowerCase();
        const desc = (item.description || "").toLowerCase();
        const tags = Array.isArray(item.tags)
          ? item.tags.map((t) => String(t).toLowerCase()).join(" ")
          : "";
        const combined = `${name} ${category} ${desc} ${tags}`;
        return tokens.every((token) => combined.includes(token));
      })
      .slice(0, 6);
  }, [menuItems, searchQuery]);

  // Count active non-default filters
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.dietary !== "all") count++;
    if (filters.popularOnly) count++;
    if (filters.sortBy !== "default") count++;
    return count;
  }, [filters]);

  const handleClearInput = () => {
    onSearchChange("");
    resolvedInputRef.current?.focus();
  };

  const handleSelectSuggestion = (item: MenuItem) => {
    saveRecentSearch(item.name);
    setIsFocused(false);
    if (onSelectMenuItem) {
      onSelectMenuItem(item);
    }
  };

  const handleSelectRecentSearch = (term: string) => {
    onSearchChange(term);
    saveRecentSearch(term);
    setIsFocused(false);
  };

  const handleSelectQuickCategory = (catName: string) => {
    if (onSelectCategory) {
      onSelectCategory(catName);
    }
    onSearchChange("");
    setIsFocused(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      if (searchQuery.trim()) {
        saveRecentSearch(searchQuery);
      }
      setIsFocused(false);
      resolvedInputRef.current?.blur();
    } else if (e.key === "Escape") {
      setIsFocused(false);
      resolvedInputRef.current?.blur();
    }
  };

  // Draft filters count in modal
  const draftActiveCount = useMemo(() => {
    let count = 0;
    if (draftFilters.dietary !== "all") count++;
    if (draftFilters.popularOnly) count++;
    if (draftFilters.sortBy !== "default") count++;
    return count;
  }, [draftFilters]);

  const handleApplyFilters = () => {
    onFiltersChange(draftFilters);
    setIsFilterSheetOpen(false);
  };

  const handleResetDraftFilters = () => {
    setDraftFilters(DEFAULT_MENU_FILTERS);
  };

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Search Input Bar */}
      <div className="relative flex items-center group">
        <Search
          className={`absolute left-3.5 w-4 h-4 transition-colors pointer-events-none ${
            isFocused ? "text-emerald-500" : "text-zinc-400 dark:text-zinc-500"
          }`}
        />

        <Input
          ref={resolvedInputRef}
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search dishes, ingredients, categories..."
          className="pl-10 pr-20 h-11 rounded-2xl bg-zinc-100/80 dark:bg-zinc-900/60 border border-zinc-200/60 dark:border-zinc-800/60 text-sm placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus-visible:ring-1 focus-visible:ring-emerald-500/30 focus-visible:border-emerald-500/50 transition-all shadow-[0_2px_12px_rgba(0,0,0,0.02)]"
        />

        {/* Clear Button */}
        {searchQuery.length > 0 && (
          <button
            type="button"
            onClick={handleClearInput}
            className="absolute right-10 p-1.5 rounded-full text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-200/50 dark:hover:bg-zinc-800 transition-colors"
            title="Clear search"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Interactive Filter Button */}
        <button
          type="button"
          onClick={() => setIsFilterSheetOpen(true)}
          className={`absolute right-2 p-2 rounded-xl transition-all ${
            activeFilterCount > 0
              ? "bg-emerald-500 text-white shadow-sm shadow-emerald-500/20 active:scale-95"
              : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-200/60 dark:hover:bg-zinc-800 active:scale-95"
          }`}
          title="Filter and Sort"
        >
          <div className="relative">
            <SlidersHorizontal className="w-4 h-4" />
            {activeFilterCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 min-w-[14px] h-[14px] rounded-full bg-white text-emerald-600 dark:bg-zinc-950 dark:text-emerald-400 text-[9px] font-black flex items-center justify-center leading-none border border-emerald-500">
                {activeFilterCount}
              </span>
            )}
          </div>
        </button>
      </div>

      {/* Interactive Autocomplete & Suggestions Dropdown */}
      {isFocused && (
        <div className="absolute left-0 right-0 top-full mt-2 z-50 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-2xl border border-zinc-200/80 dark:border-zinc-800/80 rounded-2xl shadow-[0_12px_36px_rgba(0,0,0,0.12)] overflow-hidden animate-in fade-in-0 zoom-in-95 duration-150 divide-y divide-zinc-100 dark:divide-zinc-900">
          {/* Case 1: Empty Query - Recent Searches & Quick Categories */}
          {searchQuery.trim().length === 0 ? (
            <div className="p-3 space-y-3.5">
              {/* Recent Searches */}
              {recentSearches.length > 0 && (
                <div>
                  <div className="flex items-center justify-between pb-1.5 px-0.5">
                    <span className="text-[11px] font-bold text-zinc-400 dark:text-zinc-500 flex items-center gap-1 uppercase tracking-wider">
                      <Clock className="w-3 h-3 text-zinc-400" /> Recent Searches
                    </span>
                    <button
                      type="button"
                      onClick={clearAllRecentSearches}
                      className="text-[10px] font-semibold text-zinc-400 hover:text-rose-500 transition-colors"
                    >
                      Clear all
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {recentSearches.map((term) => (
                      <div
                        key={term}
                        onClick={() => handleSelectRecentSearch(term)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-zinc-100 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:bg-emerald-50 hover:text-emerald-700 dark:hover:bg-emerald-950/40 dark:hover:text-emerald-300 border border-zinc-200/50 dark:border-zinc-800 cursor-pointer transition-colors group"
                      >
                        <span>{term}</span>
                        <button
                          type="button"
                          onClick={(e) => removeRecentSearch(e, term)}
                          className="text-zinc-400 hover:text-rose-500 p-0.5 rounded-full"
                          title="Remove"
                        >
                          <X className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Quick Categories */}
              {categories.length > 0 && (
                <div>
                  <div className="flex items-center justify-between pb-1.5 px-0.5">
                    <span className="text-[11px] font-bold text-zinc-400 dark:text-zinc-500 flex items-center gap-1 uppercase tracking-wider">
                      <Sparkles className="w-3 h-3 text-emerald-500" /> Popular Categories
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {categories
                      .filter(
                        (c) =>
                          c.name.toLowerCase() !== "uncategorized" &&
                          c.name.toLowerCase() !== "all"
                      )
                      .slice(0, 6)
                      .map((cat) => (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => handleSelectQuickCategory(cat.name)}
                          className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500 hover:text-white transition-all"
                        >
                          {cat.name}
                        </button>
                      ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Case 2: Query Typed - Real-time Autocomplete Suggestions */
            <div>
              <div className="px-3.5 py-2 bg-zinc-50/50 dark:bg-zinc-900/30 flex items-center justify-between">
                <span className="text-[11px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                  Menu Suggestions ({matchedSuggestions.length})
                </span>
                <span className="text-[10px] text-zinc-400">Tap dish for details</span>
              </div>

              {matchedSuggestions.length > 0 ? (
                <div className="divide-y divide-zinc-100 dark:divide-zinc-900 max-h-64 overflow-y-auto">
                  {matchedSuggestions.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => handleSelectSuggestion(item)}
                      className="p-2.5 sm:p-3 flex items-center gap-3 hover:bg-zinc-50 dark:hover:bg-zinc-900/70 cursor-pointer transition-colors"
                    >
                      {/* Food Thumbnail */}
                      <div className="w-10 h-10 rounded-lg bg-zinc-100 dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800 shrink-0 overflow-hidden flex items-center justify-center">
                        {item.image_url ? (
                          <img
                            src={item.image_url}
                            alt={item.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = "none";
                            }}
                          />
                        ) : (
                          <UtensilsCrossed className="w-4 h-4 text-zinc-400" />
                        )}
                      </div>

                      {/* Name & Category */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate">
                            {item.name}
                          </p>
                          {item.is_vegetarian && (
                            <Leaf className="w-3 h-3 text-emerald-500 shrink-0" />
                          )}
                          {item.is_popular && (
                            <Flame className="w-3 h-3 text-amber-500 shrink-0" />
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          {item.category?.name && (
                            <span className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400 truncate">
                              {item.category.name}
                            </span>
                          )}
                          <span
                            className={`text-[9px] font-bold px-1 py-0.2 rounded ${
                              item.is_available
                                ? "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-400"
                                : "text-zinc-400 bg-zinc-100 dark:bg-zinc-800"
                            }`}
                          >
                            {item.is_available ? "In Stock" : "Sold Out"}
                          </span>
                        </div>
                      </div>

                      {/* Price */}
                      <div className="shrink-0 text-right">
                        <p className="text-xs sm:text-sm font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
                          {currencySymbol}
                          {Number(item.price).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}

                  {/* Footer hint */}
                  <div
                    onClick={() => {
                      saveRecentSearch(searchQuery);
                      setIsFocused(false);
                    }}
                    className="p-2.5 text-center text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 cursor-pointer transition-colors"
                  >
                    View all {matchedSuggestions.length} results in menu
                  </div>
                </div>
              ) : (
                <div className="py-6 px-4 text-center">
                  <UtensilsCrossed className="w-6 h-6 mx-auto text-zinc-400 mb-1.5" />
                  <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    No dishes found matching "{searchQuery}"
                  </p>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    Try searching by ingredient, category, or dish name
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Filter & Sort Bottom Sheet */}
      <Sheet open={isFilterSheetOpen} onOpenChange={setIsFilterSheetOpen}>
        <SheetContent
          side="bottom"
          className="rounded-t-3xl border-t border-zinc-200 dark:border-zinc-800 max-h-[85vh] overflow-y-auto px-5 py-6 bg-white dark:bg-zinc-950"
        >
          <SheetHeader className="text-left pb-4 border-b border-zinc-100 dark:border-zinc-900">
            <div className="flex items-center justify-between">
              <div>
                <SheetTitle className="text-lg font-black tracking-tight text-zinc-900 dark:text-zinc-50">
                  Filter & Sort Menu
                </SheetTitle>
                <SheetDescription className="text-xs text-zinc-500 dark:text-zinc-400">
                  Refine your dining preferences and dish order
                </SheetDescription>
              </div>
              {draftActiveCount > 0 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleResetDraftFilters}
                  className="h-8 text-xs font-bold text-zinc-500 hover:text-rose-500 gap-1 px-2"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Reset
                </Button>
              )}
            </div>
          </SheetHeader>

          <div className="space-y-6 py-4">
            {/* 1. Dietary Preference */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 block mb-2.5">
                Dietary Preference
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: "all", label: "All Items", icon: Utensils, desc: "Everything on menu" },
                  { id: "veg", label: "Pure Veg", icon: Leaf, desc: "Vegetarian only" },
                  { id: "non-veg", label: "Non-Veg", icon: UtensilsCrossed, desc: "Chicken, Mutton, Fish" },
                  { id: "vegan", label: "Vegan", icon: Sparkles, desc: "100% Plant-based" },
                ].map((diet) => {
                  const Icon = diet.icon;
                  const isSelected = draftFilters.dietary === diet.id;
                  return (
                    <button
                      key={diet.id}
                      type="button"
                      onClick={() =>
                        setDraftFilters((prev) => ({
                          ...prev,
                          dietary: diet.id as MenuFilterOptions["dietary"],
                        }))
                      }
                      className={`p-3 rounded-2xl border text-left flex items-start gap-2.5 transition-all ${
                        isSelected
                          ? "bg-emerald-500/10 border-emerald-500 text-emerald-900 dark:text-emerald-100 shadow-sm"
                          : "border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900/50"
                      }`}
                    >
                      <div
                        className={`p-1.5 rounded-xl shrink-0 ${
                          isSelected
                            ? "bg-emerald-500 text-white"
                            : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-extrabold truncate">{diet.label}</p>
                        <p className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate">
                          {diet.desc}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Highlights */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 block mb-2.5">
                Highlights
              </label>
              <button
                type="button"
                onClick={() =>
                  setDraftFilters((prev) => ({
                    ...prev,
                    popularOnly: !prev.popularOnly,
                  }))
                }
                className={`w-full p-3 rounded-2xl border flex items-center justify-between transition-all ${
                  draftFilters.popularOnly
                    ? "bg-amber-500/10 border-amber-500 text-amber-900 dark:text-amber-100 shadow-sm"
                    : "border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900/50"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className={`p-1.5 rounded-xl ${
                      draftFilters.popularOnly
                        ? "bg-amber-500 text-white"
                        : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
                    }`}
                  >
                    <Flame className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-extrabold">Popular & Chef's Specials</p>
                    <p className="text-[10px] text-zinc-500 dark:text-zinc-400">
                      Show customer favorites and recommended dishes
                    </p>
                  </div>
                </div>
                <div
                  className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
                    draftFilters.popularOnly
                      ? "bg-amber-500 border-amber-500 text-white"
                      : "border-zinc-300 dark:border-zinc-700"
                  }`}
                >
                  {draftFilters.popularOnly && <Check className="w-3 h-3 stroke-[3]" />}
                </div>
              </button>
            </div>

            {/* 3. Sorting */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 block mb-2.5">
                Sort Dishes By
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: "default", label: "Default Order", icon: ArrowUpDown },
                  { id: "price-asc", label: "Price: Low to High", icon: ArrowUp },
                  { id: "price-desc", label: "Price: High to Low", icon: ArrowDown },
                  { id: "name-asc", label: "Name: A to Z", icon: Sparkles },
                ].map((sort) => {
                  const Icon = sort.icon;
                  const isSelected = draftFilters.sortBy === sort.id;
                  return (
                    <button
                      key={sort.id}
                      type="button"
                      onClick={() =>
                        setDraftFilters((prev) => ({
                          ...prev,
                          sortBy: sort.id as MenuFilterOptions["sortBy"],
                        }))
                      }
                      className={`p-2.5 rounded-2xl border text-left flex items-center gap-2 transition-all ${
                        isSelected
                          ? "bg-emerald-500/10 border-emerald-500 text-emerald-900 dark:text-emerald-100 font-bold"
                          : "border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 text-zinc-700 dark:text-zinc-300 font-medium"
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span className="text-xs truncate">{sort.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <SheetFooter className="pt-4 border-t border-zinc-100 dark:border-zinc-900 flex-row gap-3 sm:justify-between">
            <Button
              type="button"
              variant="outline"
              className="flex-1 rounded-xl h-11 text-xs font-bold"
              onClick={() => setIsFilterSheetOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="flex-1 rounded-xl h-11 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/20"
              onClick={handleApplyFilters}
            >
              Apply Filters {filteredCount !== undefined ? `(${filteredCount})` : ""}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}
