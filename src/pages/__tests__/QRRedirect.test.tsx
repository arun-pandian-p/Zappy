import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import QRRedirect from "../QRRedirect";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, useParams } from "react-router-dom";

// Mock react-router-dom
vi.mock("react-router-dom", () => ({
  useParams: vi.fn(),
  useNavigate: vi.fn(),
}));

// Mock supabase
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(),
        })),
      })),
      insert: vi.fn(() => Promise.resolve({ error: null })),
    })),
    rpc: vi.fn(() => Promise.resolve({ error: null })),
  },
}));

describe("QRRedirect Component", () => {
  const mockNavigate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useNavigate).mockReturnValue(mockNavigate);
    
    // Mock window.location.replace
    Object.defineProperty(window, "location", {
      writable: true,
      value: {
        origin: "https://www.zappy.ind.in",
        search: "",
        replace: vi.fn(),
      },
    });
  });

  it("shows error when QR ID is invalid/missing", async () => {
    vi.mocked(useParams).mockReturnValue({ id: "" });

    render(<QRRedirect />);

    await waitFor(() => {
      expect(screen.getByText("QR Code Unavailable")).toBeInTheDocument();
      expect(screen.getByText("Invalid QR Code Link")).toBeInTheDocument();
    });
  });

  it("fetches QR code and redirects to relative target URL", async () => {
    const qrId = "12345678-1234-1234-1234-123456789abc";
    vi.mocked(useParams).mockReturnValue({ id: qrId });

    const mockQRData = {
      id: qrId,
      tenant_id: "test-tenant-id",
      qr_name: "Table 5",
      target_url: "/order?r=test-tenant-id&table=5",
      qr_type: "dynamic",
      is_active: true,
    };

    const singleMock = vi.fn().mockResolvedValue({ data: mockQRData, error: null });
    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: singleMock,
        }),
      }),
      insert: vi.fn().mockResolvedValue({ error: null }),
    } as any);

    render(<QRRedirect />);

    await waitFor(() => {
      expect(singleMock).toHaveBeenCalled();
    });

    // Check redirection was triggered via react-router-dom navigate for relative URLs
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/order?r=test-tenant-id&table=5", { replace: true });
    }, { timeout: 1000 });
  });

  it("redirects to external target URL via window.location.replace", async () => {
    const qrId = "87654321-4321-4321-4321-cba987654321";
    vi.mocked(useParams).mockReturnValue({ id: qrId });

    const mockQRData = {
      id: qrId,
      tenant_id: "test-tenant-id",
      qr_name: "External Promo",
      target_url: "https://external.com/promo",
      qr_type: "dynamic",
      is_active: true,
    };

    const singleMock = vi.fn().mockResolvedValue({ data: mockQRData, error: null });
    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: singleMock,
        }),
      }),
      insert: vi.fn().mockResolvedValue({ error: null }),
    } as any);

    render(<QRRedirect />);

    await waitFor(() => {
      expect(singleMock).toHaveBeenCalled();
    });

    // Check redirection was triggered via window.location.replace for external URLs
    await waitFor(() => {
      expect(window.location.replace).toHaveBeenCalledWith("https://external.com/promo");
    }, { timeout: 1000 });
  });

  it("shows error when QR code is inactive", async () => {
    const qrId = "00000000-0000-0000-0000-000000000000";
    vi.mocked(useParams).mockReturnValue({ id: qrId });

    const mockQRData = {
      id: qrId,
      tenant_id: "test-tenant-id",
      qr_name: "Table 5",
      target_url: "/order?r=test-tenant-id",
      qr_type: "dynamic",
      is_active: false,
    };

    const singleMock = vi.fn().mockResolvedValue({ data: mockQRData, error: null });
    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: singleMock,
        }),
      }),
      insert: vi.fn().mockResolvedValue({ error: null }),
    } as any);

    render(<QRRedirect />);

    await waitFor(() => {
      expect(screen.getByText("This QR code is inactive or does not exist.")).toBeInTheDocument();
    });
  });
});
