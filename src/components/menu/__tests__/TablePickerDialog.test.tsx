import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { TablePickerDialog } from "../TablePickerDialog";
import type { Table } from "@/hooks/useTables";

const makeTables = (count: number): Table[] =>
  Array.from({ length: count }, (_, i) => ({
    id: `uuid-${i}`,
    restaurant_id: "r1",
    table_number: `T${i + 1}`,
    capacity: 4,
    status: "available",
    is_active: true,
    qr_code_url: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }));

describe("TablePickerDialog", () => {
  it("renders table buttons for active tables", () => {
    render(
      <TablePickerDialog
        open={true}
        tables={makeTables(3)}
        restaurantName="Test Restaurant"
        onSelectTable={() => {}}
      />
    );
    expect(screen.getByText("T1")).toBeInTheDocument();
    expect(screen.getByText("T2")).toBeInTheDocument();
    expect(screen.getByText("T3")).toBeInTheDocument();
  });

  it("calls onSelectTable with correct table number on click", () => {
    const onSelect = vi.fn();
    render(
      <TablePickerDialog
        open={true}
        tables={makeTables(2)}
        restaurantName="Test"
        onSelectTable={onSelect}
      />
    );
    fireEvent.click(screen.getByText("T2"));
    expect(onSelect).toHaveBeenCalledWith("T2");
  });

  it("shows empty state when no tables are available", () => {
    render(
      <TablePickerDialog
        open={true}
        tables={[]}
        restaurantName="Test"
        onSelectTable={() => {}}
      />
    );
    expect(screen.getByText("No tables available at the moment.")).toBeInTheDocument();
  });

  it("filters out inactive tables", () => {
    const tables = makeTables(2);
    tables[1].is_active = false;
    render(
      <TablePickerDialog
        open={true}
        tables={tables}
        restaurantName="Test"
        onSelectTable={() => {}}
      />
    );
    expect(screen.getByText("T1")).toBeInTheDocument();
    expect(screen.queryByText("T2")).not.toBeInTheDocument();
  });
});
