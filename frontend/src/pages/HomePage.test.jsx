import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("../components/CategoryItem", () => ({
    default: ({ category }) => <div>{category.name}</div>,
}));

vi.mock("../components/FeaturedProducts", () => ({
    default: ({ featuredProducts }) => (
        <div data-testid="featured-products">{featuredProducts.length} featured products</div>
    ),
}));

vi.mock("../stores/useProductStore", () => ({
    useProductStore: () => ({
        fetchFeaturedProducts: vi.fn(),
        products: [{ _id: "1", name: "Classic Jacket" }],
        isLoading: false,
    }),
}));

import HomePage from "./HomePage";

describe("HomePage", () => {
    it("renders the category catalogue and featured products", () => {
        render(<HomePage />);

        expect(screen.getByRole("heading", { name: /explore our categories/i })).toBeInTheDocument();
        expect(screen.getByText("Jeans")).toBeInTheDocument();
        expect(screen.getByText("T-shirts")).toBeInTheDocument();
        expect(screen.getByTestId("featured-products")).toHaveTextContent("1 featured products");
    });
});
