import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { RestaurantMenuBanner } from "../RestaurantMenuBanner";

describe("RestaurantMenuBanner", () => {
  it("renders restaurant name and tagline", () => {
    render(
      <RestaurantMenuBanner
        restaurantName="Arun Hotel"
        tagline="Best biryani in town"
        tableNumber="T1"
        seatNumber={2}
        rating={4.8}
        totalReviews={124}
        city="Chennai"
      />
    );

    expect(screen.getByText("Arun Hotel")).toBeInTheDocument();
    expect(screen.getByText("Best biryani in town")).toBeInTheDocument();
    expect(screen.getByText("Table T1")).toBeInTheDocument();
    expect(screen.getByText("Seat 2")).toBeInTheDocument();
    expect(screen.getByText("4.8")).toBeInTheDocument();
    expect(screen.getByText("(124)")).toBeInTheDocument();
    expect(screen.getByText("Chennai")).toBeInTheDocument();
    expect(screen.getByText("Dine-In")).toBeInTheDocument();
  });

  it("handles fallback tagline and missing props gracefully", () => {
    render(
      <RestaurantMenuBanner
        restaurantName="Simple Cafe"
      />
    );

    expect(screen.getByText("Simple Cafe")).toBeInTheDocument();
    expect(screen.getByText(/Authentic Flavors/i)).toBeInTheDocument();
    expect(screen.getByText("Dine-In")).toBeInTheDocument();
  });
});
