import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { PixCheckout } from "./pix-checkout";

const product = {
  id: "cafe-especial",
  title: "Café especial 250g",
  description: "Grãos torrados da Mantiqueira de Minas.",
  priceCents: 4890,
};

describe("PixCheckout", () => {
  it("creates the charge and shows the qr code", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      Response.json(
        {
          orderId: "order-1",
          paymentId: 1325012345,
          amountCents: 4890,
          qrCode: "00020126580014br.gov.bcb.pix",
          qrCodeBase64: "iVBORw0KGgo=",
          expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
        },
        { status: 201 },
      ),
    );
    const user = userEvent.setup();
    render(<PixCheckout product={product} />);

    await user.type(screen.getByLabelText("E-mail"), "comprador@example.com");
    await user.click(screen.getByRole("button", { name: /gerar pix/i }));

    expect(await screen.findByAltText("QR Code Pix")).toBeInTheDocument();
    expect(screen.getByDisplayValue("00020126580014br.gov.bcb.pix")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith("/api/pix", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId: "cafe-especial", email: "comprador@example.com" }),
    });
  });

  it("shows the error returned by the api", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      Response.json({ error: "Não foi possível gerar o Pix" }, { status: 502 }),
    );
    const user = userEvent.setup();
    render(<PixCheckout product={product} />);

    await user.type(screen.getByLabelText("E-mail"), "comprador@example.com");
    await user.click(screen.getByRole("button", { name: /gerar pix/i }));

    expect(await screen.findByText("Não foi possível gerar o Pix")).toBeInTheDocument();
  });
});
