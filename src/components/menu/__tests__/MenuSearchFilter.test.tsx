import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MenuSearchFilter, DEFAULT_MENU_FILTERS } from "../MenuSearchFilter";
import type { MenuItem } from "@/hooks/useMenuItems";

const mockMenuItems: MenuItem[] = [
  {
    id: "item-1",
    restaurant_id: "r1",
    name: "Chicken Biryani",
    description: "Fragrant basmati rice cooked with succulent chicken and aromatic spices",
    price: 250,
    category_id: "c1",
    category: { id: "c1", name: "Briyani", display_order: 1 },
    is_available: true,
    is_popular: true,
    is_vegetarian: false,
    is_vegan: false,
    image_url: "https://example.com/biryani.jpg",
    addon_group_ids: null,
    created_at: null,
    display_order: 1,
    prep_time_minutes: 20,
    spicy_level: 2,
    tags: ["bestseller", "spicy"],
    updated_at: null,
  },
  {
    id: "item-2",
    restaurant_id: "r1",
    name: "Tomato Soup",
    description: "Creamy fresh tomato soup served with croutons",
    price: 120,
    category_id: "c2",
    category: { id: "c2", name: "soup", display_order: 2 },
    is_available: true,
    is_popular: false,
    is_vegetarian: true,
    is_vegan: true,
    image_url: null,
    addon_group_ids: null,
    created_at: null,
    display_order: 2,
    prep_time_minutes: 10,
    spicy_level: 1,
    tags: ["healthy"],
    updated_at: null,
  },
];

describe("MenuSearchFilter", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("renders search input with placeholder", () => {
    render(
      <MenuSearchFilter
        searchQuery=""
        onSearchChange={() => {}}
        filters={DEFAULT_MENU_FILTERS}
        onFiltersChange={() => {}}
        menuItems={mockMenuItems}
        categories={[{ id: "c1", name: "Briyani" }, { id: "c2", name: "soup" }]}
      />
    );

    expect(screen.getByPlaceholderText(/Search dishes, ingredients, categories/i)).toBeInTheDocument();
  });

  it("triggers onSearchChange when user types", () => {
    const handleSearchChange = vi.fn();
    render(
      <MenuSearchFilter
        searchQuery=""
        onSearchChange={handleSearchChange}
        filters={DEFAULT_MENU_FILTERS}
        onFiltersChange={() => {}}
        menuItems={mockMenuItems}
      />
    );

    const input = screen.getByPlaceholderText(/Search dishes, ingredients, categories/i);
    fireEvent.change(input, { target: { value: "biryani" } });
    expect(handleSearchChange).toHaveBeenCalledWith("biryani");
  });

  it("renders clear button when query is not empty and clears input", () => {
    const handleSearchChange = vi.fn();
    render(
      <MenuSearchFilter
        searchQuery="biryani"
        onSearchChange={handleSearchChange}
        filters={DEFAULT_MENU_FILTERS}
        onFiltersChange={() => {}}
        menuItems={mockMenuItems}
      />
    );

    const clearButton = screen.getByTitle("Clear search");
    expect(clearButton).toBeInTheDocument();
    fireEvent.click(clearButton);
    expect(handleSearchChange).toHaveBeenCalledWith("");
  });

  it("shows matched suggestions dropdown when query matches items and item is selectable", () => {
    const handleSelect = vi.fn();
    render(
      <MenuSearchFilter
        searchQuery="tomato"
        onSearchChange={() => {}}
        filters={DEFAULT_MENU_FILTERS}
        onFiltersChange={() => {}}
        menuItems={mockMenuItems}
        onSelectMenuItem={handleSelect}
      />
    );

    const input = screen.getByPlaceholderText(/Search dishes, ingredients, categories/i);
    fireEvent.focus(input);

    expect(screen.getByText("Tomato Soup")).toBeInTheDocument();
    expect(screen.getByText("In Stock")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Tomato Soup"));
    expect(handleSelect).toHaveBeenCalledWith(mockMenuItems[1]);
  });
});
