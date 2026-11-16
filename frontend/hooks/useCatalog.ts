import { useRef } from "react";
import { useState, useEffect } from "react";
import type { Product } from "../products";
import { getProducts } from "../services/products";
export function useCatalog() {
  const [catalogProducts, setCatalogProducts] = useState<Product[]>([]);
  const [isCatalogLoading, setIsCatalogLoading] = useState(true);
  const [catalogError, setCatalogError] = useState("");
  const catalogControllerRef = useRef<AbortController | null>(null);
  useEffect(() => {
    void loadCatalog();
    return () => {
      catalogControllerRef.current?.abort();
    };
  }, []);
  async function loadCatalog() {
    const controller = new AbortController();
    catalogControllerRef.current?.abort();
    catalogControllerRef.current = controller;
    const signal = controller.signal;
    setIsCatalogLoading(true);
    setCatalogError("");
    try {
      const loadedProducts = await getProducts(signal);
      if (!signal.aborted) {
        setCatalogProducts(loadedProducts);
      }
    } catch {
      if (!signal.aborted) {
        setCatalogError("Nie udało się załadować katalogu. Spróbuj ponownie.");
      }
    } finally {
      if (!signal.aborted) {
        setIsCatalogLoading(false);
      }
    }
  }
  return {
    catalogProducts,
    isCatalogLoading,
    catalogError,
    loadCatalog,
  };
}
